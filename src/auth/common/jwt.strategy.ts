import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt";
// import { IJwtPayload } from "../interfaces/jwt.interface";
// import { UsersService } from "src/users/users.service";
import { OwnerService } from "src/owner-side/owner/owner.service";
import { IJwtPayload } from "./jwt.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService, private readonly ownerService: OwnerService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_SECRET'),
        })
    }

    async validate(payload: IJwtPayload) {
        const existingUser = this.ownerService.findByEmail(payload.email)

        if (!existingUser) throw new UnauthorizedException('Invalid token.')

        return existingUser;
    }
}