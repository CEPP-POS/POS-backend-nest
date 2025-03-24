import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ScheduleModule } from '@nestjs/schedule';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncStatus } from '../entities/sync-status.entity';
import { LocalData } from '../entities/local-data.entity';
import { Order } from '../entities/order.entity';
import { Owner } from '../entities/owner.entity';
import { Branch } from '../entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncStatus, LocalData, Order, Owner, Branch]),
    // ScheduleModule.forRoot(),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
