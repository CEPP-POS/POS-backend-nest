import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OwnerModule } from 'src/owner-side/owner/owner.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './common/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => OwnerModule), 
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
