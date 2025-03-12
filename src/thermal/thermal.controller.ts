import { Controller, Post, Body } from '@nestjs/common';
import { ThermalService } from './thermal.service';

@Controller('thermal')
export class ThermalController {
  constructor(private readonly thermalService: ThermalService) {}

  @Post('print')
  async print(@Body() data: { items: Array<{ name: string; price: number }> }) {
    return this.thermalService.generateAndPrint(data.items);
  }
}
