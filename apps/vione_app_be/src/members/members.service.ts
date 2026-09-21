import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

export class CreateMemberDto {
  name!: string;
  contact?: string;
  email?: string;
  phone?: string;
  type?: 'company' | 'individual';
  level?: string;
  industry?: string;
  region?: string;
  status?: 'active' | 'pending' | 'expired';
  address?: string;
  website?: string;
  taxCode?: string;
  employees?: number;
  about?: string;
  associationId?: string;
}

export class UpdateMemberDto {
  name?: string;
  contact?: string;
  email?: string;
  phone?: string;
  type?: 'company' | 'individual';
  level?: string;
  industry?: string;
  region?: string;
  status?: 'active' | 'pending' | 'expired';
  address?: string;
  website?: string;
  taxCode?: string;
  employees?: number;
  about?: string;
  feePaid?: boolean;
  feeYear?: number;
}

export class UpdateMemberContactDto {
  email?: string;
  phone?: string;
  address?: string;
}

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private mailService?: MailService,
  ) {}

  private async checkIsPlatformAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;
    if (userId === 'mock-admin-id' || userId === '00000000-0000-0000-0000-000000000000') {
      return true;
    }
    const roles = await this.prisma.$queryRaw<any[]>`
      SELECT role::text FROM public.user_roles WHERE user_id::text = ${userId}::text
    `.catch(() => [] as any[]);
    return roles.some(
      (r: any) => r.role === 'platform_admin' || r.role === 'tenant_admin' || r.role === 'admin',
    );
  }

  async checkIsAdmin(userId: string, assocId?: string): Promise<boolean> {
    if (await this.checkIsPlatformAdmin(userId)) return true;

    try {
      let mems: any[] = [];
      if (assocId) {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid AND association_id = ${assocId}::uuid
        `;
      } else {
        mems = await this.prisma.$queryRaw<any[]>`
          SELECT role FROM public.memberships 
          WHERE user_id = ${userId}::uuid
        `;
      }

      return mems.some(
        (m: any) => m.role === 'admin' || m.role === 'association_admin' || m.role === 'owner',
      );
    } catch {
      return false;
    }
  }

  async getAssociationIdForUser(userId: string, requestedAssocId?: string): Promise<string | null> {
    if (requestedAssocId) {
      const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);
      if (isPlatformAdmin) return requestedAssocId;
      const mem = await this.prisma.$queryRaw<any[]>`
        SELECT 1 FROM public.memberships 
        WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid
        UNION ALL
        SELECT 1 FROM public.members
        WHERE user_id = ${userId}::uuid AND association_id = ${requestedAssocId}::uuid AND status = 'active'
      `.catch(() => []);
      if (mem.length > 0) return requestedAssocId;
    }

    const mems = await this.prisma.$queryRaw<any[]>`
      SELECT association_id FROM (
        SELECT association_id, is_default, created_at FROM public.memberships
        WHERE user_id = ${userId}::uuid
        UNION ALL
        SELECT association_id, false AS is_default, created_at FROM public.members
        WHERE user_id = ${userId}::uuid AND status = 'active'
      ) m
      ORDER BY is_default DESC, created_at ASC
      LIMIT 1
    `.catch(() => []);

    if (mems.length > 0 && mems[0]?.association_id) {
      return mems[0].association_id;
    }

    // Fallback: ưu tiên association đang published (CEO1983)
    const firstAssoc = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations 
      ORDER BY landing_published DESC, created_at DESC 
      LIMIT 1
    `.catch(() => []);

    if (firstAssoc.length > 0 && firstAssoc[0]?.id) {
      return firstAssoc[0].id;
    }

    return null;
  }

  private mapMemberRow(r: any) {
    let joinedStr = '';
    if (r.joined_at) {
      if (r.joined_at instanceof Date) {
        joinedStr = r.joined_at.toISOString().slice(0, 10);
      } else {
        joinedStr = String(r.joined_at).slice(0, 10);
      }
    }

    // Normalize level
    let mappedLevel = 'memberLevel.medium';
    const rawLevel = String(r.level || '').toLowerCase();
    if (rawLevel.includes('large') || rawLevel.includes('vip') || rawLevel.includes('diamond') || rawLevel.includes('kim')) {
      mappedLevel = 'memberLevel.large';
    } else if (rawLevel.includes('medium') || rawLevel.includes('gold') || rawLevel.includes('vang')) {
      mappedLevel = 'memberLevel.medium';
    } else if (rawLevel.includes('small') || rawLevel.includes('silver') || rawLevel.includes('bac')) {
      mappedLevel = 'memberLevel.small';
    } else if (rawLevel.includes('individual') || rawLevel.includes('ca_nhan')) {
      mappedLevel = 'memberLevel.individual';
    } else if (r.level && r.level.startsWith('memberLevel.')) {
      mappedLevel = r.level;
    }

    // Normalize industry
    let mappedIndustry = 'ind.trade';
    const rawInd = String(r.industry || '').toLowerCase();
    if (rawInd.includes('it') || rawInd.includes('công nghệ') || rawInd.includes('phần mềm')) {
      mappedIndustry = 'ind.it';
    } else if (rawInd.includes('sản xuất') || rawInd.includes('manufacturing')) {
      mappedIndustry = 'ind.manufacturing';
    } else if (rawInd.includes('bất động sản') || rawInd.includes('realestate') || rawInd.includes('địa ốc')) {
      mappedIndustry = 'ind.realestate';
    } else if (rawInd.includes('tài chính') || rawInd.includes('finance') || rawInd.includes('ngân hàng')) {
      mappedIndustry = 'ind.finance';
    } else if (r.industry && r.industry.startsWith('ind.')) {
      mappedIndustry = r.industry;
    }

    // Normalize region
    let mappedRegion = 'region.north';
    const rawReg = String(r.region || '').toLowerCase();
    if (rawReg.includes('trung') || rawReg.includes('đà nẵng') || rawReg.includes('huế') || rawReg.includes('central')) {
      mappedRegion = 'region.central';
    } else if (rawReg.includes('nam') || rawReg.includes('hồ chí minh') || rawReg.includes('hcm') || rawReg.includes('sài gòn') || rawReg.includes('south')) {
      mappedRegion = 'region.south';
    } else if (r.region && r.region.startsWith('region.')) {
      mappedRegion = r.region;
    }

    // Normalize type
    let mappedType = 'company';
    const rawType = String(r.type || '').toLowerCase();
    if (rawType.includes('individual') || rawType.includes('ca_nhan') || rawType.includes('cá nhân')) {
      mappedType = 'individual';
    } else {
      mappedType = 'company';
    }

    return {
      id: r.id,
      memberId: r.id,
      member_id: r.id,
      code: r.code ?? '',
      name: r.name,
      contact: r.contact ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      type: mappedType,
      level: mappedLevel,
      industry: mappedIndustry,
      region: mappedRegion,
      status: r.status ?? 'active',
      joinedAt: joinedStr,
      feeYear: r.fee_year ?? new Date().getFullYear(),
      feePaid: Boolean(r.fee_paid),
      termEnd: r.term_end ? new Date(r.term_end).toISOString().slice(0, 10) : null,
      term_end: r.term_end ? new Date(r.term_end).toISOString().slice(0, 10) : null,
      renewedAt: r.renewed_at ? new Date(r.renewed_at).toISOString().slice(0, 10) : null,
      renewed_at: r.renewed_at ? new Date(r.renewed_at).toISOString().slice(0, 10) : null,
      newTermEnd: r.new_term_end ? new Date(r.new_term_end).toISOString().slice(0, 10) : null,
      new_term_end: r.new_term_end ? new Date(r.new_term_end).toISOString().slice(0, 10) : null,
      reminderCount: Number(r.reminder_count ?? 0),
      reminder_count: Number(r.reminder_count ?? 0),
      lastReminder: r.last_reminder ? new Date(r.last_reminder).toISOString().slice(0, 10) : null,
      last_reminder: r.last_reminder ? new Date(r.last_reminder).toISOString().slice(0, 10) : null,
      paymentStatus: r.payment_status || (r.fee_paid ? 'paid' : 'unpaid'),
      payment_status: r.payment_status || (r.fee_paid ? 'paid' : 'unpaid'),
      address: r.address ?? '',
      website: r.website ?? '',
      taxCode: r.tax_code ?? '',
      employees: r.employees ?? 0,
      about: r.about ?? '',
      associationId: r.association_id,
      userId: r.user_id,
      coverUrl: r.cover_url || null,
      cover_url: r.cover_url || null,
      avatarUrl: r.avatar_url || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async listMembers(
    userId: string,
    filters?: {
      q?: string;
      type?: string;
      industry?: string;
      region?: string;
      status?: string;
      associationId?: string;
    },
  ) {
    const isPlatformAdmin = await this.checkIsPlatformAdmin(userId);
    const assocId = await this.getAssociationIdForUser(userId, filters?.associationId);

    let rows: any[];
    if (isPlatformAdmin && !filters?.associationId) {
      // Platform admin không chỉ định assoc → thấy tất cả
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.members ORDER BY created_at DESC
      `.catch(() => []);
    } else if (assocId) {
      // User có association → lấy theo assoc
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.members WHERE association_id = ${assocId}::uuid ORDER BY created_at DESC
      `.catch(() => []);
    } else {
      // Không có association nào → lấy tất cả (fallback cho môi trường dev)
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.members ORDER BY created_at DESC
      `.catch(() => []);
    }

    let items = rows.map((r) => this.mapMemberRow(r));

    if (filters?.q) {
      const ql = filters.q.trim().toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(ql) ||
          m.code.toLowerCase().includes(ql) ||
          m.email.toLowerCase().includes(ql) ||
          m.contact.toLowerCase().includes(ql),
      );
    }
    if (filters?.type && filters.type !== 'all') {
      const targetType = filters.type.toLowerCase();
      items = items.filter((m) => {
        if (targetType === 'company' || targetType === 'enterprise' || targetType === 'corporate') {
          return m.type === 'company' || m.type === 'enterprise' || m.type === 'corporate';
        }
        return m.type === targetType;
      });
    }
    if (filters?.industry && filters.industry !== 'all') {
      items = items.filter((m) => m.industry === filters.industry);
    }
    if (filters?.region && filters.region !== 'all') {
      items = items.filter((m) => m.region === filters.region);
    }
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((m) => m.status === filters.status);
    }

    return items;
  }

  // Mobile API: member directory
  async listDirectory(userId: string) {
    const assocId = await this.getAssociationIdForUser(userId);

    let rows: any[];
    if (assocId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT m.code, m.name, m.contact, m.phone, m.email, m.about, m.address, m.website,
               m.industry, m.region, m.type, m.status, m.user_id, m.executive_role,
               COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url) as avatar,
               COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as person_name,
               COALESCE(m.executive_role, up.professional_title, bi.job_title, bi.headline, m.industry) as person_title
        FROM public.members m
        LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
        LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
        LEFT JOIN public.vione_users vu ON vu.id = m.user_id
        WHERE m.association_id = ${assocId}::uuid AND m.status = 'active'
        ORDER BY m.name ASC
      `.catch((err) => {
        console.error('listDirectory assoc query error:', err);
        return [];
      });
    } else {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT m.code, m.name, m.contact, m.phone, m.email, m.about, m.address, m.website,
               m.industry, m.region, m.type, m.status, m.user_id, m.executive_role,
               COALESCE(up.avatar_url, bi.avatar_url, vu.avatar_url) as avatar,
               COALESCE(up.display_name, vu.name, bi.display_name, m.contact, m.name) as person_name,
               COALESCE(m.executive_role, up.professional_title, bi.job_title, bi.headline, m.industry) as person_title
        FROM public.members m
        LEFT JOIN public.user_profiles up ON up.user_id = m.user_id
        LEFT JOIN public.business_identities bi ON bi.owner_user_id = m.user_id AND bi.status = 'active'
        LEFT JOIN public.vione_users vu ON vu.id = m.user_id
        WHERE m.status = 'active'
        ORDER BY m.name ASC
      `.catch((err) => {
        console.error('listDirectory all query error:', err);
        return [];
      });
    }

    return rows.map((m) => ({
      code: m.code ?? '',
      name: m.name,
      contact: m.contact ?? m.person_name ?? '',
      personName: m.person_name ?? m.contact ?? m.name,
      personTitle: m.person_title ?? '',
      email: m.email ?? null,
      phone: m.phone ?? null,
      about: m.about ?? null,
      address: m.address ?? null,
      website: m.website ?? null,
      industry: m.industry ?? '',
      region: m.region ?? '',
      type: m.type === 'individual' ? 'individual' : 'company',
      verified: m.status === 'active',
      userId: m.user_id ?? null,
      avatar: m.avatar ?? null,
    }));
  }

  // Mobile API: get current user member info for profile
  async getMyMember(userId: string) {
    let rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE user_id = ${userId}::uuid OR id = ${userId} LIMIT 1
    `.catch(() => []);

    const user = await this.prisma.vione_users.findUnique({
      where: { id: userId },
    }).catch(() => null);

    const userProfiles = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, avatar_url, professional_title, company_name, industry, region
      FROM public.user_profiles
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    const profile = userProfiles[0] || null;

    if (rows.length === 0) {
      const users = await this.prisma.$queryRaw<any[]>`
        SELECT email FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      const candidateEmail = users[0]?.email || user?.email;
      if (candidateEmail) {
        rows = await this.prisma.$queryRaw<any[]>`
          SELECT * FROM public.members WHERE LOWER(email) = LOWER(${candidateEmail}) LIMIT 1
        `.catch(() => []);
      }
    }

    const userPhone = (user as any)?.phone || (user?.username && /^\d+$/.test(user.username) ? user.username : null);
    if (rows.length === 0 && userPhone) {
      const altPhone = userPhone.startsWith('0') ? userPhone.slice(1) : '0' + userPhone;
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.members 
        WHERE phone = ${userPhone} OR phone = ${altPhone}
        LIMIT 1
      `.catch(() => []);
    }

    // Auto link user_id if member matched by email/phone
    if (rows.length > 0 && (!rows[0].user_id || rows[0].user_id !== userId)) {
      await this.prisma.$executeRaw`
        UPDATE public.members SET user_id = ${userId}::uuid WHERE id = ${rows[0].id}
      `.catch(() => {});
    }

    // If new user has no member record yet, auto-create CEO 1983 member with their real name
    if (rows.length === 0 && (user || profile)) {
      const realName = (user?.name || profile?.display_name || user?.username || 'Hội viên CEO 1983').trim();
      const userEmail = user?.email || `${user?.username || userId.slice(0, 8)}@ceo1983.vn`;
      const finalPhone = userPhone || '0983000000';
      const newCode = 'M1983-' + String(Math.floor(100 + Math.random() * 900));
      const company = profile?.company_name || 'CLB Doanh Nhân CEO 1983';
      const title = profile?.professional_title || 'Hội viên chính thức';
      const industry = profile?.industry || 'Kinh doanh & Quản lý';
      const region = profile?.region || 'Hà Nội';

      await this.prisma.$executeRaw`
        INSERT INTO public.members (
          id, code, name, contact, email, phone, type, level, industry, region,
          status, joined_at, fee_year, fee_paid, address, about, payment_status,
          user_id, association_id, created_at, updated_at
        ) VALUES (
          ${userId}::text, ${newCode}, ${realName}, ${realName},
          ${userEmail}, ${finalPhone}, 'individual', 'standard', ${industry}, ${region},
          'active', CURRENT_DATE, 2026, true, ${region}, ${company}, 'paid',
          ${userId}::uuid, 'c1983000-0000-4000-8000-000000001983'::uuid, now(), now()
        ) ON CONFLICT (id) DO UPDATE SET user_id = ${userId}::uuid, name = EXCLUDED.name
      `.catch(() => null);

      rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.members WHERE user_id = ${userId}::uuid OR id = ${userId}::text LIMIT 1
      `.catch(() => []);
    }

    // Resolve unified avatar from vione_users, user_profiles, or business_identities
    const profileAvatars = await this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(up.avatar_url, bi.avatar_url) as avatar
      FROM public.user_profiles up
      LEFT JOIN public.business_identities bi ON bi.owner_user_id = up.user_id
      WHERE up.user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => [] as any[]);
    const unifiedAvatar = user?.avatar_url || profileAvatars[0]?.avatar || profile?.avatar_url || null;

    if (rows.length > 0) {
      const m = rows[0];
      const memberName = (m.name && m.name !== 'Hội viên CEO 1983' && m.name !== 'Thành viên mới' && m.name !== 'Hội viên VIONE')
        ? m.name
        : (user?.name || profile?.display_name || m.name || user?.username || 'Hội viên CEO 1983');

      return {
        id: m.id,
        memberId: m.id,
        member_id: m.id,
        code: m.code ?? '',
        name: memberName,
        status: m.status ?? 'active',
        validUntil: m.term_end ? (m.term_end instanceof Date ? m.term_end.toISOString().slice(0, 10) : String(m.term_end).slice(0, 10)) : null,
        verified: m.status === 'active',
        type: m.type === 'individual' ? 'individual' : 'company',
        title: m.executive_role || m.department || (m.contact && m.contact !== m.name ? m.contact : null) || profile?.professional_title || 'Hội viên chính thức',
        email: m.email ?? user?.email ?? '',
        phone: m.phone ?? userPhone ?? '',
        taxCode: m.tax_code ?? null,
        industry: m.industry ?? profile?.industry ?? '',
        region: m.region ?? profile?.region ?? '',
        address: m.address ?? '',
        website: m.website ?? null,
        joinedAt: m.joined_at ? (m.joined_at instanceof Date ? m.joined_at.toISOString().slice(0, 10) : String(m.joined_at).slice(0, 10)) : null,
        avatar: unifiedAvatar,
        avatarUrl: unifiedAvatar,
        coverUrl: m.cover_url || (user as any)?.cover_url || null,
        cover_url: m.cover_url || (user as any)?.cover_url || null,
      };
    }

    // Fallback: If no member row exists for this user, return non-member identity with real user name
    const fallbackName = user?.name || profile?.display_name || user?.username || 'Thành viên mới';
    return {
      id: null,
      memberId: null,
      member_id: null,
      code: `GUEST-${userId.slice(0, 6).toUpperCase()}`,
      name: fallbackName,
      status: 'guest',
      validUntil: null,
      verified: false,
      type: 'individual',
      title: profile?.professional_title || 'Chưa là hội viên chính thức',
      email: user?.email || '',
      phone: '',
      taxCode: null,
      industry: '',
      region: '',
      address: '',
      website: null,
      joinedAt: null,
      avatar: user?.avatar_url ?? null,
      avatarUrl: user?.avatar_url ?? null,
      coverUrl: (user as any)?.cover_url || null,
      cover_url: (user as any)?.cover_url || null,
    };
  }

  async updateMyCover(userId: string, coverUrl: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Update in public.vione_users
    await this.prisma.$executeRaw`
      UPDATE public.vione_users
      SET cover_url = ${coverUrl}, updated_at = NOW()
      WHERE id = ${userId}::uuid
    `.catch((err) => {
      console.warn('Failed to update cover_url in vione_users:', err);
    });

    // Update in public.members for this user_id
    const memberUpdated = await this.prisma.$executeRaw`
      UPDATE public.members
      SET cover_url = ${coverUrl}, updated_at = NOW()
      WHERE user_id = ${userId}::uuid OR id = ${userId}
    `.catch((err) => {
      console.warn('Failed to update cover_url in members by user_id:', err);
      return 0;
    });

    // Fallback: if member record was matched by email
    if (!memberUpdated || memberUpdated === 0) {
      const user = await this.prisma.vione_users.findUnique({
        where: { id: userId },
      }).catch(() => null);
      if (user?.email) {
        await this.prisma.$executeRaw`
          UPDATE public.members
          SET cover_url = ${coverUrl}, updated_at = NOW()
          WHERE LOWER(email) = LOWER(${user.email})
        `.catch(() => {});
      }
    }

    return {
      success: true,
      coverUrl,
      message: 'Cập nhật ảnh bìa thành công',
    };
  }

  async updateMyProfile(userId: string, data: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    address?: string;
    website?: string;
    bio?: string;
  }) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const { name, title, company, phone, email, avatar, address, website, bio } = data;

    // 1. Update vione_users
    try {
      const userUpdate: any = { updated_at: new Date() };
      if (name) userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      if (avatar) userUpdate.avatar_url = avatar;
      await this.prisma.vione_users.update({
        where: { id: userId },
        data: userUpdate,
      }).catch(() => null);
    } catch {}

    // 2. Update user_profiles
    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.user_profiles (user_id, display_name, professional_title, company_name, avatar_url, updated_at)
        VALUES (${userId}::uuid, ${name || null}, ${title || null}, ${company || null}, ${avatar || null}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          display_name = COALESCE(${name || null}, user_profiles.display_name),
          professional_title = COALESCE(${title || null}, user_profiles.professional_title),
          company_name = COALESCE(${company || null}, user_profiles.company_name),
          avatar_url = COALESCE(${avatar || null}, user_profiles.avatar_url),
          updated_at = NOW()
      `.catch(() => null);
    } catch {}

    // 3. Update members table
    try {
      await this.prisma.$executeRaw`
        UPDATE public.members
        SET
          name = COALESCE(${name || null}, name),
          contact = COALESCE(${name || null}, contact),
          executive_role = COALESCE(${title || null}, executive_role),
          about = COALESCE(${bio || company || null}, about),
          phone = COALESCE(${phone || null}, phone),
          email = COALESCE(${email || null}, email),
          address = COALESCE(${address || null}, address),
          website = COALESCE(${website || null}, website),
          avatar_url = COALESCE(${avatar || null}, avatar_url),
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid OR id = ${userId}
      `.catch(() => null);
    } catch {}

    // 4. Also sync primary business card if exists
    try {
      await this.prisma.$executeRaw`
        UPDATE public.member_business_cards
        SET
          display_name = COALESCE(${name || null}, display_name),
          professional_title = COALESCE(${title || null}, professional_title),
          company_name = COALESCE(${company || null}, company_name),
          avatar_url = COALESCE(${avatar || null}, avatar_url),
          work_phone = COALESCE(${phone || null}, work_phone),
          work_email = COALESCE(${email || null}, work_email),
          address = COALESCE(${address || null}, address),
          website = COALESCE(${website || null}, website),
          bio = COALESCE(${bio || null}, bio),
          updated_at = NOW()
        WHERE user_id = ${userId}::uuid
      `.catch(() => null);
    } catch {}

    return this.getMyMember(userId);
  }

  async getAccountStatuses() {
    const profiles = await this.prisma.user_profiles.findMany({
      select: { user_id: true, account_status: true },
    }).catch(() => [] as any[]);

    const map: Record<string, string> = {};
    for (const p of profiles) {
      map[p.user_id] = p.account_status;
    }
    return map;
  }

  async getMemberById(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id::text = ${id} OR code = ${id} LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      throw new NotFoundException('Không tìm thấy hội viên');
    }

    return this.mapMemberRow(rows[0]);
  }

  async getMemberHistory(userId: string, id: string) {
    const member = await this.getMemberById(userId, id);

    // 1. Activities from activity_log
    const actRows = await this.prisma.$queryRaw<any[]>`
      SELECT code, "user", action, target, category, at, created_at 
      FROM public.activity_log 
      WHERE target = ${member.code} OR target = ${member.name}
      ORDER BY created_at DESC 
      LIMIT 50
    `.catch(() => []);

    const activities = actRows.map((r) => {
      const c = (r.category ?? '').toLowerCase();
      const a = (r.action ?? '').toLowerCase();
      let type = 'note';
      if (c === 'fee' || a.includes('thanh toán') || a.includes('payment')) type = 'payment';
      else if (c === 'event' || a.includes('sự kiện') || a.includes('event')) type = 'event';
      else if (a.includes('email') || a.includes('bản tin')) type = 'email';
      else if (a.includes('gọi') || a.includes('call')) type = 'call';
      else if (a.includes('họp') || a.includes('meeting')) type = 'meeting';

      return {
        id: r.code,
        type,
        title: r.action,
        by: r.user ?? '—',
        detail: r.target ?? undefined,
        date: r.created_at ? (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)) : new Date().toISOString(),
      };
    });

    // 2. Events from event_registrations + events
    let events: any[] = [];
    if (member.code) {
      const regRows = await this.prisma.$queryRaw<any[]>`
        SELECT r.id, r.event_id, r.registered_at, r.status, r.ticket_type,
               e.name as event_name, e.date as event_date, e.registered as event_registered
        FROM public.event_registrations r
        LEFT JOIN public.events e ON r.event_id = e.id
        WHERE r.member_code = ${member.code}
           OR (r.email IS NOT NULL AND r.email != '' AND r.email = ${member.email})
           OR (r.member_name IS NOT NULL AND r.member_name = ${member.name})
        ORDER BY r.registered_at DESC
        LIMIT 50
      `.catch(() => []);

      events = regRows.map((r) => {
        let role = 'attendee';
        const t = (r.ticket_type ?? '').toLowerCase();
        if (t === 'sponsor') role = 'sponsor';
        else if (t === 'speaker') role = 'speaker';
        else if (t === 'partner') role = 'partner';

        const d = r.event_date || r.registered_at;
        const dateStr = d instanceof Date ? d.toISOString() : (d ? String(d) : new Date().toISOString());

        return {
          id: r.id,
          name: r.event_name || r.event_id || '—',
          date: dateStr,
          role,
          checkedIn: r.status === 'checked-in' || r.status === 'attended',
          attendees: Number(r.event_registered ?? 0),
        };
      });
    }

    // 3. Payments from invoices
    const invRows = await this.prisma.$queryRaw<any[]>`
      SELECT invoice_no, year, amount, due_date, paid_at, status, method 
      FROM public.invoices 
      WHERE member_id = ${member.id}
      ORDER BY created_at DESC 
      LIMIT 50
    `.catch(() => []);

    const payments = invRows.map((i, idx) => {
      let m = (i.method ?? '').toLowerCase();
      let method = 'bank';
      if (m === 'card') method = 'card';
      else if (m === 'cash') method = 'cash';
      else if (m === 'evoucher') method = 'evoucher';

      let s = (i.status ?? '').toLowerCase();
      let status = 'pending';
      if (s === 'paid') status = 'paid';
      else if (s === 'refunded') status = 'refunded';

      const d = i.paid_at || i.due_date;
      const dateStr = d instanceof Date ? d.toISOString() : (d ? String(d) : new Date().toISOString());

      return {
        id: i.invoice_no ?? `inv-${idx}`,
        invoice: i.invoice_no ?? '—',
        date: dateStr,
        kind: 'fee',
        description: `Hội phí ${i.year ?? ''}`.trim(),
        amount: Number(i.amount ?? 0),
        method,
        status,
      };
    });

    return {
      activities,
      events,
      payments,
    };
  }

  async getMyMemberHistory(userId: string) {
    const memRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    if (memRows.length === 0) {
      return { activities: [], events: [], payments: [] };
    }
    return this.getMemberHistory(userId, memRows[0].id);
  }

  async createMember(userId: string, data: CreateMemberDto) {
    const assocId = await this.getAssociationIdForUser(userId, data.associationId);
    const isAdmin = await this.checkIsAdmin(userId, assocId ?? undefined);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền thêm hội viên');
    }

    const now = new Date();
    const id = `MB${now.getTime().toString(36).toUpperCase()}`;
    const feeYear = now.getFullYear();
    const joinedAt = now.toISOString().slice(0, 10);

    // Insert into public.members. The DB trigger trg_set_member_code will automatically
    // assign the sequential code (e.g. HV-00000x or PREFIX-00000x) if code is empty!
    await this.prisma.$executeRaw`
      INSERT INTO public.members (
        id, code, name, contact, email, phone, type, level, industry, region, status,
        joined_at, fee_year, fee_paid, address, website, tax_code, employees, about,
        association_id, created_at, updated_at
      ) VALUES (
        ${id},
        '',
        ${data.name},
        ${data.contact ?? ''},
        ${data.email ?? ''},
        ${data.phone ?? ''},
        ${data.type ?? 'company'},
        ${data.level ?? 'memberLevel.medium'},
        ${data.industry ?? 'ind.trade'},
        ${data.region ?? 'region.north'},
        ${data.status ?? 'pending'},
        ${joinedAt}::date,
        ${feeYear},
        false,
        ${data.address ?? ''},
        ${data.website ?? null},
        ${data.taxCode ?? null},
        ${data.employees ?? null},
        ${data.about ?? ''},
        ${assocId}::uuid,
        now(),
        now()
      )
    `;

    // Activity log
    await this.prisma.$executeRaw`
      INSERT INTO public.activity_log (
        id, code, "user", action, target, category, at, ip, association_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${id},
        ${userId},
        'Thêm hội viên',
        ${data.name},
        'member',
        to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        '127.0.0.1',
        ${assocId}::uuid,
        now(),
        now()
      )
    `.catch(() => null);

    return this.getMemberById(userId, id);
  }

  async updateMember(userId: string, id: string, data: UpdateMemberDto) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy hội viên');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền cập nhật hội viên');
    }

    const name = data.name !== undefined ? data.name : current.name;
    const contact = data.contact !== undefined ? data.contact : current.contact;
    const email = data.email !== undefined ? data.email : current.email;
    const phone = data.phone !== undefined ? data.phone : current.phone;
    const type = data.type !== undefined ? data.type : current.type;
    const level = data.level !== undefined ? data.level : current.level;
    const industry = data.industry !== undefined ? data.industry : current.industry;
    const region = data.region !== undefined ? data.region : current.region;
    const status = data.status !== undefined ? data.status : current.status;
    const address = data.address !== undefined ? data.address : current.address;
    const website = data.website !== undefined ? data.website : current.website;
    const taxCode = data.taxCode !== undefined ? data.taxCode : current.tax_code;
    const employees = data.employees !== undefined ? data.employees : current.employees;
    const about = data.about !== undefined ? data.about : current.about;
    const feePaid = data.feePaid !== undefined ? data.feePaid : current.fee_paid;
    const feeYear = data.feeYear !== undefined ? data.feeYear : current.fee_year;

    await this.prisma.$executeRaw`
      UPDATE public.members SET
        name = ${name},
        contact = ${contact},
        email = ${email},
        phone = ${phone},
        type = ${type},
        level = ${level},
        industry = ${industry},
        region = ${region},
        status = ${status},
        address = ${address},
        website = ${website},
        tax_code = ${taxCode},
        employees = ${employees},
        about = ${about},
        fee_paid = ${feePaid},
        fee_year = ${feeYear},
        updated_at = now()
      WHERE id = ${id}
    `;

    // Activity log
    await this.logActivity(
      'Cập nhật thông tin hội viên',
      `${name} (${current.code || id})`,
      'member',
      'admin@connect.vn',
      current.association_id,
    );

    // If status was changed (e.g. pending -> active), dispatch in-app notification to the applicant/member
    if (data.status !== undefined && data.status !== current.status) {
      try {
        let memberUserId = current.user_id;
        if (!memberUserId && (email || current.email)) {
          const u = await this.prisma.vione_users.findFirst({
            where: { email: email || current.email },
            select: { id: true },
          }).catch(() => null);
          if (u) memberUserId = u.id;
        }
        if (!memberUserId && (phone || current.phone)) {
          const rawPhone = phone || current.phone;
          const cleanPhone = String(rawPhone).replace(/\D/g, '');
          const u = await this.prisma.$queryRaw<any[]>`
            SELECT id FROM public.vione_users WHERE phone = ${rawPhone} OR phone = ${cleanPhone} LIMIT 1
          `.catch(() => []);
          if (u.length > 0) memberUserId = u[0].id;
        }

        // Tự động khởi tạo tài khoản đăng nhập khi duyệt hội viên nếu chưa có (BUG-AUTH-001)
        const isApproved = status === 'active' || status === 'approved';
        if (!memberUserId && isApproved && (email || current.email || phone || current.phone)) {
          try {
            const newUserId = crypto.randomUUID();
            const memberEmail = email || current.email || `${(current.member_code || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}@ceo1983.com`;
            const memberPhone = phone || current.phone || '';
            const memberName = name || current.name || 'Hội viên CEO 1983';
            await this.prisma.$executeRaw`
              INSERT INTO public.vione_users (id, email, phone, name, role, status, created_at, updated_at)
              VALUES (${newUserId}::uuid, ${memberEmail}, ${memberPhone}, ${memberName}, 'member', 'active', now(), now())
              ON CONFLICT (email) DO NOTHING
            `.catch(() => null);

            const linkedUser = await this.prisma.vione_users.findFirst({
              where: { email: memberEmail },
              select: { id: true },
            }).catch(() => null);

            if (linkedUser) {
              memberUserId = linkedUser.id;
              await this.prisma.$executeRaw`
                UPDATE public.members SET user_id = ${memberUserId}::uuid WHERE id = ${id}::uuid
              `.catch(() => null);
            }
          } catch (createErr) {
            console.warn('Auto create user on member approval notice:', createErr);
          }
        }

        if (memberUserId) {
          const notifId = crypto.randomUUID();
          const notifTitle = isApproved
            ? '🎉 Chúc mừng! Hồ sơ gia nhập CLB của bạn đã được phê duyệt!'
            : status === 'pending'
            ? 'Hồ sơ gia nhập CLB của bạn đang được xét duyệt'
            : 'Thông báo kết quả duyệt hồ sơ gia nhập CLB';
          const notifBody = isApproved
            ? `Chúc mừng bạn đã chính thức trở thành hội viên của ${name || 'Hiệp hội'}. Thẻ VIP Số NFC và toàn bộ quyền lợi đã được kích hoạt trong App Hội Viên.`
            : `Hồ sơ gia nhập của bạn đã được cập nhật trạng thái: ${status}. Vui lòng mở App Hội Viên hoặc liên hệ Ban thư ký để biết thêm chi tiết.`;

          const safeData = JSON.stringify({
            title: notifTitle,
            body: notifBody,
            status,
            targetRoute: '/m',
          });

          await this.prisma.$executeRaw`
            INSERT INTO public.business_notifications (
              id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
              title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
              priority, status, app_scope, target_app, created_at, updated_at, dedupe_key
            ) VALUES (
              ${notifId}::uuid, ${memberUserId}::uuid, 'association', ${id},
              'member_approval', ${isApproved ? 'member_approved' : 'member_status_changed'},
              ${notifTitle}, ${notifBody},
              ${safeData}::jsonb, 'navigate', 'Mở App Hội Viên', '{"route": "/m"}'::jsonb,
              'high', 'delivered', 'all', 'all', now(), now(), ${`member_approval:${id}:${status}:${Date.now()}`}
            )
          `.catch((err) => console.warn('Could not insert member approval notification:', err));

          await this.prisma.$executeRaw`
            INSERT INTO public.member_notifications (
              id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
            ) VALUES (
              gen_random_uuid(), ${id}, ${notifTitle}, ${notifBody}, false, false, 'member_approval', ${id}, now()
            )
          `.catch(() => {});

          // Đẩy thông báo chuông vào App Hiệp Hội
          await this.prisma.$executeRaw`
            INSERT INTO public.notifications (
              id, user_id, title, message, type, is_read, created_at
            ) VALUES (
              gen_random_uuid(), ${memberUserId || id}, ${notifTitle}, ${notifBody}, 'member_approval', false, now()
            )
          `.catch(() => {});
        }

        // Gửi email thông báo phê duyệt hồ sơ chính thức vào email hội viên
        if (isApproved && this.mailService) {
          const memberEmail = (email || current.email || '').trim();
          if (memberEmail && memberEmail.includes('@')) {
            const passMatch = (current.about || '').match(/Pass=([^\s|]+)/);
            const rawPass = passMatch ? passMatch[1] : undefined;

            void this.mailService.sendMemberApprovedEmail({
              to: memberEmail,
              fullName: name || current.name || current.contact || 'Quý Hội viên',
              memberCode: current.code || id,
              associationName: 'CLB Doanh Nhân CEO 1983',
              companyName: current.company || current.organization || name,
              portalUrl: 'https://14.225.217.232:5444/association/login',
              username: memberEmail,
              passwordRaw: rawPass,
            }).catch((err) => console.warn('Could not send member approval email:', err?.message));
          }
        }
      } catch (err) {
        console.warn('Error sending member status notification:', err);
      }
    }

    return this.getMemberById(userId, id);
  }

  async updateMemberContact(userId: string, id: string, data: UpdateMemberContactDto) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy hội viên');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền cập nhật hội viên');
    }

    const email = data.email !== undefined ? data.email : current.email;
    const phone = data.phone !== undefined ? data.phone : current.phone;
    const address = data.address !== undefined ? data.address : current.address;

    await this.prisma.$executeRaw`
      UPDATE public.members SET
        email = ${email},
        phone = ${phone},
        address = ${address},
        updated_at = now()
      WHERE id = ${id}
    `;

    return this.getMemberById(userId, id);
  }

  async deleteMember(userId: string, id: string) {
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id = ${id} LIMIT 1
    `.catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy hội viên');
    }

    const current = existing[0];
    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền xóa hội viên');
    }

    await this.prisma.$executeRaw`
      DELETE FROM public.members WHERE id = ${id}
    `;

    return { ok: true };
  }

  async renewMember(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id = ${id} OR code = ${id} LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) throw new NotFoundException('Không tìm thấy hội viên');
    const current = rows[0];

    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) throw new ForbiddenException('Chỉ quản trị viên mới có quyền gia hạn');

    const base = current.term_end ? new Date(current.term_end as string) : new Date();
    const newEnd = new Date(base);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    const newEndStr = newEnd.toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    await this.prisma.$executeRaw`
      UPDATE public.members SET
        fee_paid   = true,
        renewed_at = ${today},
        term_end   = ${newEndStr}::date,
        new_term_end = ${newEndStr},
        payment_status = 'paid',
        updated_at = now()
      WHERE id = ${current.id}
    `;

    // Activity log
    await this.logActivity('Gia hạn hội phí', `${current.name} (${current.code || id})`, 'fee', 'admin@connect.vn', current.association_id);

    // Dispatch 2-way notification
    if (current.user_id) {
      try {
        const notifTitle = '🎉 Gia hạn hội viên thành công';
        const notifBody = `Hồ sơ hội viên ${current.name} đã được gia hạn thành công. Nhiệm kỳ mới có hiệu lực đến ngày ${newEndStr}.`;
        const notifId = crypto.randomUUID();
        const dedupeKey = `renew-${current.id}-${Date.now()}`;
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          termEnd: newEndStr,
          targetRoute: '/m/card',
        });

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            $1::uuid, $2::uuid, 'membership', $3, 'membership_renewed', 'renewal_success',
            $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
          )
        `, notifId, current.user_id, current.id, notifTitle, notifBody, safeData, dedupeKey).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'renewal', $4, NOW()
          )
        `, current.id, notifTitle, notifBody, current.id).catch(() => {});
      } catch (e: any) {
        console.warn('Failed to notify member of renewal:', e?.message);
      }
    }

    return this.getMemberById(userId, current.id);
  }

  async sendRenewalReminder(userId: string, id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.members WHERE id = ${id} OR code = ${id} LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) throw new NotFoundException('Không tìm thấy hội viên');
    const current = rows[0];

    const isAdmin = await this.checkIsAdmin(userId, current.association_id);
    if (!isAdmin) throw new ForbiddenException('Chỉ quản trị viên mới có quyền gửi nhắc nhở');

    const today = new Date().toISOString().slice(0, 10);
    const newCount = ((current.reminder_count as number) ?? 0) + 1;

    await this.prisma.$executeRaw`
      UPDATE public.members SET
        reminder_count = ${newCount},
        last_reminder  = ${today},
        updated_at     = now()
      WHERE id = ${current.id}
    `;

    // Dispatch 2-way notification
    if (current.user_id) {
      try {
        const notifTitle = 'Nhắc nhở gia hạn tư cách hội viên';
        const notifBody = `Hội viên ${current.name} thân mến, thời hạn hội viên của bạn sắp kết thúc (${current.term_end ? new Date(current.term_end).toISOString().slice(0, 10) : 'hôm nay'}). Vui lòng hoàn thành gia hạn hội phí để duy trì mọi quyền lợi kết nối và ưu đãi.`;
        const notifId = crypto.randomUUID();
        const dedupeKey = `renew-remind-${current.id}-${Date.now()}`;
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          termEnd: current.term_end,
          targetRoute: '/fees',
        });

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            $1::uuid, $2::uuid, 'membership', $3, 'renewal_reminder', 'fee_reminder',
            $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
          )
        `, notifId, current.user_id, current.id, notifTitle, notifBody, safeData, dedupeKey).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'renewal_reminder', $4, NOW()
          )
        `, current.id, notifTitle, notifBody, current.id).catch(() => {});
      } catch (e: any) {
        console.warn('Failed to send renewal reminder notification:', e?.message);
      }
    }

    return this.getMemberById(userId, id);
  }

  async getActiveAssociationId(userId: string): Promise<string | null> {
    return this.getAssociationIdForUser(userId);
  }

  async getMyAssociationBrand(userId: string) {
    const associationId = await this.getAssociationIdForUser(userId);
    if (!associationId) return null;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT name, logo_url, brand_primary, tagline, about FROM public.associations
      WHERE id = ${associationId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) return null;
    const a = rows[0];
    return {
      name: a.name ?? '',
      logoUrl: a.logo_url ?? null,
      brandPrimary: a.brand_primary ?? null,
      tagline: a.tagline ?? null,
      about: a.about ?? null,
    };
  }

  async getMyBenefits(userId: string) {
    const associationId = await this.getAssociationIdForUser(userId);
    const defaultBenefits = [
      {
        titleVi: 'Tham dự sự kiện',
        titleEn: 'Event access',
        descVi: 'miễn phí & ưu đãi',
        descEn: 'free & discounted',
      },
      {
        titleVi: 'Kết nối hơn',
        titleEn: 'Networking',
        descVi: '1000+ doanh nghiệp',
        descEn: '1000+ businesses',
      },
      {
        titleVi: 'Quảng bá thương hiệu',
        titleEn: 'Brand promotion',
        descVi: 'trên kênh Hiệp hội',
        descEn: 'on association channels',
      },
    ];

    if (!associationId) return defaultBenefits;

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT title_vi, title_en, desc_vi, desc_en FROM public.association_benefits
      WHERE association_id = ${associationId}::uuid
      ORDER BY sort_order ASC
    `.catch(() => []);

    if (rows.length === 0) return defaultBenefits;
    return rows.map((r) => ({
      titleVi: r.title_vi ?? '',
      titleEn: r.title_en ?? '',
      descVi: r.desc_vi ?? '',
      descEn: r.desc_en ?? '',
    }));
  }

  async listAllBenefits(userId: string) {
    const associationId = await this.getAssociationIdForUser(userId);
    let rows: any[] = [];
    if (associationId) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT id, title_vi, title_en, desc_vi, desc_en, sort_order, association_id, created_at, updated_at
        FROM public.association_benefits
        WHERE association_id = ${associationId}::uuid
        ORDER BY sort_order ASC, created_at ASC
      `.catch(() => []);
    }
    if (rows.length === 0) {
      rows = await this.prisma.$queryRaw<any[]>`
        SELECT id, title_vi, title_en, desc_vi, desc_en, sort_order, association_id, created_at, updated_at
        FROM public.association_benefits
        ORDER BY sort_order ASC, created_at ASC
      `.catch(() => []);
    }

    return rows.map((r) => ({
      id: r.id,
      titleVi: r.title_vi ?? '',
      titleEn: r.title_en ?? '',
      descVi: r.desc_vi ?? '',
      descEn: r.desc_en ?? '',
      sortOrder: Number(r.sort_order ?? 0),
    }));
  }

  async createBenefit(userId: string, dto: any) {
    const associationId = await this.getAssociationIdForUser(userId);
    const id = crypto.randomUUID();
    const titleVi = dto.titleVi || dto.title_vi || '';
    const titleEn = dto.titleEn || dto.title_en || '';
    const descVi = dto.descVi || dto.desc_vi || '';
    const descEn = dto.descEn || dto.desc_en || '';
    const sortOrder = Number(dto.sortOrder ?? dto.sort_order ?? 0);

    await this.prisma.$executeRaw`
      INSERT INTO public.association_benefits (
        id, association_id, title_vi, title_en, desc_vi, desc_en, sort_order, created_at, updated_at
      ) VALUES (
        ${id}::uuid, ${associationId}::uuid, ${titleVi}, ${titleEn}, ${descVi}, ${descEn}, ${sortOrder}, NOW(), NOW()
      )
    `;

    return {
      id,
      titleVi,
      titleEn,
      descVi,
      descEn,
      sortOrder,
    };
  }

  async updateBenefit(userId: string, id: string, dto: any) {
    const titleVi = dto.titleVi || dto.title_vi || '';
    const titleEn = dto.titleEn || dto.title_en || '';
    const descVi = dto.descVi || dto.desc_vi || '';
    const descEn = dto.descEn || dto.desc_en || '';
    const sortOrder = Number(dto.sortOrder ?? dto.sort_order ?? 0);

    await this.prisma.$executeRaw`
      UPDATE public.association_benefits
      SET title_vi = ${titleVi},
          title_en = ${titleEn},
          desc_vi = ${descVi},
          desc_en = ${descEn},
          sort_order = ${sortOrder},
          updated_at = NOW()
      WHERE id = ${id}::uuid
    `;

    return {
      id,
      titleVi,
      titleEn,
      descVi,
      descEn,
      sortOrder,
    };
  }

  async deleteBenefit(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.association_benefits WHERE id = ${id}::uuid
    `;
    return { success: true };
  }

  async getMyMemberContext(userId: string) {
    const [memRows, profileRows, assocId] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT id, code, name, email, avatar, status, association_id
        FROM public.members
        WHERE user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => []),
      this.prisma.$queryRaw<any[]>`
        SELECT display_name, avatar_url, locale FROM public.user_profiles
        WHERE user_id = ${userId}::uuid
        LIMIT 1
      `.catch(() => []),
      this.getAssociationIdForUser(userId),
    ]);

    let m = memRows[0];
    if (!m) {
      const users = await this.prisma.$queryRaw<any[]>`
        SELECT email FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      if (users.length > 0 && users[0].email) {
        const byEmail = await this.prisma.$queryRaw<any[]>`
          SELECT id, code, name, email, avatar, status, association_id FROM public.members WHERE LOWER(email) = LOWER(${users[0].email}) LIMIT 1
        `.catch(() => []);
        if (byEmail.length > 0) m = byEmail[0];
      }
    }

    const p = profileRows[0];
    const memberCode = m?.code ?? null;
    const rawStatus = String(m?.status ?? '').toLowerCase();
    const membershipStatus = ['active', 'pending', 'suspended', 'expired'].includes(rawStatus)
      ? rawStatus
      : 'unknown';
    const canAct = Boolean(memberCode) && membershipStatus === 'active';

    return {
      id: m?.id ?? null,
      memberId: m?.id ?? null,
      member_id: m?.id ?? null,
      memberCode,
      associationId: assocId ?? m?.association_id ?? null,
      displayName: m?.name || p?.display_name || m?.email || '',
      email: m?.email || '',
      avatarUrl: m?.avatar || p?.avatar_url || null,
      membershipStatus,
      canAct,
      locale: p?.locale || 'vi',
    };
  }

  async logActivity(action: string, target: string, category: string, userEmail: string = 'admin@connect.vn', assocId?: string) {
    try {
      const now = new Date();
      const at = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
      const code = `L-${Date.now().toString(36).toUpperCase()}`;
      const effectiveAssoc = assocId || 'c1983000-0000-4000-8000-000000001983';
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.activity_log (id, code, "user", action, target, category, at, ip, created_at, updated_at, association_id)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, '127.0.0.1', now(), now(), $7::uuid)
      `, code, userEmail, action, target, category, at, effectiveAssoc);
    } catch (e: any) {
      console.warn('logActivity error:', e?.message);
    }
  }

  async getMyMembership(userId: string) {
    const memRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, code, name, level, status, joined_at, fee_year, fee_paid, term_end, renewed_at, new_term_end
      FROM public.members
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (memRows.length === 0) {
      return {
        found: false,
        code: '',
        name: '',
        level: null,
        status: null,
        joinedAt: null,
        termEnd: null,
        newTermEnd: null,
        renewedAt: null,
        feeYear: null,
        feePaid: false,
        daysToExpiry: null,
        outstandingAmount: 0,
        invoices: [],
      };
    }

    const me = memRows[0];
    const invRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, invoice_no, year, amount, status, due_date, paid_at
      FROM public.invoices
      WHERE member_id = ${me.id}
      ORDER BY year DESC, created_at DESC
      LIMIT 50
    `.catch(() => []);

    const today = new Date();
    const invoices = invRows.map((i, idx) => {
      const raw = (i.status as string) ?? '';
      const due = i.due_date ? new Date(i.due_date).toISOString().slice(0, 10) : null;
      let status: 'paid' | 'pending' | 'overdue' = raw === 'paid' ? 'paid' : 'pending';
      if (status === 'pending' && due && new Date(due) < today) status = 'overdue';

      return {
        id: i.id ?? `inv-${idx}`,
        invoice: i.invoice_no ?? `INV-${idx}`,
        year: i.year ? Number(i.year) : null,
        amount: Number(i.amount ?? 0),
        status,
        dueDate: due,
        paidAt: i.paid_at ? new Date(i.paid_at).toISOString().slice(0, 10) : null,
      };
    });

    const pending = invoices.filter((i) => i.status !== 'paid');
    const outstandingAmount = pending.reduce((s, i) => s + i.amount, 0);

    const effectiveEnd = me.new_term_end || me.term_end;
    const daysToExpiry = effectiveEnd
      ? Math.ceil((new Date(effectiveEnd).getTime() - Date.now()) / 86400000)
      : null;

    return {
      found: true,
      code: me.code ?? '',
      name: me.name ?? '',
      level: me.level ?? null,
      status: me.status ?? null,
      joinedAt: me.joined_at ? new Date(me.joined_at).toISOString().slice(0, 10) : null,
      termEnd: me.term_end ? new Date(me.term_end).toISOString().slice(0, 10) : null,
      newTermEnd: me.new_term_end ? new Date(me.new_term_end).toISOString().slice(0, 10) : null,
      renewedAt: me.renewed_at ? new Date(me.renewed_at).toISOString().slice(0, 10) : null,
      feeYear: me.fee_year ? Number(me.fee_year) : null,
      feePaid: Boolean(me.fee_paid),
      daysToExpiry,
      outstandingAmount,
      invoices,
    };
  }

  async getMyRenewalHistory(userId: string) {
    const memRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    if (memRows.length === 0) return [];

    const invRows = await this.prisma.$queryRaw<any[]>`
      SELECT invoice_no, year, amount, status, due_date, paid_at, method
      FROM public.invoices
      WHERE member_id = ${memRows[0].id}
      ORDER BY year DESC, paid_at DESC
      LIMIT 50
    `.catch(() => []);

    const today = new Date();
    return invRows.map((i, idx) => {
      const raw = (i.status as string) ?? '';
      const due = i.due_date ? new Date(i.due_date).toISOString().slice(0, 10) : null;
      let status: 'paid' | 'pending' | 'overdue' = raw === 'paid' ? 'paid' : 'pending';
      if (status === 'pending' && due && new Date(due) < today) status = 'overdue';
      const year = i.year ? Number(i.year) : null;

      return {
        id: i.invoice_no ?? `inv-${idx}`,
        invoice: i.invoice_no ?? '—',
        year,
        amount: Number(i.amount ?? 0),
        method: i.method ?? null,
        status,
        paidAt: i.paid_at ? new Date(i.paid_at).toISOString().slice(0, 10) : null,
        dueDate: due,
        termStart: year ? `${year}-01-01` : null,
        termEnd: year ? `${year}-12-31` : null,
        note: i.method ?? null,
      };
    });
  }

  async getRenewalQuote(userId: string) {
    const memRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, code, term_end, new_term_end, fee_year
      FROM public.members
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (memRows.length === 0) {
      return {
        found: false,
        code: '',
        amount: 0,
        outstanding: 0,
        renewalFee: 0,
        currentTermEnd: null,
        nextTermEnd: null,
        pendingInvoices: [],
      };
    }

    const me = memRows[0];
    const invRows = await this.prisma.$queryRaw<any[]>`
      SELECT id, invoice_no, amount, status, due_date, paid_at, year
      FROM public.invoices
      WHERE member_id = ${me.id}
      ORDER BY year DESC
      LIMIT 50
    `.catch(() => []);

    const pending = invRows.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
    const outstanding = pending.reduce((s, i) => s + Number(i.amount ?? 0), 0);
    const lastAmount = Number(invRows[0]?.amount ?? 0);
    const renewalFee = lastAmount > 0 ? lastAmount : 2_000_000;
    const currentTermEnd = me.new_term_end ? new Date(me.new_term_end).toISOString().slice(0, 10) : (me.term_end ? new Date(me.term_end).toISOString().slice(0, 10) : null);

    const fromDate = currentTermEnd && new Date(currentTermEnd).getTime() > Date.now()
      ? new Date(currentTermEnd)
      : new Date();
    fromDate.setFullYear(fromDate.getFullYear() + 1);
    const nextTermEnd = fromDate.toISOString().slice(0, 10);

    const amount = outstanding > 0 ? outstanding : renewalFee;
    return {
      found: true,
      code: me.code ?? '',
      amount,
      outstanding,
      renewalFee,
      currentTermEnd,
      nextTermEnd,
      pendingInvoices: pending.map((i) => i.invoice_no),
    };
  }

  async payMyRenewal(userId: string, body: { method: string; correlationId?: string }) {
    const quote = await this.getRenewalQuote(userId);
    if (!quote.found) throw new NotFoundException('Không tìm thấy hội viên');

    const nextEnd = quote.nextTermEnd;
    const ref = body.correlationId || `RNW-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.$executeRaw`
      UPDATE public.members
      SET new_term_end = ${nextEnd}::date, renewed_at = now(), fee_paid = true, updated_at = now()
      WHERE user_id = ${userId}::uuid
    `.catch(() => null);

    return {
      success: true,
      reference: ref,
      amountPaid: quote.amount,
      method: body.method,
      newTermEnd: nextEnd,
    };
  }

  async getMyRenewalAuditLog(userId: string) {
    const memRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.members WHERE user_id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    if (memRows.length === 0) return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, action, event_type, status, error_reason, correlation_id, created_at, metadata
      FROM public.renewal_audit_log
      WHERE member_id = ${memRows[0].id}
      ORDER BY created_at DESC
      LIMIT 50
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      action: r.action || 'renewal',
      eventType: r.event_type || 'payment',
      status: r.status || 'success',
      errorReason: r.error_reason || null,
      correlationId: r.correlation_id || null,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      metadata: r.metadata || {},
    }));
  }

  async listLinkableMembers(userId: string) {
    const user = await this.prisma.vione_users.findUnique({ where: { id: userId } });
    if (!user || !user.email) return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT m.id, m.code, m.name, m.email, m.association_id, a.name as association_name,
             (m.user_id = ${userId}::uuid) as already_linked
      FROM public.members m
      LEFT JOIN public.associations a ON m.association_id = a.id
      WHERE LOWER(m.email) = LOWER(${user.email})
      ORDER BY m.created_at DESC
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      code: r.code ?? '',
      name: r.name,
      email: r.email,
      associationId: r.association_id ?? '',
      associationName: r.association_name ?? '',
      alreadyLinked: Boolean(r.already_linked),
    }));
  }

  async linkMyMemberProfile(userId: string, memberId: string) {
    const user = await this.prisma.vione_users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const member = await this.prisma.members.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Không tìm thấy hồ sơ hội viên');
    if (member.email?.toLowerCase() !== user.email?.toLowerCase()) {
      throw new BadRequestException('Email tài khoản không khớp với email hồ sơ hội viên');
    }

    await this.prisma.members.update({
      where: { id: memberId },
      data: { user_id: userId },
    });
    return { memberId };
  }

  async unlinkMyMemberProfile(userId: string, memberId: string) {
    const member = await this.prisma.members.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Không tìm thấy hồ sơ hội viên');
    if (member.user_id !== userId) {
      throw new ForbiddenException('Bạn không sở hữu liên kết này');
    }

    await this.prisma.members.update({
      where: { id: memberId },
      data: { user_id: null },
    });
    return { success: true };
  }

  async updateMemberRoleDept(
    memberId: string,
    data: { executiveRole: string; department: string; associationId?: string },
  ) {
    const member = await this.prisma.members.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Không tìm thấy hồ sơ hội viên');

    const assocId = data.associationId || member.association_id || 'c1983000-0000-4000-8000-000000001983';

    // 1. Update members table
    await this.prisma.$executeRawUnsafe(`
      UPDATE public.members
      SET executive_role = $1, department = $2, association_id = $3::uuid, updated_at = NOW()
      WHERE id = $4
    `, data.executiveRole, data.department, assocId, memberId);

    // 2. If member has linked user_id, update memberships and user_roles
    const userId = member.user_id;
    if (userId) {
      let membershipRole = 'member';
      if (data.executiveRole === 'platform_admin' || data.executiveRole === 'admin') {
        membershipRole = 'admin';
      } else if (data.executiveRole.startsWith('truong_ban_') || data.executiveRole === 'tong_thu_ky') {
        membershipRole = 'moderator';
      }

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.memberships (
          id, user_id, association_id, role, executive_role, department, status, joined_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5, 'active', NOW(), NOW(), NOW()
        )
        ON CONFLICT (user_id, association_id) DO UPDATE
        SET role = EXCLUDED.role,
            executive_role = EXCLUDED.executive_role,
            department = EXCLUDED.department,
            updated_at = NOW()
      `, userId, assocId, membershipRole, data.executiveRole, data.department);

      // Manage user_roles table
      if (data.executiveRole === 'platform_admin') {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.user_roles (id, user_id, role)
          VALUES (gen_random_uuid(), $1::uuid, 'platform_admin')
          ON CONFLICT DO NOTHING
        `, userId).catch(() => {});
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.user_roles (id, user_id, role)
          VALUES (gen_random_uuid(), $1::uuid, 'admin')
          ON CONFLICT DO NOTHING
        `, userId).catch(() => {});
      } else if (data.executiveRole === 'admin') {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.user_roles (id, user_id, role)
          VALUES (gen_random_uuid(), $1::uuid, 'admin')
          ON CONFLICT DO NOTHING
        `, userId).catch(() => {});
        if (userId !== '00000000-0000-0000-0000-000000000000') {
          await this.prisma.$executeRawUnsafe(`
            DELETE FROM public.user_roles WHERE user_id = $1::uuid AND role = 'platform_admin'
          `, userId).catch(() => {});
        }
      } else if (data.executiveRole.startsWith('truong_ban_') || data.executiveRole === 'tong_thu_ky') {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.user_roles (id, user_id, role)
          VALUES (gen_random_uuid(), $1::uuid, 'moderator')
          ON CONFLICT DO NOTHING
        `, userId).catch(() => {});
        if (userId !== '00000000-0000-0000-0000-000000000000') {
          await this.prisma.$executeRawUnsafe(`
            DELETE FROM public.user_roles WHERE user_id = $1::uuid AND role IN ('platform_admin', 'admin')
          `, userId).catch(() => {});
        }
      } else if (data.executiveRole === 'member') {
        if (userId !== '00000000-0000-0000-0000-000000000000') {
          await this.prisma.$executeRawUnsafe(`
            DELETE FROM public.user_roles WHERE user_id = $1::uuid AND role IN ('platform_admin', 'admin', 'moderator', 'tenant_admin')
          `, userId).catch(() => {});
        }
      }

      // Dispatch 2-way business notification
      try {
        const notifTitle = 'Cập nhật phân quyền & phòng ban';
        const notifBody = `Tài khoản của bạn đã được cập nhật chức danh: "${data.executiveRole}" thuộc phòng ban: "${data.department}".`;
        const notifId = crypto.randomUUID();
        const dedupeKey = `role-dept-${memberId}-${Date.now()}`;
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          role: data.executiveRole,
          department: data.department,
          targetRoute: '/account-settings',
        });

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.business_notifications (
            id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
            title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
          ) VALUES (
            $1::uuid, $2::uuid, 'membership', $3, 'role_assigned', 'role_updated',
            $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
          )
        `, notifId, userId, memberId, notifTitle, notifBody, safeData, dedupeKey).catch(() => {});

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO public.member_notifications (
            id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, false, false, 'membership', $4, NOW()
          )
        `, memberId, notifTitle, notifBody, memberId).catch(() => {});
      } catch (e: any) {
        console.warn('Failed to send role update notification:', e?.message);
      }
    }

    return { ok: true, memberId };
  }
}



