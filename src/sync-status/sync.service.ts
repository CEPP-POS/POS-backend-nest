import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { SyncDataDto } from './dto/sync-data.dto';
import { firstValueFrom } from 'rxjs';
import { SyncStatus } from 'src/entities/sync-status.entity';
import axios from 'axios';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncStatus)
    private readonly syncRepo: Repository<SyncStatus>,
    private readonly httpService: HttpService,
  ) {}

  async handleStatus(isOnline: boolean) {
    if (isOnline) {
      await this.retryFailedQueue();
    }
  }

  async saveFailedRequest(data: SyncDataDto) {
    const syncStatus = this.syncRepo.create({
      ...data,
      synced: false,
      retryCount: 0,
    });
    return this.syncRepo.save(syncStatus);
  }

  async retryFailedQueue() {
    const failedItems = await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' },
    });

    for (const item of failedItems) {
      try {
        const response = await axios({
          method: item.method.toLowerCase(),
          url: item.path,
          data: item.payload,
          headers: {
            'Content-Type': 'application/json',
            
          },
        });

        if (response.status >= 200 && response.status < 300) {
          item.synced = true;
          console.log(`✅ Successfully synced: ${item.path}`);
          await this.syncRepo.delete(item.id); 
        }
      } catch (error) {
        item.retryCount += 1;
        console.error(`❌ Retry failed for ${item.path}`, error.message);
        
        if (item.retryCount >= 3) {
          item.synced = true;
          console.log(`⚠️ Max retry attempts reached for ${item.path}`);
        }
      }

      await this.syncRepo.save(item);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  async processSyncQueue() {
    const failedItems = await this.syncRepo.find({
      where: { synced: false },
      order: { createdAt: 'ASC' },  // เลือกข้อมูลที่เก่าที่สุดก่อน
    });

    for (const item of failedItems) {
      await this.sendRequestToServer(item);  // เรียกใช้ sendRequestToServer เพื่อส่งข้อมูล
    }
  }
  async sendRequestToServer(data: SyncStatus) {
    try {
      // การส่ง request พร้อมกับ headers ที่ได้รับจากข้อมูล
      const headers = {
        'Content-Type': 'application/json',
        ...data.headers, // ใช้ headers ที่ส่งมาจากฐานข้อมูล
        'owner-id': data.headers?.['owner-id'] || 'default_owner_id', // เพิ่ม owner-id ถ้าไม่มี
        'branch-id': data.headers?.['branch-id'] || 'default_branch_id', // เพิ่ม branch-id ถ้าไม่มี
      };

      const response = await axios({
        method: data.method.toLowerCase(),
        url: data.path,
        data: data.payload,
        headers: headers,  // ส่ง headers ที่แก้ไขแล้ว
      });

      // ถ้าส่งข้อมูลสำเร็จ
      if (response.status >= 200 && response.status < 300) {
        data.synced = true;  // เปลี่ยนสถานะ synced เป็น true
        console.log(`✅ Successfully synced: ${data.path}`);

        // ลบข้อมูลออกจากฐานข้อมูลหลังจากส่งสำเร็จ
        await this.syncRepo.delete(data.id);  // ลบข้อมูลจากฐานข้อมูล
      }
    } catch (error) {
      // ถ้าส่งไม่สำเร็จ, เพิ่ม retryCount
      data.retryCount += 1;
      console.error(`❌ Retry failed for ${data.path}`, error.message);

      // ถ้า retry ถึง 3 ครั้ง, อัปเดต synced = true
      if (data.retryCount >= 3) {
        data.synced = true;
        console.log(`⚠️ Max retry attempts reached for ${data.path}`);
      }
    }

    // บันทึกข้อมูลที่อัปเดตในฐานข้อมูล
    await this.syncRepo.save(data);
    
    // ให้เวลาเล็กน้อยก่อนจะส่งข้อมูลถัดไป (หน่วงเวลา 1 วินาที)
    await new Promise(resolve => setTimeout(resolve, 1000));
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
