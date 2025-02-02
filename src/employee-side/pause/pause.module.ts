import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PauseService } from './pause.service';
import { PauseController } from './pause.controller';
import { Ingredient } from 'src/entities/ingredient.entity';
import { Menu } from 'src/entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, Menu])],
  controllers: [PauseController],
  providers: [PauseService],
})
export class PauseModule { }
