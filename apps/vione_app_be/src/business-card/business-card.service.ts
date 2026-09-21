import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessCardService {
  constructor(private prisma: PrismaService) {}

  async listMyCards(userId: string) {
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE owner_user_id = $1::uuid ORDER BY updated_at DESC`,
      userId,
    );
    return cards;
  }

  async getMyCard(userId: string, id: string) {
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE id = $1::uuid`,
      id,
    );

    if (!cards.length) throw new NotFoundException('Card not found');
    const card = cards[0];
    if (card.owner_user_id !== userId)
      throw new UnauthorizedException('Not your card');

    const skills = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_skills WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    const services = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_services WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    const needs = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_needs WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    return { ...card, skills, services, needs };
  }

  async getPublicBySlug(slug: string) {
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE slug = $1`,
      slug,
    );
    if (!cards.length) return null;
    const card = cards[0];
    const id = card.id;

    const skills = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_skills WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    const services = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_services WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    const needs = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.business_card_needs WHERE card_id = $1::uuid ORDER BY sort_order ASC`,
      id,
    ).catch(() => []);

    return { ...card, skills, services, needs };
  }

  async saveCard(userId: string, data: any) {
    const id = data.id;
    const slug = (data.slug || `card-${Date.now()}`).trim();
    const cardKind = data.card_kind || data.cardKind || 'primary';
    const publicMode = data.public_mode || data.publicMode || 'members_only';
    const status = data.status || 'published';
    const displayName = data.display_name ?? data.displayName ?? null;
    const professionalTitle = data.professional_title ?? data.professionalTitle ?? null;
    const companyName = data.company_name ?? data.companyName ?? null;
    const companyLogoUrl = data.company_logo_url ?? data.companyLogoUrl ?? null;
    const avatarUrl = data.avatar_url ?? data.avatarUrl ?? null;
    const coverUrl = data.cover_url ?? data.coverUrl ?? null;
    const headline = data.headline ?? null;
    const bio = data.bio ?? null;
    const website = data.website ?? null;
    const workEmail = data.work_email ?? data.workEmail ?? null;
    const workPhone = data.work_phone ?? data.workPhone ?? null;
    const zaloUrl = data.zalo_url ?? data.zaloUrl ?? null;
    const linkedinUrl = data.linkedin_url ?? data.linkedinUrl ?? null;
    const facebookUrl = data.facebook_url ?? data.facebookUrl ?? null;
    const youtubeUrl = data.youtube_url ?? data.youtubeUrl ?? null;
    const tiktokUrl = data.tiktok_url ?? data.tiktokUrl ?? null;
    const address = data.address ?? null;
    const mapUrl = data.map_url ?? data.mapUrl ?? null;
    const themeId = data.theme_id ?? data.themeId ?? null;
    const customBrandColor = data.custom_brand_color ?? data.customBrandColor ?? null;
    const visibilitySettings = JSON.stringify(data.visibility_settings || data.visibilitySettings || {});
    const qrOptions = data.qr_options || data.qrOptions ? JSON.stringify(data.qr_options || data.qrOptions) : null;
    const displayNameEn = data.display_name_en ?? data.displayNameEn ?? null;
    const professionalTitleEn = data.professional_title_en ?? data.professionalTitleEn ?? null;
    const companyNameEn = data.company_name_en ?? data.companyNameEn ?? null;
    const headlineEn = data.headline_en ?? data.headlineEn ?? null;
    const bioEn = data.bio_en ?? data.bioEn ?? null;

    let targetId = id;

    if (id) {
      const existing = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.member_business_cards WHERE id = $1::uuid`,
        id,
      );
      if (!existing.length || existing[0].owner_user_id !== userId) {
        throw new UnauthorizedException('Not authorized');
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE public.member_business_cards SET
          slug = COALESCE($1, slug),
          card_kind = $2,
          public_mode = $3,
          display_name = $4,
          professional_title = $5,
          company_name = $6,
          company_logo_url = $7,
          avatar_url = $8,
          cover_url = $9,
          headline = $10,
          bio = $11,
          website = $12,
          work_email = $13,
          work_phone = $14,
          zalo_url = $15,
          linkedin_url = $16,
          facebook_url = $17,
          youtube_url = $18,
          tiktok_url = $19,
          address = $20,
          map_url = $21,
          theme_id = $22,
          custom_brand_color = $23,
          visibility_settings = $24::jsonb,
          qr_options = $25::jsonb,
          display_name_en = $26,
          professional_title_en = $27,
          company_name_en = $28,
          headline_en = $29,
          bio_en = $30,
          updated_at = NOW()
        WHERE id = $31::uuid`,
        slug, cardKind, publicMode, displayName, professionalTitle,
        companyName, companyLogoUrl, avatarUrl, coverUrl, headline,
        bio, website, workEmail, workPhone, zaloUrl,
        linkedinUrl, facebookUrl, youtubeUrl, tiktokUrl, address,
        mapUrl, themeId, customBrandColor, visibilitySettings, qrOptions,
        displayNameEn, professionalTitleEn, companyNameEn, headlineEn, bioEn,
        id,
      );
    } else {
      const inserted = await this.prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO public.member_business_cards (
          slug, card_kind, status, public_mode, display_name, professional_title,
          company_name, company_logo_url, avatar_url, cover_url, headline, bio,
          website, work_email, work_phone, zalo_url, linkedin_url, facebook_url,
          youtube_url, tiktok_url, address, map_url, theme_id, custom_brand_color,
          visibility_settings, qr_options, display_name_en, professional_title_en,
          company_name_en, headline_en, bio_en, owner_user_id, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25::jsonb, $26::jsonb, $27, $28,
          $29, $30, $31, $32::uuid, NOW()
        ) RETURNING id`,
        slug, cardKind, status, publicMode, displayName, professionalTitle,
        companyName, companyLogoUrl, avatarUrl, coverUrl, headline, bio,
        website, workEmail, workPhone, zaloUrl, linkedinUrl, facebookUrl,
        youtubeUrl, tiktokUrl, address, mapUrl, themeId, customBrandColor,
        visibilitySettings, qrOptions, displayNameEn, professionalTitleEn,
        companyNameEn, headlineEn, bioEn, userId,
      );
      targetId = inserted[0]?.id;
    }

    // Sync avatar to members and user_profiles
    if (avatarUrl) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE public.members SET avatar = $1 WHERE user_id = $2::uuid OR id = $2::uuid`,
        avatarUrl, userId,
      ).catch(() => null);
      await this.prisma.$executeRawUnsafe(
        `UPDATE public.user_profiles SET avatar_url = $1 WHERE user_id = $2::uuid OR id = $2::uuid`,
        avatarUrl, userId,
      ).catch(() => null);
    }

    // Sync skills, services, needs
    if (targetId) {
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM public.business_card_skills WHERE card_id = $1::uuid`,
        targetId,
      ).catch(() => null);
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM public.business_card_services WHERE card_id = $1::uuid`,
        targetId,
      ).catch(() => null);
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM public.business_card_needs WHERE card_id = $1::uuid`,
        targetId,
      ).catch(() => null);

      const skills = data.skills || [];
      for (let i = 0; i < skills.length; i++) {
        const s = skills[i];
        const label = typeof s === 'string' ? s : s?.label;
        if (label) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.business_card_skills (card_id, label, sort_order) VALUES ($1::uuid, $2, $3)`,
            targetId, label, i,
          ).catch(() => null);
        }
      }

      const services = data.services || [];
      for (let i = 0; i < services.length; i++) {
        const s = services[i];
        if (s?.title) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.business_card_services (card_id, title, description, category, sort_order) VALUES ($1::uuid, $2, $3, $4, $5)`,
            targetId, s.title, s.description || null, s.category || null, i,
          ).catch(() => null);
        }
      }

      const needs = data.needs || [];
      for (let i = 0; i < needs.length; i++) {
        const n = needs[i];
        if (n?.title) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.business_card_needs (card_id, title, description, category, sort_order) VALUES ($1::uuid, $2, $3, $4, $5)`,
            targetId, n.title, n.description || null, n.category || null, i,
          ).catch(() => null);
        }
      }
    }

    return { id: targetId, ok: true };
  }

  async setStatus(userId: string, id: string, status: string) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE id = $1::uuid`,
      id,
    );
    if (!existing.length || existing[0].owner_user_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.prisma.$executeRawUnsafe(
      `UPDATE public.member_business_cards SET status = $1, updated_at = NOW() WHERE id = $2::uuid`,
      status, id,
    );
    return { ok: true };
  }

  async getPreviewBySlug(slug: string) {
    return this.getPublicBySlug(slug);
  }

  async listPublicProfileSlugs() {
    const cards = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT slug, updated_at FROM public.member_business_cards WHERE public_mode = 'public' AND status = 'published'`,
    );
    return cards.map((c) => ({
      slug: c.slug,
      updatedAt: c.updated_at ? new Date(c.updated_at).toISOString() : new Date().toISOString(),
    }));
  }

  async setPrimary(userId: string, id: string) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE id = $1::uuid`,
      id,
    );
    if (!existing.length || existing[0].owner_user_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    // Demote all others
    await this.prisma.$executeRawUnsafe(
      `UPDATE public.member_business_cards SET card_kind = 'secondary' WHERE owner_user_id = $1::uuid AND id != $2::uuid`,
      userId, id,
    );

    // Promote this one
    await this.prisma.$executeRawUnsafe(
      `UPDATE public.member_business_cards SET card_kind = 'primary' WHERE id = $1::uuid`,
      id,
    );

    return { ok: true };
  }

  async deleteCard(userId: string, id: string) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.member_business_cards WHERE id = $1::uuid`,
      id,
    );
    if (!existing.length || existing[0].owner_user_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.member_business_cards WHERE id = $1::uuid`,
      id,
    );
    return { ok: true };
  }

  // --- Leads ---

  async listMyLeads(userId: string) {
    return this.prisma.business_card_leads.findMany({
      where: { owner_member_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        card: { select: { slug: true, display_name: true } },
      },
    });
  }

  async updateLeadStatus(
    userId: string,
    id: string,
    status: string,
    note?: string,
  ) {
    const existing = await this.prisma.business_card_leads.findUnique({
      where: { id },
    });
    if (!existing || existing.owner_member_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const updateData: any = { status };
    if (note) {
      const metadata = (existing.metadata as any) || {};
      metadata.note = note;
      updateData.metadata = metadata;
    }

    await this.prisma.business_card_leads.update({
      where: { id },
      data: updateData,
    });
    return { ok: true };
  }

  async sendLeadReply(userId: string, id: string, body: any) {
    const existing = await this.prisma.business_card_leads.findUnique({
      where: { id },
    });
    if (!existing || existing.owner_member_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const metadata = (existing.metadata as any) || {};
    const history = metadata.history || [];
    history.push({
      channel: body.channel,
      body: body.body,
      sentAt: new Date().toISOString(),
    });
    metadata.history = history;

    await this.prisma.business_card_leads.update({
      where: { id },
      data: {
        status: body.markResponded ? 'responded' : existing.status,
        metadata,
      },
    });

    return { ok: true };
  }

  async processLeadWorkflow(
    userId: string,
    id: string,
    status: string,
    note?: string,
  ) {
    return this.updateLeadStatus(userId, id, status, note);
  }

  async getLeadStats(userId: string, days: number) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Look up associated member IDs for this user to ensure we capture all leads
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.members WHERE user_id = ${userId}::uuid OR id::text = ${userId}
    `.catch(() => []);
    const memberIds = memberRows.map((m) => m.id);
    const searchOwnerIds = [userId, ...memberIds];

    const leads = await this.prisma.business_card_leads.findMany({
      where: {
        owner_member_id: { in: searchOwnerIds },
        created_at: { gte: sinceDate },
      },
      select: { status: true, created_at: true },
    }).catch(() => []);

    const myCards = await this.prisma.member_business_cards.findMany({
      where: {
        OR: [
          { owner_user_id: userId },
          { member_id: { in: memberIds } }
        ]
      },
      select: { id: true },
    }).catch(() => []);
    const cardIds = myCards.map((c) => c.id);

    let interactions: { interaction_type: string; created_at: Date }[] = [];
    if (cardIds.length > 0) {
      interactions = await this.prisma.business_card_interactions.findMany({
        where: {
          card_id: { in: cardIds },
          created_at: { gte: sinceDate },
        },
        select: { interaction_type: true, created_at: true },
      }).catch(() => []);
    }

    // Build status breakdown
    const allStatuses = ['new', 'read', 'contacting', 'responded', 'won', 'lost', 'archived'];
    const statusCounts: Record<string, number> = {};
    for (const s of allStatuses) statusCounts[s] = 0;
    for (const l of leads) {
      if (statusCounts[l.status] !== undefined) statusCounts[l.status]++;
      else statusCounts[l.status] = 1;
    }
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Build daily trend
    const dailyMap = new Map<string, { leads: number; interactions: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { leads: 0, interactions: 0 });
    }
    for (const l of leads) {
      const key = l.created_at ? new Date(l.created_at).toISOString().slice(0, 10) : '';
      if (dailyMap.has(key)) {
        dailyMap.get(key)!.leads++;
      }
    }
    for (const it of interactions) {
      const key = it.created_at ? new Date(it.created_at).toISOString().slice(0, 10) : '';
      if (dailyMap.has(key)) {
        dailyMap.get(key)!.interactions++;
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      leads: counts.leads,
      interactions: counts.interactions,
    }));

    const totalLeads = leads.length;
    const totalInteractions = interactions.length;
    const uniqueViews = (interactions as any[]).filter((it: any) => it.interaction_type === 'view').length;
    const respondedCount = (leads as any[]).filter((l: any) => l.status === 'responded' || l.status === 'won').length;
    const responseRate = totalLeads > 0 ? respondedCount / totalLeads : 0;

    return {
      totalLeads,
      totalInteractions,
      uniqueViews,
      responseRate,
      daily,
      statusBreakdown,
      leads,
      interactions,
      summary: {
        totalLeads,
        totalInteractions,
      },
    };
  }

  async getCardSettings(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT display_name, display_company, photo_url, show_name, show_company, show_photo,
             show_email, show_phone, show_address
      FROM public.card_settings
      WHERE user_id = ${userId}::uuid
      LIMIT 1
    `.catch(() => []);

    if (rows.length === 0) {
      return {
        displayName: null,
        displayCompany: null,
        photoUrl: null,
        showName: true,
        showCompany: true,
        showPhoto: true,
        showEmail: true,
        showPhone: true,
        showAddress: true,
      };
    }

    const data = rows[0];
    return {
      displayName: data.display_name ?? null,
      displayCompany: data.display_company ?? null,
      photoUrl: data.photo_url ?? null,
      showName: data.show_name !== false,
      showCompany: data.show_company !== false,
      showPhoto: data.show_photo !== false,
      showEmail: data.show_email !== false,
      showPhone: data.show_phone !== false,
      showAddress: data.show_address !== false,
    };
  }

  async saveCardSettings(userId: string, data: any) {
    await this.prisma.$executeRaw`
      INSERT INTO public.card_settings (
        user_id, display_name, display_company, photo_url,
        show_name, show_company, show_photo, show_email, show_phone, show_address, updated_at
      )
      VALUES (
        ${userId}::uuid,
        ${data.displayName ?? null},
        ${data.displayCompany ?? null},
        ${data.photoUrl ?? null},
        ${data.showName ?? true},
        ${data.showCompany ?? true},
        ${data.showPhoto ?? true},
        ${Boolean(data.showEmail)},
        ${Boolean(data.showPhone)},
        ${Boolean(data.showAddress)},
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        display_company = EXCLUDED.display_company,
        photo_url = EXCLUDED.photo_url,
        show_name = EXCLUDED.show_name,
        show_company = EXCLUDED.show_company,
        show_photo = EXCLUDED.show_photo,
        show_email = EXCLUDED.show_email,
        show_phone = EXCLUDED.show_phone,
        show_address = EXCLUDED.show_address,
        updated_at = now()
    `.catch(() => null);

    return { ok: true };
  }

  async getPublicCardByCode(rawCode: string) {
    let code = (rawCode || '').trim();
    // Strip common QR prefixes if present
    if (code.startsWith('CEO1983-MEMBER:')) {
      code = code.replace(/^CEO1983-MEMBER:/i, '').trim();
    } else if (code.startsWith('MEMBER:')) {
      code = code.replace(/^MEMBER:/i, '').trim();
    }

    // Try finding member first by code, id, or user_id
    let memRows = await this.prisma.$queryRaw<any[]>`
      SELECT m.id, m.user_id, m.code, m.name, m.contact, m.email, m.phone, m.type, m.status,
             m.avatar, m.about, m.department, m.executive_role, m.cover_url,
             m.industry, m.region, m.address, m.website, m.joined_at, m.term_end, m.association_id,
             a.public_card_enabled, a.public_card_requires_active_member
      FROM public.members m
      LEFT JOIN public.associations a ON m.association_id = a.id
      WHERE m.code ILIKE ${code}
         OR m.id::text = ${code}
         OR m.user_id::text = ${code}
      LIMIT 1
    `.catch(() => []);

    let cardRow: any = null;

    // If not found in members, check if code matches member_business_cards slug, id, or owner_user_id
    if (memRows.length === 0) {
      const cardRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.member_business_cards
        WHERE slug = ${code} OR id::text = ${code} OR owner_user_id::text = ${code}
        ORDER BY updated_at DESC
        LIMIT 1
      `.catch(() => []);

      if (cardRows.length > 0) {
        cardRow = cardRows[0];
        const searchUserId = cardRow.owner_user_id;
        const searchMemberId = cardRow.member_id;
        if (searchUserId || searchMemberId) {
          memRows = await this.prisma.$queryRaw<any[]>`
            SELECT m.id, m.user_id, m.code, m.name, m.contact, m.email, m.phone, m.type, m.status,
                   m.avatar, m.about, m.department, m.executive_role, m.cover_url,
                   m.industry, m.region, m.address, m.website, m.joined_at, m.term_end, m.association_id,
                   a.public_card_enabled, a.public_card_requires_active_member
            FROM public.members m
            LEFT JOIN public.associations a ON m.association_id = a.id
            WHERE m.user_id::text = ${searchUserId || ''}
               OR m.id::text = ${searchMemberId || ''}
            LIMIT 1
          `.catch(() => []);
        }
      }
    }

    if (memRows.length === 0 && !cardRow) {
      return {
        found: false,
        code,
        name: "",
        company: "",
        type: "company",
        status: "",
        verified: false,
        validUntil: null,
        joinedAt: null,
        title: null,
        email: null,
        phone: null,
        taxCode: null,
        industry: null,
        region: null,
        address: null,
        website: null,
        photoUrl: null,
      };
    }

    const m = memRows[0] || {};
    const userId = m.user_id || cardRow?.owner_user_id || null;

    // Load business card if not already loaded
    if (!cardRow && userId) {
      const cRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.member_business_cards
        WHERE owner_user_id = ${userId}::uuid OR member_id = ${m.id}::uuid
        ORDER BY updated_at DESC
        LIMIT 1
      `.catch(() => []);
      if (cRows.length > 0) cardRow = cRows[0];
    }

    // Load user record to get exact full name if contact is null or Admin
    let userRow: any = null;
    if (userId) {
      const uRows = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, full_name, email, phone, avatar_url FROM public.vione_users
        WHERE id = ${userId}::uuid
        LIMIT 1
      `.catch(async () => {
        return await this.prisma.$queryRaw<any[]>`
          SELECT id, full_name as name, full_name, email, phone, avatar_url FROM public.user_profiles
          WHERE user_id = ${userId}::uuid
          LIMIT 1
        `.catch(() => []);
      });
      if (uRows && uRows.length > 0) userRow = uRows[0];
    }

    let settings: any = null;
    if (userId) {
      const sRows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.card_settings WHERE user_id = ${userId}::uuid LIMIT 1
      `.catch(() => []);
      if (sRows.length > 0) settings = sRows[0];
    }

    const showName = settings ? settings.show_name !== false : true;
    const showCompany = settings ? settings.show_company !== false : true;
    const showPhoto = settings ? settings.show_photo !== false : true;
    const showEmail = settings ? settings.show_email !== false : true;
    const showPhone = settings ? settings.show_phone !== false : true;
    const showAddress = settings ? settings.show_address !== false : true;

    // Resolve Name
    let resolvedPersonName =
      cardRow?.display_name ||
      settings?.display_name ||
      (m.type === "individual" ? m.name : m.contact) ||
      m.contact ||
      userRow?.name ||
      userRow?.full_name ||
      m.name ||
      "";

    if (
      !resolvedPersonName ||
      resolvedPersonName.toLowerCase() === "admin" ||
      resolvedPersonName.toLowerCase() === "platform administrator"
    ) {
      resolvedPersonName =
        userRow?.full_name ||
        userRow?.name ||
        (m.type === "individual" ? m.name : m.contact) ||
        "Hội viên CLB Doanh Nhân CEO 1983";
      if (
        resolvedPersonName.toLowerCase() === "admin" ||
        resolvedPersonName.toLowerCase() === "platform administrator"
      ) {
        resolvedPersonName = "Hội viên CLB Doanh Nhân CEO 1983";
      }
    }

    // Resolve Company Name
    let resolvedCompanyName =
      cardRow?.company_name ||
      settings?.display_company ||
      (m.type === "individual" ? (m.about || "CLB Doanh Nhân CEO 1983") : m.name) ||
      "CLB Doanh Nhân CEO 1983";

    if (
      resolvedCompanyName.includes("ViOne Platform") ||
      resolvedCompanyName.toLowerCase() === "vione platform"
    ) {
      resolvedCompanyName = "CLB Doanh Nhân CEO 1983";
    }

    // Resolve Title
    const resolvedTitle =
      cardRow?.professional_title ||
      m.executive_role ||
      m.department ||
      (m.type === "company" ? "Đại diện Doanh nghiệp Hội viên" : "Lãnh đạo Doanh nghiệp Hội viên");

    // Resolve Photo
    const resolvedPhoto = showPhoto
      ? (cardRow?.avatar_url || settings?.photo_url || m.avatar || userRow?.avatar_url || null)
      : null;

    // Resolve Phone & Email
    const resolvedPhone = showPhone
      ? (cardRow?.work_phone || m.phone || userRow?.phone || null)
      : "Đã ẩn theo cài đặt riêng tư";

    const resolvedEmail = showEmail
      ? (cardRow?.work_email || m.email || userRow?.email || null)
      : "Đã ẩn theo cài đặt riêng tư";

    const resolvedWebsite = showCompany
      ? (cardRow?.website || m.website || "https://ceo1983club.com")
      : null;

    const resolvedAddress = showAddress
      ? (cardRow?.address || m.address || "Trụ sở CLB Doanh Nhân CEO 1983, Hà Nội")
      : "Đã ẩn theo cài đặt riêng tư";

    const isActive = m.status === 'active' || m.status === 'memberStatus.active' || !m.status;

    return {
      found: true,
      code: m.code || cardRow?.slug || code,
      name: showName ? resolvedPersonName : "Hội viên CLB Doanh Nhân CEO 1983",
      company: showCompany ? resolvedCompanyName : "Đã ẩn theo cài đặt riêng tư",
      type: m.type || "company",
      status: m.status || "active",
      verified: isActive,
      validUntil: m.term_end ? new Date(m.term_end).toISOString() : null,
      joinedAt: m.joined_at ? new Date(m.joined_at).toISOString() : null,
      title: resolvedTitle,
      email: resolvedEmail,
      phone: resolvedPhone,
      taxCode: null,
      industry: showCompany ? (m.industry || cardRow?.headline || "Công nghệ thông tin & Đổi mới sáng tạo") : "Đã ẩn",
      region: showCompany ? (m.region || "Miền Bắc (Hà Nội)") : null,
      address: resolvedAddress,
      website: resolvedWebsite,
      photoUrl: resolvedPhoto,
      userId: userId,
      headline: cardRow?.headline || null,
      bio: cardRow?.bio || null,
      zaloUrl: cardRow?.zalo_url || null,
      linkedinUrl: cardRow?.linkedin_url || null,
      facebookUrl: cardRow?.facebook_url || null,
      privacySettings: {
        showPhoto,
        showName,
        showCompany,
        showPhone,
        showEmail,
        showAddress,
      },
    };
  }

  async saveCardAiHistory(userId: string, data: any) {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.card_ai_import_history (
        user_id, thumbnail, suggestion, template_id, qr_background, applied_at, note, created_at
      )
      VALUES (
        ${userId}::uuid,
        ${data.thumbnail},
        ${JSON.stringify(data.suggestion)}::jsonb,
        ${data.templateId ?? null},
        ${data.qrBackground ?? null},
        ${data.applied ? new Date() : null},
        ${data.note ?? null},
        now()
      )
      RETURNING *
    `.catch(() => []);

    if (rows.length === 0) {
      return {
        id: `ai-${Date.now()}`,
        thumbnail: data.thumbnail,
        suggestion: data.suggestion,
        templateId: data.templateId ?? null,
        qrBackground: data.qrBackground ?? null,
        appliedAt: data.applied ? new Date().toISOString() : null,
        note: data.note ?? null,
        createdAt: new Date().toISOString(),
      };
    }
    const r = rows[0];
    return {
      id: r.id,
      thumbnail: r.thumbnail,
      suggestion: r.suggestion,
      templateId: r.template_id,
      qrBackground: r.qr_background,
      appliedAt: r.applied_at ? new Date(r.applied_at).toISOString() : null,
      note: r.note,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    };
  }

  async listCardAiHistory(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.card_ai_import_history
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      thumbnail: r.thumbnail,
      suggestion: r.suggestion,
      templateId: r.template_id,
      qrBackground: r.qr_background,
      appliedAt: r.applied_at ? new Date(r.applied_at).toISOString() : null,
      note: r.note,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));
  }

  async deleteCardAiHistory(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.card_ai_import_history
      WHERE id = ${id}::uuid AND user_id = ${userId}::uuid
    `.catch(() => null);
    return { ok: true };
  }

  async getBcAdminLevel(userId: string): Promise<string> {
    const roles = await this.prisma.user_roles.findMany({ where: { user_id: userId } }).catch(() => []) as any[];
    if (roles.some((r: any) => r.role === 'platform_admin')) return 'full';

    const memberships = await this.prisma.$queryRaw<any[]>`
      SELECT role FROM public.memberships WHERE user_id = ${userId}::uuid AND role = 'admin'
    `.catch(() => []);
    if (memberships.length > 0) return 'full';

    return 'none';
  }

  async listAllAdminCards(userId: string) {
    const level = await this.getBcAdminLevel(userId);
    if (level === 'none') return [];

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT c.id, c.slug, c.card_kind, c.status, c.public_mode, c.display_name, c.professional_title,
             c.company_name, c.avatar_url, c.updated_at, c.created_at, c.member_id, c.association_id,
             m.name as member_name, m.code as member_code, a.name as association_name
      FROM public.member_business_cards c
      LEFT JOIN public.members m ON c.member_id = m.id
      LEFT JOIN public.associations a ON c.association_id = a.id
      ORDER BY c.created_at DESC
      LIMIT 1000
    `.catch(() => []);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      cardKind: r.card_kind || 'primary',
      status: r.status || 'draft',
      publicMode: r.public_mode || 'members_only',
      displayName: r.display_name || null,
      professionalTitle: r.professional_title || null,
      companyName: r.company_name || null,
      avatarUrl: r.avatar_url || null,
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      memberId: r.member_id || '',
      memberName: r.member_name || null,
      memberCode: r.member_code || null,
      associationId: r.association_id || '',
      associationName: r.association_name || null,
    }));
  }

  async adminSetCardStatus(userId: string, id: string, status: string) {
    const level = await this.getBcAdminLevel(userId);
    if (level === 'none') throw new UnauthorizedException('Forbidden');

    await this.prisma.$executeRaw`
      UPDATE public.member_business_cards
      SET status = ${status}, updated_at = now()
      WHERE id = ${id}
    `;
    return { ok: true };
  }

  async adminSetCardsStatus(userId: string, ids: string[], status: string) {
    const level = await this.getBcAdminLevel(userId);
    if (level === 'none') throw new UnauthorizedException('Forbidden');

    let count = 0;
    for (const id of ids) {
      await this.prisma.$executeRaw`
        UPDATE public.member_business_cards
        SET status = ${status}, updated_at = now()
        WHERE id = ${id}
      `;
      count++;
    }
    return count;
  }
}
