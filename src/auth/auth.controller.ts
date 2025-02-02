import { Controller } from '@nestjs/common';
import { OwnerService } from 'src/owner-side/owner/owner.service';
import { AuthService } from './auth.service';
import { Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { CreateOwnerDto } from 'src/owner-side/owner/dto/create-owner/create-owner.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginOwnerDto } from 'src/owner-side/owner/dto/login-owner/login-owner.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly ownerService: OwnerService,
        private readonly authService: AuthService,
    ) { }

    //Function Register Owner
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
}
