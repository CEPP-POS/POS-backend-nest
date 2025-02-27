import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { OwnerService } from 'src/owner-side/manage-owner/owner.service';
import { AuthService } from './auth.service';
import { CreateOwnerDto } from 'src/owner-side/manage-owner/dto/create-owner/create-owner.dto';
import { LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly ownerService: OwnerService,
    private readonly authService: AuthService,
  ) {}

  // * Register Owner
  @Post('register')
  async register(@Body() createOwnerDto: CreateOwnerDto) {
    try {
      return await this.ownerService.createOwnerWithBranch(createOwnerDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // * Login Owner
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
