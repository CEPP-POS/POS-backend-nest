import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './branch.service';
import { Branch } from '../../entities/branch.entity';
import { BranchController } from './branch.controller';
import { OwnerModule } from '../manage-owner/owner.module';
import { OwnerService } from '../manage-owner/owner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Branch]), OwnerModule],
  controllers: [BranchController],
  providers: [BranchService, OwnerService],
  exports: [BranchService, TypeOrmModule],
})
export class BranchModule {}
