import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    if (req.body) {
      if (!req.body.email && (req.body.identifier || req.body.username)) {
        req.body.email = (req.body.identifier || req.body.username).trim();
      }
    }
    return super.canActivate(context);
  }
}

