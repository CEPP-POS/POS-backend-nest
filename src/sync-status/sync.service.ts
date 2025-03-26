import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { SyncDataDto } from './dto/sync-data.dto';
import { firstValueFrom } from 'rxjs';
import { SyncStatus } from 'src/entities/sync-status.entity';

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
    });

    for (const item of failedItems) {
      try {
        const res = await firstValueFrom(
          this.httpService.request({
            url: item.path,
            method: item.method.toLowerCase(),
            data: item.payload,
          }),
        );

        if (res.status >= 200 && res.status < 300) {
          item.synced = true;
        }
      } catch (error) {
        item.retryCount += 1;
        console.error(`❌ Retry failed for ${item.path}`, error.message);
      }

      await this.syncRepo.save(item);
    }
  }
}
