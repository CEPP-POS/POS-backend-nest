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
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.ownerService.forgotPassword(forgotPasswordDto);
    return { message: 'OTP ถูกส่งไปยังอีเมลของคุณแล้ว' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    await this.ownerService.verifyOtp(verifyOtpDto);
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
  @Post('create-employee')
  @Roles('owner')
  @UseGuards(JwtGuard, RolesGuard)
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserPayload;
    return this.ownerService.createEmployee({
      ...createEmployeeDto,
      manager_id: user.owner_id,
    });
  }
  // * Dev only
  @Post('create-employee-dev')
  async createEmployeeWithoutAuth(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    console.log('🔍 Creating Employee (No Auth):', createEmployeeDto);
    return this.ownerService.createEmployee(createEmployeeDto);
  }
}
