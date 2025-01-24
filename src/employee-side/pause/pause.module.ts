import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PauseService } from './pause.service';
import { PauseController } from './pause.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [PauseController],
  providers: [PauseService],
})
export class PauseModule {}
