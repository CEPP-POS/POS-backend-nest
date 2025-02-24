import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
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
import { LoginOwnerDto } from './dto/login-owner/login-owner.dto';
import { OwnerService } from './owner.service';
import { Readable } from 'stream';
import { UpdatePasswordDto } from './dto/update-password/update-password.dto';
import * as csvParser from 'csv-parser';
import { ForgotPasswordDto } from './dto/forgot-owner/forgot-owner.dto';
import { VerifyOtpDto } from './dto/verify-otp-owner/verify-otp-owner.dto';
import { sendTemporaryPasswordEmail } from 'src/utils/send-email.util';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { CreateEmployeeDto } from './dto/create-employee/create-employee.dto';
import { UserPayload } from '../../auth/interfaces/user.interface';
// import * as bcrypt from 'bcrypt';

@Controller('owner')
export class OwnerController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly authService: AuthService,
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
  // @Roles('owner') // ✅ ให้เฉพาะ Owner ที่เป็น Manager ใช้ API นี้ได้
  @UseGuards(JwtGuard)
  async getEmployees(@Req() req: Request) {
    console.log('🔍 [DEBUG] User from Token:', req.user);
    const user = req.user as UserPayload; // 🔹 ดึงข้อมูลผู้ใช้จาก JWT
    return this.ownerService.findEmployeesByManager(user.owner_id);
  }

  // async resetPassword(@Body() updatePasswordDto: UpdatePasswordDto) {
  //   const { email, oldPassword, newPassword } = updatePasswordDto;

  //   const user = await this.ownerService.findByEmail(email);
  //   if (!user) {
  //     throw new BadRequestException('User not found.');
  //   }

  //   if (user.otp !== oldPassword) {
  //     throw new UnauthorizedException('Invalid temporary password.');
  //   }

  //   const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  //   user.password = hashedNewPassword;
  //   user.otp = null;

  //   await this.ownerService.updatePasswordInDB(user);

  //   return { message: 'Password reset successful. You can now log in.' };
  // }

  // * Function Register Owner
  @Post('register')
  async register(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownerService.create(createOwnerDto);
  }

  // * Function Login Owner
  @Post('login')
  async login(@Body() loginOwnerDto: LoginOwnerDto) {
    return this.authService.login(loginOwnerDto);
  }
  // * Function Upload CSV file
  @Post('upload-csv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const owners: CreateOwnerDto[] = [];
    const stream = Readable.from(file.buffer.toString());

    try {
      for await (const row of stream.pipe(csvParser())) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const createOwnerDto: CreateOwnerDto = {
          owner_name: row.owner_name,
          contact_info: row.contact_info,
          email: row.email,
          password: tempPassword,
        };

        owners.push(createOwnerDto);
        await sendTemporaryPasswordEmail(createOwnerDto.email, tempPassword);
        await this.ownerService.create(createOwnerDto);
      }

      if (owners.length === 0) {
        throw new HttpException('CSV file is empty', HttpStatus.BAD_REQUEST);
      }

      return { message: 'CSV data uploaded successfully' };
    } catch (error) {
      console.error('Error uploading CSV data:', error);
      throw new HttpException(
        'Error processing CSV file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    await this.ownerService.forgotPassword(
      forgotPasswordDto,
      ownerIdNum,
      branchIdNum,
    );

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

  // * Function Get Ingredients
  @Get('ingredients/:owner_id')
  async getIngredients(@Param('owner_id', ParseIntPipe) ownerId: number) {
    console.log(ownerId);
    console.log(typeof ownerId);
    return this.ownerService.getIngredientsByOwner(ownerId);
  }

  // * Function Create Employee
  // @Post('create-employee')
  // @Roles('owner')
  // @UseGuards(JwtGuard, RolesGuard)
  // async createEmployee(
  //   @Body() createEmployeeDto: CreateEmployeeDto,
  //   @Req() req: Request,
  // ) {
  //   const user = req.user as UserPayload;
  //   return this.ownerService.createEmployee({
  //     ...createEmployeeDto,
  //     manager_id: user.owner_id,
  //   });
  // }
  @Post('create-employee')
  @Roles('owner')
  @UseGuards(JwtGuard, RolesGuard)
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req: Request,
  ) {
    // ✅ ดึง `owner_id` และ `branch_id` จาก Headers
    const ownerId = req.headers['owner_id'];
    const branchId = req.headers['branch_id'];

    if (!ownerId || !branchId) {
      throw new BadRequestException(
        'Missing required headers: owner_id or branch_id',
      );
    }

    // ✅ แปลง `owner_id` และ `branch_id` ให้เป็นตัวเลข
    const ownerIdNum = Number(ownerId);
    const branchIdNum = Number(branchId);

    const user = req.user as UserPayload;

    await this.ownerService.createEmployee({
      ...createEmployeeDto,
      manager_id: user.owner_id, // ✅ ใช้ owner ที่ล็อกอินเป็น manager
      owner_id: ownerIdNum,
      branch_id: branchIdNum,
    });
    return { message: 'Employee created successfully' };
  }

  @Post('request-temp-password')
  async requestTempPassword(@Body() { email }: { email: string }) {
    return this.ownerService.requestTempPassword(email);
  }

  // // * Dev only
  // @Post('create-employee-dev')
  // async createEmployeeWithoutAuth(
  //   @Body() createEmployeeDto: CreateEmployeeDto,
  // ) {
  //   console.log('🔍 Creating Employee (No Auth):', createEmployeeDto);
  //   return this.ownerService.createEmployee(createEmployeeDto);
  // }
}
