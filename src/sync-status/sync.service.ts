import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { SyncDataDto } from './dto/sync-data.dto';
import { SyncStatus } from 'src/entities/sync-status.entity';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncStatus)
    private readonly syncRepo: Repository<SyncStatus>,
    private readonly httpService: HttpService,
  ) {}
  async saveFailedRequest(data: SyncDataDto) {
    console.log('📥 Received data:', JSON.stringify(data, null, 2));
    console.log('🔑 Received headers:', JSON.stringify(data.headers, null, 2));
  
    // สร้าง tempId สำหรับ POST
    const tempId = uuidv4();
  
    // ถ้าเป็น POST, เก็บ tempId
    if (data.method === 'POST') {
      const syncStatus = this.syncRepo.create({
        id: uuidv4(),
        path: data.path,
        method: data.method,
        payload: data.payload,
        headers: {
          'Content-Type': 'application/json',
          'owner-id': data.headers?.owner_id,
          'branch-id': data.headers?.branch_id,
        },
        owner_id: data.headers?.owner_id,
        branch_id: data.headers?.branch_id,
        synced: false,
        retryCount: 0,
        statusCode: data.statusCode,
        tempId, // ใส่ tempId สำหรับ POST
      });
  
      await this.syncRepo.save(syncStatus);
    } else if (data.method === 'DELETE') {
      // หา tempId ของ POST ที่เกี่ยวข้องแล้วบันทึกใน relatedTempId
      const postItem = await this.syncRepo.findOne({
        where: {
          path: data.path.replace('{replace-this}', ''), // หา path ที่ไม่ใช่ด้วย id
          method: 'POST',
          synced: true, // มันต้องถูก sync สำเร็จแล้ว
        },
        order: { createdAt: 'ASC' },
      });
  console.log('path is ',postItem)
      const relatedTempId = postItem ? postItem.tempId : null;
  
      const syncStatus = this.syncRepo.create({
        id: uuidv4(),
        path: data.path,
        method: data.method,
        payload: data.payload,
        headers: {
          'Content-Type': 'application/json',
          'owner-id': data.headers?.owner_id,
          'branch-id': data.headers?.branch_id,
        },
        owner_id: data.headers?.owner_id,
        branch_id: data.headers?.branch_id,
        synced: false,
        retryCount: 0,
        statusCode: data.statusCode,
        relatedTempId, // เก็บ tempId ของ POST ที่เกี่ยวข้อง
      });
  
      await this.syncRepo.save(syncStatus);
    }
  }
  

  async processSyncQueue() {
    const queue = await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' },
    });
  
    // tempId (จาก POST) → serverGeneratedId
    const tempIdMap = new Map<string, string>();
  
    for (const item of queue) {
      if (!item.path) {
        console.warn(`⚠️ Skipping item ID: ${item.id} — path is null`);
        continue;
      }
      // ตรวจว่าเป็น DELETE และต้องมี relatedTempId
      if (item.method === 'DELETE' && item.relatedTempId) {
        const relatedPost = await this.syncRepo.findOne({
          where: { tempId: item.relatedTempId },
        });
      
        const serverId = relatedPost?.serverGeneratedId;
      
        if (!serverId) {
          console.log(`⏭️ Skipping DELETE - missing serverGeneratedId for tempId ${item.relatedTempId}`);
          continue;
        }
      
        item.path = item.path.replace('{replace-this}', serverId);
console.log(`🔄 Final DELETE path: ${item.path}`);

// ✅ แก้จุดสำคัญนี้:
await this.syncRepo.save(item);

      }
  
      const result = await this.sendRequestToServer(item);

if (item.method === 'POST' && result && result.serverGeneratedId && item.tempId) {
  tempIdMap.set(item.tempId, result.serverGeneratedId);
  item.serverGeneratedId = result.serverGeneratedId;
  await this.syncRepo.save(item);
}

console.log('✅ READY TO SEND', {
  id: item.id,
  method: item.method,
  path: item.path,
  relatedTempId: item.relatedTempId,
});

      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  
  

  async sendRequestToServer(data: SyncStatus): Promise<{ serverGeneratedId?: string } | void> {
    try {
      console.log(`📤 Sending to SERVER: ${data.method} ${data.path}`);
      if (data.path.includes('{replace-this}')) {
        console.warn(`⛔️ BLOCKED SYNC: path still contains placeholder! ID: ${data.id}`);
        return;
      }
      
      const response = await axios({
        method: data.method.toLowerCase(),
        url: data.path,
        data: data.payload,
        headers: {
          'Content-Type': 'application/json',
          owner_id: data.owner_id,
          branch_id: data.branch_id,
        },
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        data.synced = true;
        data.statusCode = response.status;

        console.log(`✅ Synced: ${data.method} ${data.path}`);

        if (data.method === 'POST' && response.data?.id) {
          data.serverGeneratedId = response.data.id;
          await this.syncRepo.save(data);

        }

        await this.syncRepo.remove(data);
        console.log(`🗑️ Removed synced record ID: ${data.id}`);

        return {
          serverGeneratedId: data.serverGeneratedId,
        };
      }
    } catch (error) {
      data.retryCount += 1;
      data.statusCode = error.response?.status || 500;

      if (error.response?.status === 409) {
        console.log(`⚠️ Already exists on server`);
        data.synced = true;
        data.errorMessage = '409 Conflict';
      } else {
        console.error(`❌ Sync failed:`, error.message);
        data.errorMessage = error.response?.data?.message || error.message;
      }

      if (data.retryCount >= 3) {
      
        console.log(`🚫 Max retry reached for ID: ${data.id}`);
      }

      await this.syncRepo.save(data);
    }
  }
  
  async getPendingSyncs() {
    return await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' },
    });
  }

  async clearAllSyncs() {
    await this.syncRepo.clear();
    return { message: 'All sync records cleared' };
  }
}