import { Controller, Post, Body, HttpCode, Get, BadRequestException, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { StatusDto } from './dto/status.dto';
import { SyncDataDto } from './dto/sync-data.dto';

@Controller('status')
export class SyncController {
  constructor(private readonly syncService: SyncService) { }
  
  @Post('offline')
  @HttpCode(201)
  async saveOfflineData(@Body() syncDto: SyncDataDto) {
    await this.syncService.saveFailedRequest(syncDto);
    return { message: 'Saved to retry queue' };
  }

  @Get('retry')
  async retryFailedData(
    @Req() request: Request,) {
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    if (!ownerId || !this.isValidUUID(ownerId)) {
      throw new BadRequestException('Invalid owner_id');
    }

    if (!branchId || !this.isValidUUID(branchId)) {
      throw new BadRequestException('Invalid branch_id');
    }

    await this.syncService.processSyncQueue();
    return { message: 'completed' };
  }

  // Helper method
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
