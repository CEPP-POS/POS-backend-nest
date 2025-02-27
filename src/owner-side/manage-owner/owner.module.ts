import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { Owner } from '../../entities/owner.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Branch } from 'src/entities/branch.entity';
import { BranchService } from '../branch/branch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Owner, Ingredient, Branch]),
    forwardRef(() => AuthModule),
  ],
  controllers: [OwnerController],
  providers: [OwnerService,BranchService],
  exports: [OwnerService, TypeOrmModule],
})
export class OwnerModule {}
