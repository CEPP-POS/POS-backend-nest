import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncStatus, syncStatus } from '../entities/sync-status.entity';
import {
  LocalData,
  OperationType,
  Status,
} from '../entities/local-data.entity';
import { Owner } from '../entities/owner.entity';
import { Branch } from '../entities/branch.entity';
import { Order } from '../entities/order.entity';
// import { Interval } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly CLOUD_API_URL =
    process.env.CLOUD_API_URL || 'https://api.yourdomain.com';

  constructor(
    @InjectRepository(SyncStatus)
    private syncStatusRepository: Repository<SyncStatus>,

    @InjectRepository(LocalData)
    private localDataRepository: Repository<LocalData>,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,

    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {
    // Initialize sync status for each branch at startup
    this.initializeSyncStatus();
  }

  /**
   * Initialize sync status for all branches
   */
  private async initializeSyncStatus(): Promise<void> {
    try {
      const branches = await this.branchRepository.find({
        relations: ['owner'],
      });

      for (const branch of branches) {
        let status = await this.syncStatusRepository.findOne({
          where: {
            branch: { branch_id: branch.branch_id },
            owner: { owner_id: branch.owner.owner_id },
          },
        });

        // If no status exists, create a new one
        if (!status) {
          status = this.syncStatusRepository.create({
            branch,
            owner: branch.owner,
            last_sync: new Date(),
            status: syncStatus.online, // Default to online
          });
          await this.syncStatusRepository.save(status);
          this.logger.log(
            `Created new sync status for branch ${branch.branch_id}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error initializing sync status: ${error.message}`);
    }
  }

  /**
   * Check internet connectivity
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      // Make a simple HEAD request to a reliable endpoint
      await axios.head('https://www.google.com', { timeout: 5000 });
      return true;
    } catch (error) {
      this.logger.warn('Internet connection unavailable');
      return false;
    }
  }

  /**
   * Update sync status for a specific branch
   */
  async updateSyncStatus(
    ownerId: number,
    branchId: number,
    isOnline: boolean,
  ): Promise<SyncStatus> {
    try {
      const syncStatusObj = await this.syncStatusRepository.findOne({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      if (!syncStatusObj) {
        throw new Error(
          `Sync status not found for owner ${ownerId} and branch ${branchId}`,
        );
      }

      // แก้ไขจากนี้
      syncStatusObj.status = isOnline ? syncStatus.online : syncStatus.offline;
      syncStatusObj.last_sync = isOnline ? new Date() : syncStatusObj.last_sync;

      return await this.syncStatusRepository.save(syncStatusObj);
    } catch (error) {
      this.logger.error(`Error updating sync status: ${error.message}`);
      throw error;
    }
  }

  // ฟังก์ชันอื่นที่ต้องแก้ไขเช่นกัน
  // @Interval(30000) // หรือใช้ setInterval ถ้าไม่ได้ติดตั้ง @nestjs/schedule
  async periodicSync(): Promise<void> {
    try {
      const isOnline = await this.checkConnectivity();

      // ถ้าเราออฟไลน์ แค่อัพเดทสถานะและจบการทำงาน
      if (!isOnline) {
        await this.updateAllSyncStatus(false);
        return;
      }

      // อัพเดทสถานะเป็นออนไลน์
      await this.updateAllSyncStatus(true);

      // ซิงค์ข้อมูลที่รอดำเนินการสำหรับทุกสาขา
      const branches = await this.branchRepository.find({
        relations: ['owner'],
      });

      for (const branch of branches) {
        await this.syncPendingData(branch.owner.owner_id, branch.branch_id);
      }
    } catch (error) {
      this.logger.error(`Error in periodic sync: ${error.message}`);
    }
  }

  /**
   * When a new order is created, log it to LocalData
   */
  async logNewOrder(order: Order, operationType: OperationType): Promise<void> {
    try {
      const syncStatusObj = await this.syncStatusRepository.findOne({
        where: {
          owner: { owner_id: order.owner.owner_id },
          branch: { branch_id: order.branch.branch_id },
        },
      });

      if (!syncStatusObj) {
        throw new Error(`Sync status not found for order ${order.order_id}`);
      }

      // Create a new LocalData entry
      const localData = this.localDataRepository.create({
        table_name: 'order',
        order: order,
        operation_type: operationType,
        data: JSON.stringify(order), // Store the order data as JSON
        sync_status: syncStatusObj,
        status: Status.pending,
        owner: order.owner,
        branch: order.branch,
      });

      await this.localDataRepository.save(localData);
      this.logger.log(
        `Logged ${operationType} operation for order ${order.order_id}`,
      );

      // Try to sync immediately if we're online
      if (syncStatusObj.status === syncStatus.online) {
        await this.syncPendingData(
          order.owner.owner_id,
          order.branch.branch_id,
        );
      }
    } catch (error) {
      this.logger.error(`Error logging order operation: ${error.message}`);
    }
  }
  /**
   * Update sync status for all branches
   */
  private async updateAllSyncStatus(isOnline: boolean): Promise<void> {
    try {
      const syncStatusList = await this.syncStatusRepository.find();

      for (const status of syncStatusList) {
        status.status = isOnline ? syncStatus.online : syncStatus.offline;
        if (isOnline) {
          status.last_sync = new Date();
        }
      }

      await this.syncStatusRepository.save(syncStatusList);
      this.logger.log(
        `Updated all sync statuses to ${isOnline ? 'online' : 'offline'}`,
      );
    } catch (error) {
      this.logger.error(`Error updating all sync statuses: ${error.message}`);
    }
  }

  /**
   * Sync pending data for a specific branch
   */
  async syncPendingData(ownerId: number, branchId: number): Promise<void> {
    try {
      // ตรวจสอบว่าเราออนไลน์อยู่หรือไม่
      const syncStatusObj = await this.syncStatusRepository.findOne({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      if (!syncStatusObj || syncStatusObj.status !== syncStatus.online) {
        this.logger.log(
          `Skipping sync for branch ${branchId} as we're offline`,
        );
        return;
      }

      // ดำเนินการซิงค์ข้อมูลที่เหลือของฟังก์ชัน
      // ...
    } catch (error) {
      this.logger.error(`Error syncing pending data: ${error.message}`);
    }
  }

  /**
   * Sync an insert operation to the cloud
   */
  private async syncInsert(item: LocalData): Promise<void> {
    try {
      const endpoint = `${this.CLOUD_API_URL}/${item.table_name}`;
      await axios.post(endpoint, item.data);
      this.logger.log(
        `Synced INSERT for ${item.table_name} ID ${item.order.order_id}`,
      );
    } catch (error) {
      this.logger.error(`Error syncing INSERT: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync an update operation to the cloud
   */
  private async syncUpdate(item: LocalData): Promise<void> {
    try {
      const endpoint = `${this.CLOUD_API_URL}/${item.table_name}/${item.order.order_id}`;
      await axios.put(endpoint, item.data);
      this.logger.log(
        `Synced UPDATE for ${item.table_name} ID ${item.order.order_id}`,
      );
    } catch (error) {
      this.logger.error(`Error syncing UPDATE: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync a delete operation to the cloud
   */
  private async syncDelete(item: LocalData): Promise<void> {
    try {
      const endpoint = `${this.CLOUD_API_URL}/${item.table_name}/${item.order.order_id}`;
      await axios.delete(endpoint);
      this.logger.log(
        `Synced DELETE for ${item.table_name} ID ${item.order.order_id}`,
      );
    } catch (error) {
      this.logger.error(`Error syncing DELETE: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sync status for a specific branch
   */
  async getSyncStatus(
    ownerId: number,
    branchId: number,
  ): Promise<{
    isOnline: boolean;
    lastSync: Date;
    pendingCount: number;
  }> {
    try {
      const syncStatusObj = await this.syncStatusRepository.findOne({
        where: {
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      if (!syncStatusObj) {
        throw new Error(
          `Sync status not found for owner ${ownerId} and branch ${branchId}`,
        );
      }

      const pendingCount = await this.localDataRepository.count({
        where: {
          status: Status.pending,
          owner: { owner_id: ownerId },
          branch: { branch_id: branchId },
        },
      });

      return {
        isOnline: syncStatusObj.status === syncStatus.online,
        lastSync: syncStatusObj.last_sync,
        pendingCount,
      };
    } catch (error) {
      this.logger.error(`Error getting sync status: ${error.message}`);
      throw error;
    }
  }
}
