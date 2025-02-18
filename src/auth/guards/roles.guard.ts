import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserPayload } from '../interfaces/user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    console.log('User in RolesGuard:', user);
    
    // * If user is not logged in, he can't access any route
    if (!user || !Array.isArray(user.roles)) {  
      console.warn('User has no valid roles:', user);
      return false;
    }
    // * If user is owner, he can access any route
    if (user.roles.includes('owner')) return true;

    return requiredRoles.some((requiredRole) => user.roles.includes(requiredRole));
        
  }
}
