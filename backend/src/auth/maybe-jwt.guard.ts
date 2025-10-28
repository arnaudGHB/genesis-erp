import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MaybeJwtGuard implements CanActivate {
  private readonly delegate = new (AuthGuard('jwt') as any)();

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.BYPASS_AUTH === 'true') {
      // In bypass mode, allow all requests and attach a minimal user
      const req = context.switchToHttp().getRequest();
      if (!req.user) {
        req.user = { id: 'dev', email: 'dev@example.com', roles: [] };
      }
      return true;
    }
    // Delegate to the real JWT guard
    const result = await this.delegate.canActivate(context);
    // Support both boolean and Promise<boolean> return types
    if (typeof result === 'boolean') return result;
    return !!(await result);
  }
}
