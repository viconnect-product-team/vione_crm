/* eslint-disable */
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private appleJwksClient: jwksClient.JwksClient;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService?: MailService,
  ) {
    this.googleClient = new OAuth2Client();
    this.appleJwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
    });
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user || !user.password) {
      return null;
    }
    
    const isMatch = await bcrypt.compare(pass, user.password);
    
    if (isMatch) {
      const { password, ...result } = user;
      return {
        ...result,
        id: result.id.toString(),
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, name: user.name, email: user.email };
    const refreshPayload = { sub: user.id, type: 'refresh' };
    const mustChangePassword = await this.usersService.checkMustChangePassword(user.id);
    
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '60m' }),
      refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: '7d' }),
      mustChangePassword,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        mustChangePassword,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken) as any;
      if (decoded?.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const payload = { username: user.username, sub: user.id, name: user.name, email: user.email };
      const newRefreshPayload = { sub: user.id, type: 'refresh' };
      return {
        access_token: this.jwtService.sign(payload, { expiresIn: '60m' }),
        refresh_token: this.jwtService.sign(newRefreshPayload, { expiresIn: '7d' }),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token hết hạn hoặc không hợp lệ');
    }
  }

  async register(data: any) {
    const existingUser = await this.usersService.findByUsername(data.username);
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = await this.usersService.createUser({
      username: data.username,
      password: hashedPassword,
      email: data.username.includes('@') ? data.username : undefined,
      name: data.name || data.fullName,
      email_verified: false,
    });

    const { password, ...result } = newUser;

    // Gửi email chào mừng đăng ký thành công về email người đăng ký
    const targetEmail = (data.email || (data.username?.includes('@') ? data.username : '') || '').trim();
    if (this.mailService && targetEmail && targetEmail.includes('@')) {
      const applicantName = data.name || data.fullName || data.username || 'Quý Hội viên';
      void this.mailService.sendAppWelcomeRegistrationEmail({
        to: targetEmail,
        fullName: applicantName,
        username: data.username,
        phone: data.phone,
        companyName: data.company || data.companyName,
        portalUrl: 'https://14.225.217.232:5444/association/login',
      }).catch((err) => {
        console.warn('Could not send app welcome email:', err?.message);
      });
    }

    return {
      message: 'Registration successful',
      user: {
        ...result,
        id: result.id.toString(),
      },
    };
  }

  // ── GOOGLE SIGN IN ─────────────────────────────────────────────────────────

  async googleLogin(idToken: string) {
    const clientIdWeb = process.env.GOOGLE_CLIENT_ID_WEB;
    const clientIdIos = process.env.GOOGLE_CLIENT_ID_IOS;
    const allowedAudience = [clientIdWeb, clientIdIos].filter(Boolean) as string[];

    if (allowedAudience.length === 0) {
      throw new BadRequestException('Google Client IDs not configured on backend');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: allowedAudience,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      // Check claims
      const iss = payload.iss;
      if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
        throw new UnauthorizedException('Invalid token issuer');
      }

      const googleId = payload.sub;
      const email = payload.email || '';
      const name = payload.name || '';
      const picture = payload.picture || '';

      // User Logic
      let user = await this.usersService.findByGoogleId(googleId);
      
      if (!user && email) {
        // Fallback check by email to link accounts
        user = await this.usersService.findByEmail(email);
      }

      if (!user) {
        // Create user
        user = await this.usersService.createUser({
          username: email || `google-${googleId}`,
          email: email || undefined,
          name: name || undefined,
          avatar_url: picture || undefined,
          google_id: googleId,
          email_verified: true,
        });
      } else {
        // Update / link account
        const updateData: any = {};
        if (!user.google_id) updateData.google_id = googleId;
        if (!user.email_verified) updateData.email_verified = true;
        if (!user.name && name) updateData.name = name;
        if (!user.avatar_url && picture) updateData.avatar_url = picture;

        if (Object.keys(updateData).length > 0) {
          user = await this.usersService.updateUser(user.id, updateData) as any;
        }
      }

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException(e.message || 'Google authentication failed');
    }
  }

  // ── SIGN IN WITH APPLE ─────────────────────────────────────────────────────

  private getAppleSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.appleJwksClient.getSigningKey(kid, (err, key) => {
        if (err || !key) {
          reject(err || new Error('Apple key not found'));
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }

  async appleLogin(data: { identityToken: string; authorizationCode?: string; fullName?: any; email?: string }) {
    const bundleId = process.env.APPLE_BUNDLE_ID;
    const serviceId = process.env.APPLE_SERVICE_ID;
    const allowedAudience = [bundleId, serviceId].filter(Boolean) as string[];

    if (allowedAudience.length === 0) {
      throw new BadRequestException('Apple Bundle/Service ID not configured on backend');
    }

    try {
      // Decode JWT header to find kid
      const decodedToken = jwt.decode(data.identityToken, { complete: true }) as any;
      if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
        throw new UnauthorizedException('Invalid Apple token format');
      }

      const kid = decodedToken.header.kid;
      const publicKey = await this.getAppleSigningKey(kid);

      // Verify token signature and claims
      const payload = jwt.verify(data.identityToken, publicKey, {
        audience: allowedAudience as [string, ...string[]],
        issuer: 'https://appleid.apple.com',
      }) as any;

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid Apple token payload');
      }

      const appleId = payload.sub;
      const tokenEmail = payload.email || '';
      
      // Apple only returns email & fullName in the first login. 
      // If we don't have it in payload, use the one sent by Client
      const email = tokenEmail || data.email || '';
      let name = '';
      if (data.fullName) {
        const firstName = data.fullName.firstName || '';
        const lastName = data.fullName.lastName || '';
        name = `${firstName} ${lastName}`.trim();
      }

      let user = await this.usersService.findByAppleId(appleId);

      if (!user && email) {
        // Fallback check by email to link accounts
        user = await this.usersService.findByEmail(email);
      }

      if (!user) {
        // Create user
        user = await this.usersService.createUser({
          username: email || `apple-${appleId}`,
          email: email || undefined,
          name: name || undefined,
          apple_id: appleId,
          email_verified: true,
        });
      } else {
        // Update / link account
        const updateData: any = {};
        if (!user.apple_id) updateData.apple_id = appleId;
        if (!user.email_verified) updateData.email_verified = true;
        if (!user.name && name) updateData.name = name;

        if (Object.keys(updateData).length > 0) {
          user = await this.usersService.updateUser(user.id, updateData) as any;
        }
      }

      // Exchange code for refresh token if provided
      if (data.authorizationCode && user) {
        try {
          const appleRefreshToken = await this.exchangeAppleCode(payload.aud, data.authorizationCode);
          if (appleRefreshToken) {
            await this.usersService.updateUser(user.id, { apple_refresh_token: appleRefreshToken });
          }
        } catch (err) {
          console.error('[Apple Auth] Code exchange failed:', err.message);
        }
      }

      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException(e.message || 'Apple authentication failed');
    }
  }

  private generateAppleClientSecret(clientId: string): string {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    let privateKey = process.env.APPLE_PRIVATE_KEY || '';

    if (!teamId || !keyId || !privateKey) {
      throw new Error('Apple configuration missing (TEAM_ID, KEY_ID, PRIVATE_KEY)');
    }

    // Format PEM formatting if it is on single line
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    const payload = {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (86400 * 30), // 30 days
      aud: 'https://appleid.apple.com',
      sub: clientId,
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: keyId,
    });
  }

  private async exchangeAppleCode(clientId: string, code: string): Promise<string | null> {
    const clientSecret = this.generateAppleClientSecret(clientId);
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post('https://appleid.apple.com/auth/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data?.refresh_token || null;
  }

  async forgotPassword(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.usersService.findByEmail(email.trim()).catch(() => null);
    // Return success to avoid email enumeration
    return { ok: true, message: 'Nếu email tồn tại trên hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.' };
  }

  async resetPassword(data: { email?: string; token?: string; newPassword?: string }) {
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    const email = data.email?.trim();
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.usersService.findByEmail(email).catch(() => null);
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại trên hệ thống');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);
    await this.usersService.updateUser(user.id, { password: hashedPassword });
    return { ok: true, message: 'Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.' };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    return this.usersService.changePassword(userId, currentPass, newPass);
  }
}
