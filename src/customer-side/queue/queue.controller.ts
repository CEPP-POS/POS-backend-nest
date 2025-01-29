// src/customer-side/queue/queue.controller.ts
import { Controller, Get } from '@nestjs/common';
import { QueueService } from './queue.service';
import { GetQueueDTO } from './dto/queue.dto';

@Controller('customer/queue')  // Ensure the path matches what you want in the URL
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  async getQueue(): Promise<GetQueueDTO> {
    return await this.queueService.getQueue();
  }
}
