import {
  Controller,
  Get,
  Post,
  Headers,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   * Manual check internet connectivity and update sync status
   */
  @Get('check-connection')
  async checkConnection(
    @Headers('branch_id') branchId: string,
    @Headers('owner_id') ownerId: string,
  ) {
    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    const isOnline = await this.syncService.checkConnectivity();
    const status = await this.syncService.updateSyncStatus(
      Number(ownerId),
      Number(branchId),
      isOnline,
    );

    return {
      isOnline,
      lastSync: status.last_sync,
      message: isOnline
        ? 'Internet connection is available'
        : 'Internet connection is unavailable',
    };
  }

  /**
   * Get sync status for a branch
   */
  @Get('status')
  async getSyncStatus(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    const status = await this.syncService.getSyncStatus(
      Number(ownerId),
      Number(branchId),
    );

    return {
      ...status,
      message: status.isOnline
        ? 'Online mode'
        : `Offline mode, ${status.pendingCount} operations pending sync`,
    };
  }

  /**
   * Manually trigger data sync
   */
  @Post('sync-now')
  async syncNow(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
  ) {
    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    const isOnline = await this.syncService.checkConnectivity();

    if (!isOnline) {
      return {
        success: false,
        message: 'Cannot sync while offline',
      };
    }

    // Update status to online
    await this.syncService.updateSyncStatus(
      Number(ownerId),
      Number(branchId),
      true,
    );

    // Trigger sync
    await this.syncService.syncPendingData(Number(ownerId), Number(branchId));

    const status = await this.syncService.getSyncStatus(
      Number(ownerId),
      Number(branchId),
    );

    return {
      success: true,
      isOnline: true,
      lastSync: status.lastSync,
      pendingCount: status.pendingCount,
      message: `Sync completed, ${status.pendingCount} items remaining`,
    };
  }
  @Post('test/toggle-connection')
  async toggleConnectionForTest(
    @Headers('owner_id') ownerId: string,
    @Headers('branch_id') branchId: string,
    @Body() body: { isOnline: boolean },
  ) {
    const status = await this.syncService.updateSyncStatus(
      Number(ownerId),
      Number(branchId),
      body.isOnline,
    );

    return {
      isOnline: body.isOnline,
      lastSync: status.last_sync,
      message: body.isOnline
        ? 'Test mode: Set to online'
        : 'Test mode: Set to offline',
    };
  }
}
