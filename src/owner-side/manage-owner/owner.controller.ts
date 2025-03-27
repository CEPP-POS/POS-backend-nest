import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner/create-owner.dto';
import { Express, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerService } from './owner.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { CreateEmployeeDto } from './dto/create-employee/create-employee.dto';
import { UserPayload } from '../../auth/interfaces/user.interface';
import { BranchService } from '../branch/branch.service';
import { UpdatePasswordDto } from '../../auth/dto/password.dto';
import { ForgotPasswordDto, VerifyOtpDto } from '../../auth/dto/auth.dto';

@Controller('owner')
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly authService: AuthService,
    private readonly branchService: BranchService,
  ) {}

  // * Function Upload CSV file to create Owner with Branch
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const owners: CreateOwnerDto[] = [];
    const stream = Readable.from(file.buffer.toString());
    let newOwnersCount = 0;

    try {
      for await (const row of stream.pipe(csvParser())) {
        const existingOwner = await this.ownerService.findByEmail(row.email);

        if (existingOwner) {
          console.log(`🔍 Owner ${row.email} already exists, skipping...`);
          continue;
        }

        console.log(`✅ Adding new owner: ${row.email}`);
        const owner = await this.ownerService.createOwnerWithBranch(row);
        newOwnersCount++;

        owners.push({
          owner_name: owner.owner_name,
          contact_info: owner.contact_info,
          email: owner.email,
          password: '***temp password send to email***',
        });
      }

      if (newOwnersCount === 0) {
        return { 
          message: 'No new owners were added. All owners already exist in the system.',
          existingOwners: true 
        };
      }

      return { 
        message: 'CSV data uploaded successfully', 
        newOwners: owners,
        count: newOwnersCount
      };
    } catch (error) {
      console.error('Error uploading CSV data:', error);
      throw new BadRequestException('Error processing CSV file');
    }
  }

  @Patch('reset-password/:id')
  async updatePassword(
    @Param('id') ownerId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.ownerService.updatePassword(ownerId, updatePasswordDto);
  }

  @Patch('reset-password')
  async resetPassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    try {
      const ownerId = request.headers['owner_id'];
      const branchId = request.headers['branch_id'];

      if (!ownerId || !branchId) {
        throw new BadRequestException(
          'Missing required headers: owner_id or branch_id',
        );
      }

      console.log('📌 [DEBUG] Headers:', { ownerId, branchId });

      return await this.ownerService.resetPassword(
        updatePasswordDto,
        ownerId[0],
        branchId[0],
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('Something went wrong. Please try again.');
    }
  }
  @Get('employees')
  @Roles('owner')
  @UseGuards(JwtGuard)
  async getEmployees(@Req() req: Request) {
    console.log('🔍 [DEBUG] User from Token:', req.user);
    const user = req.user as UserPayload;
    return this.ownerService.findEmployeesByManager(user.owner_id);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    let ownerId = request.headers['owner_id'];
    let branchId = request.headers['branch_id'];

    // If owner_id or branch_id are arrays, take the first element
    if (Array.isArray(ownerId)) {
      ownerId = ownerId[0];
    }

    if (Array.isArray(branchId)) {
      branchId = branchId[0];
    }

    // Validate that ownerId and branchId are strings
    if (typeof ownerId !== 'string' || typeof branchId !== 'string') {
      throw new BadRequestException('Invalid owner_id or branch_id');
    }

    await this.ownerService.forgotPassword(
      forgotPasswordDto,
      ownerId,
      branchId,
    );

    return { message: 'OTP ถูกส่งไปยังอีเมลของคุณแล้ว' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() request: Request) {
    let ownerId = request.headers['owner_id'];
    let branchId = request.headers['branch_id'];

    console.log('📌 [DEBUG] Received Headers:', ownerId, branchId);

    // If owner_id or branch_id are arrays, take the first element
    if (Array.isArray(ownerId)) {
      ownerId = ownerId[0];
    }

    if (Array.isArray(branchId)) {
      branchId = branchId[0];
    }

    // Validate that ownerId and branchId are strings
    if (typeof ownerId !== 'string' || typeof branchId !== 'string') {
      throw new BadRequestException('Invalid owner_id or branch_id');
    }

    console.log('📌 [DEBUG] Converted IDs:', ownerId, branchId);

    await this.ownerService.verifyOtp(verifyOtpDto, ownerId, branchId);

    return { message: 'OTP ถูกต้อง สามารถตั้งรหัสผ่านใหม่ได้' };
  }

  // * Function Create Employee
  @Post('create-employee')
  @Roles('owner')
  @UseGuards(JwtGuard, RolesGuard)
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserPayload;
    if (!user.owner_id) {
      throw new UnauthorizedException('Invalid owner credentials.');
    }

    console.log('🔍 Owner creating employee:', user);

    await this.ownerService.createEmployee({
      ...createEmployeeDto,
      manager_id: user.owner_id,
      branch_id: user.branch_id || createEmployeeDto.branch_id,
    });

    return { message: 'Employee created successfully' };
  }

  @Post('request-temp-password')
  async requestTempPassword(@Body() { email }: { email: string }) {
    return this.ownerService.requestTempPassword(email);
  }

  @Post('branch')
  async assignBranch(@Body('branch_id') branchId: string, @Req() req: Request) {
    const ownerId = req.headers['owner_id'];
    if (!ownerId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }
    const ownerIdStr = Array.isArray(ownerId) ? ownerId[0] : ownerId;
    await this.ownerService.assignBranch(ownerIdStr, branchId);
    return { message: 'Branch assigned successfully' };
  }
}
