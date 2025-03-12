import { Module } from '@nestjs/common';
import { ThermalController } from './thermal.controller';
import { ThermalService } from './thermal.service';

@Module({
  controllers: [ThermalController],
  providers: [ThermalService],
})
export class ThermalModule {}
