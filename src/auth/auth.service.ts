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
    console.log('USER FOUND:', user);   
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const payload = {
      owner_id: user.owner_id,
      email: user.email,
      branch_id: user.branch_id || null,
      roles: user.roles, 
    };
    const token = await this.jwtService.signAsync(payload);
    console.log('GENERATED TOKEN:', token);   
    return {
      token
    };
  }

  async validateUser(loginOwnerDto: LoginOwnerDto) {
    const user = await this.userService.findByEmail(loginOwnerDto.email);

    if (user && (await compare(loginOwnerDto.password, user.password))) {
      return user;
    }

    throw new UnauthorizedException('Username or password not correct.');
  }
}
