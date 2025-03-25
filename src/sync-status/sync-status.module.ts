import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncStatusController } from './sync-status.controller';
import { SyncStatusService } from './sync-status.service';
import { SyncStatus } from './entities/sync-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SyncStatus])],
  controllers: [SyncStatusController],
  providers: [SyncStatusService],
  exports: [SyncStatusService],
})
export class SyncStatusModule {} 