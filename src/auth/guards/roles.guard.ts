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

    console.log('[RolesGuard] User in RolesGuard:', user);
    if (!user || !Array.isArray(user.roles)) {
      console.warn('[RolesGuard] User has no valid roles:', user);
      return false;
    }

    // ✅ Owner เข้าถึงได้ทั้งหมด
    if (user.roles.includes('owner')) return true;

    // ✅ ตรวจสอบสิทธิ์ของ Employee ตาม requiredRoles
    return requiredRoles.some((requiredRole) => user.roles.includes(requiredRole));
  }
}

