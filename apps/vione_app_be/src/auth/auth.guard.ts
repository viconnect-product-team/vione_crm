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
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      });
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;
    
    // Cookie support (vibe_token, token, access_token)
    if (request.cookies) {
      if (request.cookies.vibe_token) return request.cookies.vibe_token;
      if (request.cookies.token) return request.cookies.token;
      if (request.cookies.access_token) return request.cookies.access_token;
    }
    
    // Raw cookie header parsing fallback
    const rawCookie = request.headers?.cookie;
    if (rawCookie && typeof rawCookie === 'string') {
      const match = rawCookie.match(/(?:vibe_token|access_token|token)=([^;]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }

    // Query parameter token fallback (?token=...)
    if (request.query?.token) return request.query.token;

    return undefined;
  }
}
