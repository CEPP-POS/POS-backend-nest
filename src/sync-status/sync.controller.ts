import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import { SyncService } from './sync.service';
import { StatusDto } from './dto/status.dto';
import { SyncDataDto } from './dto/sync-data.dto';

@Controller('status')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // รับค่าจาก frontend ว่าออนไลน์หรือไม่
//   @Post()
//   @HttpCode(200)
//   async updateStatus(@Body() statusDto: StatusDto) {
//     await this.syncService.handleStatus(statusDto.isOnline);
//     return { message: 'Status updated' };
//   }

  // รับ path, statusCode, payload เวลา offline
  @Post('offline')
  @HttpCode(201)
  async saveOfflineData(@Body() syncDto: SyncDataDto) {
    await this.syncService.saveFailedRequest(syncDto);
    return { message: 'Saved to retry queue' };
  }

//   @Post('test-send')
//   @HttpCode(200)
//   async testSendData(@Body() syncDto: SyncDataDto) {
//     const result = await this.syncService.sendRequestToServer(syncDto);
//     return result;
//   }

  @Get('retry')
  async retryFailedData() {
    await this.syncService.processSyncQueue();  // เรียกฟังก์ชัน retryFailedQueue
    return { message: 'completed' };
  }
}
