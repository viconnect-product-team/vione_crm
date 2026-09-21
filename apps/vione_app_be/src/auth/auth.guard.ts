import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // 1. Thử verify bằng JWT_SECRET của NestJS backend
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      });
      request['user'] = payload;
      return true;
    } catch {
      // 2. Nếu thất bại, thử verify bằng SUPABASE_JWT_SECRET của Supabase
      try {
        const supabaseSecret =
          process.env.SUPABASE_JWT_SECRET ||
          'super-secret-jwt-key-with-at-least-32-characters-long';
        const payload = await this.jwtService.verifyAsync(token, {
          secret: supabaseSecret,
        });

        // Map payload từ Supabase (chứa 'sub' là userId, 'email') sang payload NestJS
        request['user'] = {
          sub: payload.sub,
          username: payload.email || '',
          ...payload,
        };
        return true;
      } catch {
        throw new UnauthorizedException();
      }
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;
    
    // Cookie support (vibe_token, sb-access-token, token, access_token)
    if (request.cookies) {
      if (request.cookies.vibe_token) return request.cookies.vibe_token;
      if (request.cookies['sb-access-token']) return request.cookies['sb-access-token'];
      if (request.cookies.token) return request.cookies.token;
      if (request.cookies.access_token) return request.cookies.access_token;
    }
    
    // Raw cookie header parsing fallback
    const rawCookie = request.headers?.cookie;
    if (rawCookie && typeof rawCookie === 'string') {
      const match = rawCookie.match(/(?:vibe_token|sb-access-token|access_token|token)=([^;]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }

    // Query parameter token fallback (?token=...)
    if (request.query?.token) return request.query.token;

    return undefined;
  }
}
