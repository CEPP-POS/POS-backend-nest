import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OwnerService } from 'src/owner-side/owner/owner.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginOwnerDto } from 'src/owner-side/owner/dto/login-owner/login-owner.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: OwnerService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginOwnerDto: LoginOwnerDto) {
    const user = await this.validateUser(loginOwnerDto);
    console.log('[File auth service] USER FOUND:', user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    if (user.otp && user.otp === loginOwnerDto.password) {
      throw new UnauthorizedException(
        'You must reset your password before accessing the system.',
      );
    }
    const hasEmployees = await this.userService.countEmployees(user.owner_id);
    if (user.roles.includes('owner') && hasEmployees === 0) {
      throw new UnauthorizedException(
        'You must create at least one employee before accessing the system.',
      );
    }

    const payload = {
      owner_id: user.owner_id,
      email: user.email,
      branch_id: user.branch || null,
      roles: user.roles && user.roles.length > 0 ? user.roles : ['employee'],
    };

    const token = await this.jwtService.signAsync(payload);
    console.log('[Auth Service] GENERATED TOKEN:', token);
    return {
      token,
    };
  }

  async validateUser(loginOwnerDto: LoginOwnerDto) {
    const user = await this.userService.findByEmail(loginOwnerDto.email);
    console.log('🔍 Found user:', user);
    if (user) {
      console.log('📌 Input Password:', loginOwnerDto.password);
      console.log('🔐 Hashed Password in DB:', user.password);
      const passwordValid = await compare(
        loginOwnerDto.password,
        user.password,
      );
      console.log('✅ Password Match:', passwordValid);
      if (passwordValid) {
        return user;
      }
    }
    throw new UnauthorizedException('Username or password not correct.');
  }
}
