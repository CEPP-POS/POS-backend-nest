import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OwnerService } from 'src/owner-side/owner/owner.service';
import { compare } from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { LoginOwnerDto } from 'src/owner-side/owner/dto/login-owner/login-owner.dto';
import { Branch } from 'src/entities/branch.entity';


@Injectable()
export class AuthService {
    constructor(
        private readonly userService: OwnerService,
        private readonly jwtService: JwtService) { }

    async login(loginOwnerDto: LoginOwnerDto) {
        const user = await this.validateUser(loginOwnerDto);
        const payload = { owner_id: user.owner_id, email: user.email, branch_id: user.owner_name }
        return {
            token: await this.jwtService.signAsync(payload)
        }
    }

    async validateUser(loginOwnerDto: LoginOwnerDto) {
        const user = await this.userService.findByEmail(loginOwnerDto.email);

        if (user && (await compare(loginOwnerDto.password, user.password))) {
            const { password, ...result } = user
            return result
        }

        throw new UnauthorizedException('username or password not correct.')
    }
}