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
} from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner/create-owner.dto';
import { Express } from 'express';
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
    const existingOwner = await this.ownerService.findByEmail(
      createOwnerDto.email,
    );
    // * Check if there is already an email in the system.
    if (existingOwner) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }
    // * Create a new owner
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
    // * Create an array to store the owner data from the CSV file.
    const owners: CreateOwnerDto[] = [];
    // * Convert the uploaded file (buffer) to a readable stream and use csv-parser to read the CSV data.
    const stream = Readable.from(file.buffer.toString());
    return new Promise((resolve, reject) => {
      stream
        // * Read the CSV data
        .pipe(csvParser())
        .on('data', async (row) => {
          // * Generate a random temporary password
          const tempPassword = Math.random().toString(36).slice(-8);
          // * Create a DTO for Owner from data in each row of the CSV file.
          const createOwnerDto: CreateOwnerDto = {
            owner_name: row.owner_name,
            contact_info: row.contact_info,
            email: row.email,
            password: tempPassword,
          };
          console.log('createOwnerDto', createOwnerDto);
          // * Send temporary password to the user's email
          await sendTemporaryPasswordEmail(createOwnerDto.email, tempPassword);
          // * Add the owner data to the array for later processing
          owners.push(createOwnerDto);
          await this.ownerService.create(createOwnerDto);
          console.log('EACH OWNERS', owners);
        })
        .on('end', async () => {
          try {
            // * Loop through each owner data into the database.
            console.log('OWNERS', owners);
            resolve({ message: 'CSV data uploaded successfully' });
          } catch (error) {
            reject(
              new HttpException(
                'Error uploading CSV data',
                HttpStatus.INTERNAL_SERVER_ERROR,
              ),
            );
          }
        })
        .on('error', (error) => {
          reject(
            new HttpException(
              `Error reading CSV file: ${error.message}`,
              HttpStatus.BAD_REQUEST,
            ),
          );
        });
    });
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
  getProfile() {
    return { message: 'This is owner profile' };
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
  //Entity
  // @Post('create-employee')
  // @Roles('owner')
  // @UseGuards(JwtGuard, RolesGuard)
  // async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
  //   return this.ownerService.createEmployee(createEmployeeDto);
  // }
}
