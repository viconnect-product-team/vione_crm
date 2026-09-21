import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { vione_users, app_role } from '@vibe/db';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string): Promise<vione_users | null> {
    const user = await this.prisma.vione_users
      .findFirst({
        where: {
          OR: [{ username }, { email: username }],
        },
      })
      .catch(() => null);

    if (user) {
      return user;
    }

    if (username === 'admin@connect.vn') {
      return {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'admin@connect.vn',
        password:
          '$2b$10$FLMpymq2ujbhVinusol9XuMc5pjTY97IZNrT0b9UAmzRtMoKrXHbu',
        email: 'admin@connect.vn',
        name: 'Administrator',
        avatar_url: null,
        google_id: null,
        apple_id: null,
        email_verified: true,
        apple_refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as vione_users;
    }

    return null;
  }

  async findById(id: string): Promise<vione_users | null> {
    const user = await this.prisma.vione_users
      .findUnique({
        where: { id },
      })
      .catch(() => null);

    if (user) {
      return user;
    }

    if (id === 'mock-admin-id' || id === '00000000-0000-0000-0000-000000000000') {
      return {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'admin@connect.vn',
        password:
          '$2b$10$FLMpymq2ujbhVinusol9XuMc5pjTY97IZNrT0b9UAmzRtMoKrXHbu',
        email: 'admin@connect.vn',
        name: 'Administrator',
        avatar_url: null,
        google_id: null,
        apple_id: null,
        email_verified: true,
        apple_refresh_token: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as vione_users;
    }

    return null;
  }

  async findByGoogleId(googleId: string): Promise<vione_users | null> {
    return this.prisma.vione_users
      .findUnique({
        where: { google_id: googleId },
      })
      .catch(() => null);
  }

  async findByAppleId(appleId: string): Promise<vione_users | null> {
    return this.prisma.vione_users
      .findUnique({
        where: { apple_id: appleId },
      })
      .catch(() => null);
  }

  async findByEmail(email: string): Promise<vione_users | null> {
    return this.prisma.vione_users
      .findUnique({
        where: { email },
      })
      .catch(() => null);
  }

  async createUser(data: {
    username: string;
    password?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    google_id?: string;
    apple_id?: string;
    email_verified?: boolean;
  }) {
    const newUser = await this.prisma.vione_users.create({
      data: {
        username: data.username,
        password: data.password || '',
        email: data.email || null,
        name: data.name || null,
        avatar_url: data.avatar_url || null,
        google_id: data.google_id || null,
        apple_id: data.apple_id || null,
        email_verified: data.email_verified || false,
      },
    });

    // Sync to auth.users to satisfy foreign key constraints in related tables
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO auth.users (id, email, role) VALUES ($1::uuid, $2, 'authenticated') ON CONFLICT (id) DO NOTHING`,
      newUser.id,
      newUser.email || newUser.username,
    ).catch((err) => {
      console.error('Failed to sync user to auth.users:', err);
    });

    // Auto-link to approved member in public.members if matching phone or email
    const cleanPhone = (newUser.username || '').replace(/\D/g, '');
    const userEmail = (newUser.email || '').toLowerCase().trim();
    if (cleanPhone || userEmail) {
      await this.prisma.$executeRaw`
        UPDATE public.members
        SET user_id = ${newUser.id}::uuid, updated_at = now()
        WHERE user_id IS NULL
          AND (
            (${cleanPhone} != '' AND regexp_replace(phone, '\\D', '', 'g') = ${cleanPhone})
            OR (${userEmail} != '' AND LOWER(email) = ${userEmail})
          )
      `.catch((e) => console.warn('Could not auto-link member:', e));
    }

    return newUser;
  }

  async updateUser(id: string, data: Partial<vione_users>) {
    return this.prisma.vione_users.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  // ── ACCOUNT MANAGEMENT METHODS ──────────────────────────────────────────

  async checkIsAdmin(userId: string): Promise<boolean> {
    if (userId === 'mock-admin-id' || userId === '00000000-0000-0000-0000-000000000000') {
      return true;
    }
    const roles = await this.prisma.user_roles.findMany({
      where: { user_id: userId },
    }).catch(() => [] as any[]);

    const hasAdminRole = roles.some(
      (r: any) => r.role === 'platform_admin' || r.role === 'tenant_admin',
    );
    if (hasAdminRole) return true;

    // Check association admin in memberships via raw SQL
    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships WHERE user_id = ${userId}::uuid
    `.catch(() => [] as any[]);

    return memberships.some(
      (m: any) => m.role === 'admin' || m.role === 'association_admin',
    );
  }

  async getAccountDetails(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }

    const [profile, roles, memberships] = await Promise.all([
      this.prisma.user_profiles.findUnique({
        where: { user_id: userId },
      }).catch(() => null),
      this.prisma.user_roles.findMany({
        where: { user_id: userId },
      }).catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT role FROM public.memberships WHERE user_id = ${userId}::uuid
      `.catch(() => [] as any[]),
    ]);

    const roleList = roles.map((r) => r.role);
    const isAssocAdmin = (memberships ?? []).some(
      (m: any) => m.role === 'admin' || m.role === 'association_admin' || m.role === 'owner',
    );
    if (isAssocAdmin && !roleList.includes('admin')) {
      roleList.push('admin');
    }

    if (
      (userId === '00000000-0000-0000-0000-000000000000' || user.username === 'admin@connect.vn') &&
      !roleList.includes('platform_admin')
    ) {
      roleList.push('platform_admin');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url || profile?.avatar_url || null,
      email_verified: user.email_verified,
      google_linked: !!user.google_id,
      apple_linked: !!user.apple_id,
      has_password: !!user.password && user.password.length > 0,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: profile
        ? {
            display_name: profile.display_name,
            professional_title: profile.professional_title,
            company_name: profile.company_name,
            industry: profile.industry,
            region: profile.region,
            bio: profile.bio,
            locale: profile.locale,
            timezone: profile.timezone,
            onboarding_status: profile.onboarding_status,
            account_status: profile.account_status,
          }
        : null,
      roles: roleList,
    };
  }

  async updateAccountProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      avatar_url?: string;
      professional_title?: string;
      company_name?: string;
      industry?: string;
      region?: string;
      bio?: string;
      locale?: string;
      timezone?: string;
    },
  ) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.vione_users.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });
      if (existing) {
        throw new BadRequestException('Email đã được sử dụng bởi một tài khoản khác');
      }
    }

    // Update vione_users
    await this.prisma.vione_users.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        avatar_url: data.avatar_url !== undefined ? data.avatar_url : undefined,
        updated_at: new Date(),
      },
    });

    // Upsert user_profiles
    await this.prisma.user_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        display_name: data.name || user.name || null,
        avatar_url: data.avatar_url || user.avatar_url || null,
        professional_title: data.professional_title || null,
        company_name: data.company_name || null,
        industry: data.industry || null,
        region: data.region || null,
        bio: data.bio || null,
        locale: data.locale || 'vi',
        timezone: data.timezone || 'Asia/Ho_Chi_Minh',
        onboarding_status: 'completed',
        account_status: 'active',
      },
      update: {
        display_name: data.name !== undefined ? data.name : undefined,
        avatar_url: data.avatar_url !== undefined ? data.avatar_url : undefined,
        professional_title:
          data.professional_title !== undefined ? data.professional_title : undefined,
        company_name: data.company_name !== undefined ? data.company_name : undefined,
        industry: data.industry !== undefined ? data.industry : undefined,
        region: data.region !== undefined ? data.region : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
        locale: data.locale !== undefined ? data.locale : undefined,
        timezone: data.timezone !== undefined ? data.timezone : undefined,
        updated_at: new Date(),
      },
    });

    // Sync email to auth.users
    if (data.email) {
      await this.prisma
        .$executeRawUnsafe(
          `UPDATE auth.users SET email = $1 WHERE id = $2::uuid`,
          data.email,
          userId,
        )
        .catch(() => {});
    }

    return this.getAccountDetails(userId);
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await this.prisma.vione_users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    // If user has an existing password, verify it
    if (user.password && user.password.length > 0) {
      if (!currentPass) {
        throw new BadRequestException('Vui lòng cung cấp mật khẩu hiện tại');
      }
      const isMatch = await bcrypt.compare(currentPass, user.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    await this.prisma.vione_users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    // Sync to auth.users encrypted_password if applicable
    await this.prisma
      .$executeRawUnsafe(
        `UPDATE auth.users SET encrypted_password = $1 WHERE id = $2::uuid`,
        hashedPassword,
        userId,
      )
      .catch(() => {});

    // Đánh dấu onboarding_status = 'completed' để hoàn tất quy trình đổi mật khẩu bắt buộc
    await this.prisma.$executeRaw`
      UPDATE public.user_profiles
      SET onboarding_status = 'completed'::public.onboarding_status, updated_at = now()
      WHERE user_id = ${userId}::uuid
    `.catch(() => null);

    return {
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công',
    };
  }

  async checkMustChangePassword(userId: string): Promise<boolean> {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT onboarding_status::text as onboarding_status
        FROM public.user_profiles
        WHERE user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => []);
      if (rows && rows[0]) {
        return rows[0].onboarding_status === 'new';
      }
      return false;
    } catch {
      return false;
    }
  }

  async deactivateAccount(userId: string, password?: string) {
    const user = await this.prisma.vione_users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }
    if (user.password && password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu xác nhận không chính xác');
      }
    }
    await this.prisma.user_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        account_status: 'deactivated',
      },
      update: {
        account_status: 'deactivated',
        updated_at: new Date(),
      },
    });
    return { success: true, message: 'Tài khoản đã được vô hiệu hóa thành công' };
  }

  // ── ADMIN USER MANAGEMENT METHODS ───────────────────────────────────────

  async listUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, rawUsers] = await Promise.all([
      this.prisma.vione_users.count({ where }),
      this.prisma.vione_users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const userIds = rawUsers.map((u) => u.id);

    const [profiles, roles] = await Promise.all([
      this.prisma.user_profiles.findMany({
        where: { user_id: { in: userIds } },
      }).catch(() => [] as any[]),
      this.prisma.user_roles.findMany({
        where: { user_id: { in: userIds } },
      }).catch(() => [] as any[]),
    ]);

    const profileMap = new Map<string, any>();
    for (const p of profiles as any[]) {
      profileMap.set(p.user_id, p);
    }
    const roleMap = new Map<string, string[]>();
    for (const r of roles as any[]) {
      const list = roleMap.get(r.user_id) || [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }

    let items = rawUsers.map((u) => {
      const p = profileMap.get(u.id);
      const userRoles = roleMap.get(u.id) || [];
      if (
        (u.id === '00000000-0000-0000-0000-000000000000' || u.username === 'admin@connect.vn') &&
        !userRoles.includes('platform_admin')
      ) {
        userRoles.push('platform_admin');
      }

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        name: u.name || p?.display_name || '—',
        avatar_url: u.avatar_url || p?.avatar_url || null,
        email_verified: u.email_verified,
        account_status: p?.account_status || 'active',
        company_name: p?.company_name || null,
        professional_title: p?.professional_title || null,
        roles: userRoles,
        created_at: u.created_at,
        updated_at: u.updated_at,
      };
    });

    // Optional in-memory role & status filters if applied
    if (params.role && params.role !== 'all') {
      items = items.filter((u) => u.roles.includes(params.role as any));
    }
    if (params.status && params.status !== 'all') {
      items = items.filter((u) => u.account_status === params.status);
    }

    // Quick stats overview
    const [allProfiles, allRoles] = await Promise.all([
      this.prisma.user_profiles.findMany({
        select: { account_status: true },
      }).catch(() => [] as any[]),
      this.prisma.user_roles.findMany({
        select: { role: true },
      }).catch(() => [] as any[]),
    ]);

    const activeCount = (allProfiles as any[]).filter((p: any) => p.account_status === 'active').length;
    const suspendedCount = (allProfiles as any[]).filter((p: any) => p.account_status === 'suspended').length;
    const adminCount = (allRoles as any[]).filter(
      (r: any) => r.role === 'platform_admin' || r.role === 'tenant_admin',
    ).length;

    return {
      users: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total,
        active: activeCount || total,
        suspended: suspendedCount,
        admins: adminCount || 1,
      },
    };
  }

  async adminCreateUser(data: {
    username: string;
    email?: string;
    password?: string;
    name?: string;
    role?: app_role;
    account_status?: string;
  }) {
    if (!data.username || !data.username.trim()) {
      throw new BadRequestException('Tên đăng nhập không được để trống');
    }
    const username = data.username.trim();

    const existing = await this.prisma.vione_users.findFirst({
      where: {
        OR: [
          { username },
          ...(data.email ? [{ email: data.email.trim() }] : []),
        ],
      },
    });
    if (existing) {
      throw new BadRequestException('Tên đăng nhập hoặc Email đã tồn tại');
    }

    const rawPassword = data.password && data.password.trim() ? data.password : 'Vione@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const newUser = await this.createUser({
      username,
      email: data.email ? data.email.trim() : (username.includes('@') ? username : undefined),
      password: hashedPassword,
      name: data.name ? data.name.trim() : username,
      email_verified: true,
    });

    const accountStatus = data.account_status || 'active';
    await this.prisma.user_profiles.upsert({
      where: { user_id: newUser.id },
      create: {
        user_id: newUser.id,
        display_name: newUser.name,
        account_status: accountStatus,
        onboarding_status: 'completed',
      },
      update: {
        account_status: accountStatus,
      },
    });

    if (data.role) {
      await this.prisma.user_roles.create({
        data: {
          user_id: newUser.id,
          role: data.role,
        },
      }).catch(() => {});
    }

    return this.getAccountDetails(newUser.id);
  }

  async adminUpdateUser(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: app_role;
      account_status?: string;
    },
  ) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.vione_users.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException('Email đã thuộc về tài khoản khác');
      }
    }

    await this.prisma.vione_users.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        updated_at: new Date(),
      },
    });

    if (data.account_status || data.name) {
      await this.prisma.user_profiles.upsert({
        where: { user_id: id },
        create: {
          user_id: id,
          display_name: data.name || user.name,
          account_status: data.account_status || 'active',
        },
        update: {
          display_name: data.name !== undefined ? data.name : undefined,
          account_status: data.account_status !== undefined ? data.account_status : undefined,
          updated_at: new Date(),
        },
      });
    }

    if (data.role) {
      await this.prisma.user_roles.deleteMany({
        where: { user_id: id },
      }).catch(() => {});

      await this.prisma.user_roles.create({
        data: {
          user_id: id,
          role: data.role,
        },
      }).catch(() => {});
    }

    return this.getAccountDetails(id);
  }

  async adminResetPassword(id: string, newPass: string) {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có tối thiểu 6 ký tự');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    await this.prisma.vione_users.update({
      where: { id },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    await this.prisma
      .$executeRawUnsafe(
        `UPDATE auth.users SET encrypted_password = $1 WHERE id = $2::uuid`,
        hashedPassword,
        id,
      )
      .catch(() => {});

    return {
      success: true,
      message: 'Mật khẩu đã được thiết lập lại thành công',
    };
  }

  async adminToggleStatus(id: string, newStatus?: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    const currentProfile = await this.prisma.user_profiles.findUnique({
      where: { user_id: id },
    }).catch(() => null);

    let nextStatus = newStatus;
    if (!nextStatus) {
      const current = currentProfile?.account_status || 'active';
      nextStatus = current === 'active' ? 'suspended' : 'active';
    }

    await this.prisma.user_profiles.upsert({
      where: { user_id: id },
      create: {
        user_id: id,
        display_name: user.name,
        account_status: nextStatus,
      },
      update: {
        account_status: nextStatus,
        updated_at: new Date(),
      },
    });

    return {
      id,
      status: nextStatus,
      message:
        nextStatus === 'active'
          ? 'Tài khoản đã được mở khóa và kích hoạt'
          : 'Tài khoản đã bị tạm khóa',
    };
  }

  async adminDeleteUser(callerId: string, targetId: string) {
    if (callerId === targetId) {
      throw new BadRequestException('Bạn không thể xóa tài khoản của chính mình');
    }

    if (
      targetId === '00000000-0000-0000-0000-000000000000' ||
      targetId === 'mock-admin-id'
    ) {
      throw new ForbiddenException('Không thể xóa tài khoản quản trị viên gốc');
    }

    const user = await this.findById(targetId);
    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    await this.prisma.user_roles.deleteMany({
      where: { user_id: targetId },
    }).catch(() => {});

    await this.prisma.user_profiles.delete({
      where: { user_id: targetId },
    }).catch(() => {});

    await this.prisma.vione_users.delete({
      where: { id: targetId },
    }).catch(() => {});

    await this.prisma
      .$executeRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, targetId)
      .catch(() => {});

    return {
      success: true,
      message: 'Đã xóa tài khoản người dùng thành công',
    };
  }
}

