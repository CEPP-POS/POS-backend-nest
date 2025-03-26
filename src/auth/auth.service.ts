import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OwnerService } from 'src/owner-side/manage-owner/owner.service';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: OwnerService,
    private readonly jwtService: JwtService,
  ) {}
  // * Login
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    console.log('[File auth service] USER FOUND:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.otp && user.otp === loginDto.password) {
      throw new UnauthorizedException(
        'You must reset your password before accessing the system.',
      );
    }

    console.log('🔍 Checking user.branch:', user.branch);

    const branchId = user.branch ? user.branch.branch_id : null;

    console.log('✅ Extracted branch_id:', branchId);

    const payload = {
      owner_id: user.owner_id,
      email: user.email,
      branch_id: branchId,
      roles: user.roles && user.roles.length > 0 ? user.roles : ['employee'],
    };

    const token = await this.jwtService.signAsync(payload);
    console.log('[Auth Service] GENERATED TOKEN:', token);
    return {
      token,
      owner_id: user.owner_id,
      branch_id: branchId,
    };
  }

  // * Validate user
  async validateUser(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    console.log('🔍 Found user:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log('📌 Input Password:', loginDto.password);
    console.log('🔐 Hashed Password in DB:', user.password);

    if (!user.password) {
      throw new UnauthorizedException('No password set for this account');
    }

    const passwordValid = await compare(loginDto.password, user.password);
    console.log('✅ Password Match:', passwordValid);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
