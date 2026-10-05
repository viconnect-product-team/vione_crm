import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true,
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const identifier = (email || req.body?.username || req.body?.identifier || '').trim();
    const pwd = password || req.body?.password || '';
    const user = await this.authService.validateUser(identifier, pwd);
    if (!user) {
      throw new UnauthorizedException('Email / Số điện thoại đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
    return user;
  }
}
