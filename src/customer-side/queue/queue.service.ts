import { Injectable, Param } from '@nestjs/common';
import { GetQueueDTO } from './dto/queue.dto';

@Injectable()
export class QueueService {
    async getQueue(){
        const GetQueue = {
            order_id: 123456,
            queue_number: 10,
            current_queue: 2,
            wait_queue: 8,
        }
      return GetQueue;
}
}
