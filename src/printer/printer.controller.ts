import { Controller, Post, Body } from '@nestjs/common';
import { PrinterService } from './printer.service';

interface PrintContent {
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  size?: number;
}

@Controller('print')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Post()
  async print(@Body() content: PrintContent[]) {
    await this.printerService.print(content);
    return { message: 'Print job sent' };
  }
}
