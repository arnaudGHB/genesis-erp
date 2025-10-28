import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * FlexibleAuthGuard: Guard d'authentification avec mode développement
 *
 * Comportement:
 * - Si DEV_MODE=true: autorise toutes les requêtes et attache un utilisateur minimal
 * - Si DEV_MODE=false (ou absent): applique la sécurité JWT stricte
 *
 * Usage: Remplacer AuthGuard('jwt') par FlexibleAuthGuard dans les controllers
 */
@Injectable()
export class FlexibleAuthGuard implements CanActivate {
  private readonly jwtGuard = new (AuthGuard('jwt') as any)();
  private readonly devMode = process.env.DEV_MODE === 'true';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Mode développement: bypass complet
    if (this.devMode) {
      const request = context.switchToHttp().getRequest();
      // Attacher un utilisateur minimal pour que le code fonctionne
      request.user = {
        id: 'dev-user',
        email: 'dev@example.com',
        name: 'Développeur',
        roles: [
          {
            name: 'Administrateur',
            permissions: [
              { name: 'user:read' },
              { name: 'user:create' },
              { name: 'user:update' },
              { name: 'user:delete' },
              { name: 'product:read' },
              { name: 'product:create' },
              { name: 'product:update' },
              { name: 'product:delete' },
              { name: 'stock:read' },
              { name: 'stock:create' },
              { name: 'stock:update' },
              { name: 'stock:delete' },
              { name: 'stock:adjust' },
              { name: 'role:read' },
              { name: 'role:assign' },
            ],
          },
        ],
      };
      return true;
    }

    // Mode production: sécurité stricte JWT
    try {
      const result = await this.jwtGuard.canActivate(context);
      return result as boolean;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return false;
    }
  }
}
