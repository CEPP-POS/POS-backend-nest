import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SyncStatus } from 'src/entities/sync-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SyncStatus]), HttpModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
