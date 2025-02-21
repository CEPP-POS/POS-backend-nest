import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { Owner } from '../../entities/owner.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Owner, Ingredient]),
    forwardRef(() => AuthModule),
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
  exports: [OwnerService, TypeOrmModule],
})
export class OwnerModule {}
