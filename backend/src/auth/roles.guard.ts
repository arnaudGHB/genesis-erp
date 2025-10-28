import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle requis, autoriser l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Vérifier que l'utilisateur existe
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Vérifier que l'utilisateur a des rôles
    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('User has no roles assigned');
    }

    // Extraire les noms des rôles de l'utilisateur
    const userRoles: string[] = user.roles.map((role: any) => {
      // Gérer différents formats de rôles
      if (typeof role === 'string') {
        return role;
      }
      return role.name || role;
    }).filter(Boolean);

    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRequiredRole = requiredRoles.some((requiredRole) =>
      userRoles.includes(requiredRole)
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      );
    }

    return true;
  }
}
