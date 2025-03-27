import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  //   async handleStatus(isOnline: boolean) {
  //     if (isOnline) {
  //       await this.retryFailedQueue();
  //     }
  //   }

  async saveFailedRequest(data: SyncDataDto) {
    const syncStatus = this.syncRepo.create({
      id: uuidv4(),
      ...data,
      synced: false,
      retryCount: 0,
    });
    const savedSyncStatus = await this.syncRepo.save(syncStatus);
    console.log(`✅ Saved sync status to local database: ${savedSyncStatus.id}`);

    // ส่งข้อมูลไปยัง server ทันที
    // await this.sendRequestToServer(savedSyncStatus);

  }

  //   async retryFailedQueue() {
  //     const failedItems = await this.syncRepo.find({
  //       where: { synced: false },
  //       order: { createdAt: 'ASC' },
  //     });

  //     for (const item of failedItems) {
  //       try {
  //         const response = await axios({
  //           method: item.method.toLowerCase(),
  //           url: item.path,
  //           data: item.payload,
  //           headers: {
  //             'Content-Type': 'application/json',

  //           },
  //         });

  //         if (response.status >= 200 && response.status < 300) {
  //           item.synced = true;
  //           console.log(`✅ Successfully synced: ${item.path}`);
  //           await this.syncRepo.delete(item.id);
  //         }
  //       } catch (error) {
  //         item.retryCount += 1;
  //         console.error(`❌ Retry failed for ${item.path}`, error.message);

  //         if (item.retryCount >= 3) {
  //           item.synced = true;
  //           console.log(`⚠️ Max retry attempts reached for ${item.path}`);
  //         }
  //       }

  //       await this.syncRepo.save(item);

  //       await new Promise(resolve => setTimeout(resolve, 1000));
  //     }
  //   }
  async processSyncQueue() {
    const failedItems = await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' }, // เลือกข้อมูลที่เก่าที่สุดก่อน
    });

    for (const item of failedItems) {
      await this.sendRequestToServer(item); // เรียกใช้ sendRequestToServer เพื่อส่งข้อมูล
    }
  }
  async sendRequestToServer(data: SyncStatus) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'owner-id': data.headers?.['owner_id'] || 'default_owner_id',
        'branch-id': data.headers?.['branch_id'] || 'default_branch_id',
      };
  
      console.log(`📤 Sending to SERVER: ${data.path}`);
      const response = await axios({
        method: data.method.toLowerCase(),
        url: data.path, // <-- path ที่เป็น server จริง เช่น 192.168.3.73
        data: data.payload,
        headers,
      });
  
      if (response.status >= 200 && response.status < 300) {
        data.synced = true;
        data.statusCode = response.status;
        console.log(`✅ Successfully synced to server`);
  
        // ✅ ใช้ .remove() แทน delete() เพื่อมั่นใจว่าลบได้จริง
        await this.syncRepo.remove(data);

        console.log(`🗑️ Removed synced record ID: ${data.id}`);
      }
    } catch (error) {
      data.retryCount += 1;
      data.statusCode = error.response?.status || 500;
  
      if (error.response?.status === 409) {
        console.log(`⚠️ Already exists on server`);
        data.synced = true;
        data.errorMessage = '409 Conflict';
      } else {
        console.error(`❌ Retry failed`, error.message);
        data.errorMessage = error.response?.data?.message || error.message;
      }
  
      if (data.retryCount >= 3) {
        data.synced = true;
        console.log(`⚠️ Max retry attempts reached`);
      }
  
      await this.syncRepo.save(data);
    }
  
    await new Promise(res => setTimeout(res, 1000));
  }
  
  //old
  // async sendRequestToServer(data: SyncStatus) {
  //   try {
  //     // การส่ง request พร้อมกับ headers ที่ได้รับจากข้อมูล
  //     const headers = {
  //       'Content-Type': 'application/json',
  //       ...data.headers,
  //       'owner-id': data.headers?.['owner-id'] || 'default_owner_id',
  //       'branch-id': data.headers?.['branch-id'] || 'default_branch_id',
  //     };

  //     const response = await axios({
  //       method: data.method.toLowerCase(),
  //       url: data.path,
  //       data: data.payload,
  //       headers: headers,
  //     });
  //     console.log(`📤 Sending request to server: ${data.path}`);
  //     // ถ้าส่งข้อมูลสำเร็จ
  //     if (response.status >= 200 && response.status < 300) {
  //       data.synced = true;
  //       data.statusCode = response.status;
  //       console.log(`✅ Successfully synced: ${data.path}`);
        
  //       // ลบข้อมูลหลังจากส่งสำเร็จ
  //       await this.syncRepo.delete(data.id);
  //       console.log(`✅ Deleted sync record with ID: ${data.id}`);
  //     }
  //   } catch (error) {
  //     // ถ้าส่งไม่สำเร็จ, เพิ่ม retryCount
  //     data.retryCount += 1;
  //     data.statusCode = error.response?.status || 500;
      
  //     // จัดการกับ 409 Conflict
  //     if (error.response?.status === 409) {
  //       console.log(`⚠️ Data already exists on server: ${data.path}`);
  //       data.synced = true; // ถือว่าส่งสำเร็จเพราะข้อมูลมีอยู่แล้ว
  //       data.errorMessage = 'Data already exists on server';
  //     } else {
  //       console.error(`❌ Retry failed for ${data.path}`, error.message);
  //       console.error('Error details:', error.response?.data || error.message);
  //       data.errorMessage = error.response?.data?.message || error.message;
  //     }

  //     if (data.retryCount >= 3) {
  //       data.synced = true;
  //       console.log(`⚠️ Max retry attempts reached for ${data.path}`);
  //     }
  //   }

  //   await this.syncRepo.save(data);
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  // }

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

  //   async sendRequestToServer(data: SyncDataDto) {
  //     try {
  //       const res = await firstValueFrom(
  //         this.httpService.request({
  //           url: data.path,             // path ที่จะไปเรียก
  //           method: data.method.toLowerCase(),  // ใช้ method ที่ระบุ (POST, GET, ฯลฯ)
  //           data: data.payload,
  //           headers: {
  //             'Content-Type': 'application/json',
  //             ...data.headers,  // ใช้ headers ที่ส่งมาในข้อมูล
  //           },       // ส่ง payload เป็น JSON
  //         }),
  //       );

  //       // บันทึกข้อมูลลงในฐานข้อมูล หลังจากยิง request
  //       const syncStatus = this.syncRepo.create({
  //         ...data,
  //         statusCode: res.status,   // เก็บ statusCode ของการ response
  //         synced: true,             // เปลี่ยนสถานะว่าเรียบร้อยแล้ว
  //       });

  //       await this.syncRepo.save(syncStatus);
  //       return { message: 'Data sent successfully', status: res.status };

  //     } catch (error) {
  //       // ถ้าเกิดข้อผิดพลาดในการยิง request จะบันทึกลงฐานข้อมูลว่า failed
  //       const syncStatus = this.syncRepo.create({
  //         ...data,
  //         statusCode: error.response ? error.response.status : 500,  // เก็บ status code ของ error
  //         synced: false,  // สถานะว่าไม่สำเร็จ
  //       });

  //       await this.syncRepo.save(syncStatus);
  //       return { message: 'Failed to send data', error: error.message };
  //     }
  //   }
}
