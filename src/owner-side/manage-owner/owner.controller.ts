import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner/create-owner.dto';
import { Express, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerService } from './owner.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { sendTemporaryPasswordEmail } from 'src/utils/send-email.util';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { CreateEmployeeDto } from './dto/create-employee/create-employee.dto';
import { UserPayload } from '../../auth/interfaces/user.interface';
import { BranchService } from '../branch/branch.service';
import * as bcrypt from 'bcrypt';
import { UpdatePasswordDto } from '../../auth/dto/password.dto';
import {
  ForgotPasswordDto,
  LoginDto,
  VerifyOtpDto,
} from '../../auth/dto/auth.dto';

@Controller('owner')
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly authService: AuthService,
    private readonly branchService: BranchService,
  ) {}
  @Patch('reset-password/:id')
  async updatePassword(
    @Param('id') ownerId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.ownerService.updatePassword(+ownerId, updatePasswordDto);
  }
  // ใช้สำหรับการเปลี่ยนรหัสผ่านครั้งแรกหลังจากลงทะเบียน
  @Patch('reset-password')
  async resetPassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request, // ✅ เพิ่ม request เพื่อดึง header
  ) {
    try {
      // ✅ ดึง `owner_id` และ `branch_id` จาก Header
      const ownerId = request.headers['owner_id'];
      const branchId = request.headers['branch_id'];

      if (!ownerId || !branchId) {
        throw new BadRequestException(
          'Missing required headers: owner_id or branch_id',
        );
      }
      const ownerIdNum = Number(ownerId);
      const branchIdNum = Number(branchId);

      console.log('📌 [DEBUG] Headers:', { ownerId, branchId });

      // ✅ ส่งค่า `ownerId`, `branchId` ไปที่ Service
      return await this.ownerService.resetPassword(
        updatePasswordDto,
        ownerIdNum,
        branchIdNum,
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

  // * Function Register Owner
  @Post('register')
  async register(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownerService.create(createOwnerDto);
  }

  // * Function Login Owner
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  // * Function Upload CSV file
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const stream = Readable.from(file.buffer.toString());
    const owners = [];

    try {
      for await (const row of stream.pipe(csvParser())) {
        const owner = await this.ownerService.createOwnerWithBranch(row);
        owners.push(owner);
      }

      if (owners.length === 0) {
        throw new BadRequestException('CSV file is empty');
      }

      return { message: 'CSV data uploaded successfully' };
    } catch (error) {
      console.error('Error uploading CSV data:', error);
      throw new BadRequestException('Error processing CSV file');
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    // ✅ ดึงค่า owner_id และ branch_id จาก headers
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    // ✅ ตรวจสอบว่ามีค่า owner_id และ branch_id หรือไม่
    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    // ✅ แปลงค่าเป็น number
    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    // ✅ ส่งค่าไปยัง service
    await this.ownerService.forgotPassword(forgotPasswordDto);

    return { message: 'OTP ถูกส่งไปยังอีเมลของคุณแล้ว' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() request: Request) {
    // ✅ ดึงค่า owner_id และ branch_id จาก headers
    const ownerId = request.headers['owner_id'];
    const branchId = request.headers['branch_id'];

    console.log('📌 [DEBUG] Received Headers:', ownerId, branchId);

    // ✅ ตรวจสอบว่ามีค่า owner_id และ branch_id หรือไม่
    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    // ✅ แปลงค่าเป็น number
    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    console.log('📌 [DEBUG] Converted IDs:', ownerIdNum, branchIdNum);

    // ✅ ส่งค่าไปยัง service
    await this.ownerService.verifyOtp(verifyOtpDto, ownerIdNum, branchIdNum);

    return { message: 'OTP ถูกต้อง สามารถตั้งรหัสผ่านใหม่ได้' };
  }
  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Req() req: Request) {
    return { message: 'This is owner profile', user: req.user };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  getAdminData() {
    return { message: 'This is admin data' };
  }

  // * Function Create Employee
  @Post('create-employee')
  @Roles('owner')
  @UseGuards(JwtGuard, RolesGuard)
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserPayload; // ✅ ดึง Owner จาก JWT Token
    if (!user.owner_id) {
      throw new UnauthorizedException('Invalid owner credentials.');
    }

    console.log('🔍 Owner creating employee:', user);

    // ✅ เรียก Service พร้อมส่ง `manager_id` และ `branch_id`
    await this.ownerService.createEmployee({
      ...createEmployeeDto,
      manager_id: user.owner_id, // ✅ ใช้ owner ที่ล็อกอินเป็น manager
      branch_id: user.branch_id || createEmployeeDto.branch_id, // ✅ ถ้าไม่มีให้ใช้จาก Body
    });

    return { message: 'Employee created successfully' };
  }

  @Post('request-temp-password')
  async requestTempPassword(@Body() { email }: { email: string }) {
    return this.ownerService.requestTempPassword(email);
  }

  // * Dev only
  @Post('create-employee-dev')
  async createEmployeeWithoutAuth(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    console.log('🔍 Creating Employee (No Auth):', createEmployeeDto);
    return this.ownerService.createEmployee(createEmployeeDto);
  }

  //
  // * Function Get Ingredients
  @Get('ingredients/:owner_id')
  async getIngredients(@Param('owner_id', ParseIntPipe) ownerId: number) {
    console.log(ownerId);
    console.log(typeof ownerId);
    return this.ownerService.getIngredientsByOwner(ownerId);
  }
  //
}
