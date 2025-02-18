import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { OwnerService } from 'src/owner-side/owner/owner.service';
import { IJwtPayload } from './jwt.interface';
import { UserPayload } from './user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly ownerService: OwnerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: IJwtPayload): Promise<UserPayload> {
    console.log('Decoded JWT Payload:', payload);

    const existingUser = await this.ownerService.findByEmail(payload.email);

    if (!existingUser) throw new UnauthorizedException('Invalid token.');

    console.log('User from DB:', existingUser);

    return {
      owner_id: existingUser.owner_id,
      email: existingUser.email,
      branch_id: existingUser.branch_id || null,
      roles: existingUser.roles,
    };
  }
}
