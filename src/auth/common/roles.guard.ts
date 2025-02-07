import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserPayload } from './user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    console.log('User in RolesGuard:', user);

    if (!user || !Array.isArray(user.roles)) {  
      console.warn('User has no valid roles:', user);
      return false;
    }

    return user.roles.some((role) => requiredRoles.includes(role));
  }
}
