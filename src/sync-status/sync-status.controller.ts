import { Controller, Post, Body, Get, Delete } from '@nestjs/common';
import { SyncStatusService } from './sync-status.service';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { TestSyncDto } from './dto/test-sync.dto';

@Controller('sync-status')
export class SyncStatusController {
  constructor(private readonly syncStatusService: SyncStatusService) {}

  @Post('connection-status')
  async updateConnectionStatus(@Body() connectionStatusDto: ConnectionStatusDto) {
    return await this.syncStatusService.updateConnectionStatus(connectionStatusDto);
  }

  @Post('test-sync')
  async testSync(@Body() testSyncDto: TestSyncDto) {
    return await this.syncStatusService.testSync(testSyncDto);
  }

  @Get('pending-syncs')
  async getPendingSyncs() {
    return await this.syncStatusService.getPendingSyncs();
  }

  @Delete('clear-syncs')
  async clearAllSyncs() {
    return await this.syncStatusService.clearAllSyncs();
  }
} 