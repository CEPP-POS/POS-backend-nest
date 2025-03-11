import { Controller, Get, Query } from '@nestjs/common';
import { PrinterService } from './printer.service';

@Controller('print')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Get()
  print(@Query('text') text: string) {
    this.printerService.printText(text || 'Hello, NestJS Printer!');
    return { message: 'Print job sent' };
  }
}
