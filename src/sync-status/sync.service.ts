import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { SyncDataDto } from './dto/sync-data.dto';
import { SyncStatus } from 'src/entities/sync-status.entity';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import fs from "fs";
import FormData from "form-data";

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncStatus)
    private readonly syncRepo: Repository<SyncStatus>,
    private readonly httpService: HttpService,
  ) { }
  async saveFailedRequest(data: SyncDataDto) {
    console.log('📥 Received data:', JSON.stringify(data, null, 2));
    console.log('🔑 Received headers:', JSON.stringify(data.headers, null, 2));

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
    });

    const savedSyncStatus = await this.syncRepo.save(syncStatus);
  }

  async processSyncQueue() {
    console.log("PROCESS SYNC QUEUE")
    const failedItems = await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' },
    });

    for (const item of failedItems) {

      try {
        const payload = item.payload;
        console.log("PAYLOAD MINIO:", payload)
        if (payload.image_url) {
          const imageUrl = payload.image_url;
          console.log("Extracted Image URL:", imageUrl);

          // Read file from local storage
          if (fs.existsSync(imageUrl)) {
            console.log("Upload Image to MinIO");

            const formData = new FormData();
            formData.append("file", fs.createReadStream(imageUrl), { filename: imageUrl.split("/").pop() });

            await axios.post(`${process.env.MAIN_SERVER_URL}/upload`, formData, {
              headers: {
                ...formData.getHeaders(), // Use headers from `form-data`
              },
              timeout: 10000,
            });

            console.log("✅ Image uploaded successfully!");
          } else {
            console.log("⚠️ Image file not found:", imageUrl);
          }
        }
      } catch (error) {
        console.error("Invalid JSON format in payload:", item.payload);
      }

      console.log('✅ All failed items have been synced', item);
      return { "test": "testtt" }
      await this.sendRequestToServer(item);
    }
  }

  async sendRequestToServer(data: SyncStatus) {
    try {
      const serverResponse = await axios({
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

      if (serverResponse.status >= 200 && serverResponse.status < 300) {
        data.synced = true;
        data.statusCode = serverResponse.status;
        console.log(`✅ Successfully synced to server`);

        await this.syncRepo.remove(data);
      }
    } catch (error) {
      data.retryCount += 1;
      data.statusCode = error.response?.status || 500;

      if (error.response?.status === 409) {
        data.synced = true;
        data.errorMessage = '409 Conflict';
        await this.syncRepo.save(data);
        await this.syncRepo.remove(data);
      } else {
        data.errorMessage = error.response?.data?.message || error.message;
      }

      if (data.retryCount >= 3) {
        console.log(`⚠️ Max retry attempts reached`);
      }

      await this.syncRepo.save(data);
    }

    await new Promise((res) => setTimeout(res, 1000));
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
