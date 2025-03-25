import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncStatus } from './entities/sync-status.entity';
import { ConnectionStatusDto } from './dto/connection-status.dto';
import { TestSyncDto } from './dto/test-sync.dto';
import axios from 'axios';

@Injectable()
export class SyncStatusService {
  constructor(
    @InjectRepository(SyncStatus)
    private syncStatusRepository: Repository<SyncStatus>,
  ) {}

  async updateConnectionStatus(connectionStatusDto: ConnectionStatusDto) {
    if (connectionStatusDto.isOnline) {
      await this.processPendingSyncs();
    }
    return { message: 'Connection status updated successfully' };
  }

  async saveSyncStatus(path: string, statusCode: number, data: any) {
    const lastSync = await this.syncStatusRepository.findOne({
      order: { queue: 'DESC' },
    });

    const queue = lastSync ? lastSync.queue + 1 : 1;

    const syncStatus = this.syncStatusRepository.create({
      path,
      statusCode,
      queue,
      data,
    });

    return await this.syncStatusRepository.save(syncStatus);
  }

  private async processPendingSyncs() {
    const pendingSyncs = await this.syncStatusRepository.find({
      order: { queue: 'ASC' },
    });

    for (const sync of pendingSyncs) {
      try {
        const response = await axios.post(sync.path, sync.data);
        
        if (response.status === 200) {
          await this.syncStatusRepository.remove(sync);
        }
      } catch (error) {
        console.error(`Failed to sync data for path ${sync.path}:`, error);
      }
    }
  }

  async testSync(testSyncDto: TestSyncDto) {
    try {
      const response = await axios.post(testSyncDto.path, testSyncDto.data);
      
      if (response.status === 200) {
        return { 
          message: 'Data synced successfully',
          status: response.status,
          data: response.data 
        };
      }
    } catch (error) {
      if (error.response?.status === 404) {
        await this.saveSyncStatus(
          testSyncDto.path,
          testSyncDto.statusCode,
          testSyncDto.data
        );
        return {
          message: 'Data saved to sync queue',
          status: 404,
          data: testSyncDto.data
        };
      }
      throw new HttpException('Failed to sync data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPendingSyncs() {
    return await this.syncStatusRepository.find({
      order: { queue: 'ASC' }
    });
  }

  async clearAllSyncs() {
    await this.syncStatusRepository.clear();
    return { message: 'All sync records cleared' };
  }
} 