import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      return { id: '00000000-0000-0000-0000-000000000000', username: 'guest' } as unknown as TUser;
    }
    return user;
  }
}
