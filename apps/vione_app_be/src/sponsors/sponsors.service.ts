import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type SponsorType = 'regular' | 'new';
export type PackageType = 'cash' | 'in_kind';

export class CreateSponsorPackageDto {
  tier!: SponsorTier;
  price!: number;
  benefits?: string[];
  available?: number;
  sold?: number;
  packageType?: PackageType;
  inKindDescription?: string;
}

export class UpdateSponsorPackageDto {
  tier?: SponsorTier;
  price?: number;
  benefits?: string[];
  available?: number;
  sold?: number;
  packageType?: PackageType;
  inKindDescription?: string;
}

export class CreateSponsorDto {
  name!: string;
  tier!: SponsorTier;
  contact?: string;
  email?: string;
  phone?: string;
  amount?: number;
  events?: number;
  since?: string;
  status?: 'active' | 'expired';
  sponsorType?: SponsorType;
  packageType?: PackageType;
  inKindDescription?: string;
}

export class OnboardSponsorDto {
  packageId!: string;
  name!: string;
  contact?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class SponsorsService {
  constructor(private prisma: PrismaService) {}

  private async resolveAssociationId(assocId?: string): Promise<string> {
    if (assocId) return assocId;
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM public.associations 
      ORDER BY landing_published DESC, created_at DESC 
      LIMIT 1
    `.catch(() => []);
    if (rows.length > 0 && rows[0]?.id) return rows[0].id;
    return 'ba000000-0000-4000-8000-000000000001';
  }

  // ── SPONSOR PACKAGES ────────────────────────────────────────────────────────

  async listPackages() {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.sponsor_packages
        ORDER BY created_at DESC
      `;
      const tierOrder = ['platinum', 'gold', 'silver', 'bronze'];
      return (rows || []).map((r) => ({
        id: r.id,
        tier: r.tier || 'bronze',
        price: Number(r.price ?? 0),
        benefits: Array.isArray(r.benefits) ? r.benefits : [],
        available: Number(r.available ?? 0),
        sold: Number(r.sold ?? 0),
        packageType: (r.package_type || 'cash') as PackageType,
        inKindDescription: r.in_kind_description || '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })).sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier));
    } catch (err: any) {
      console.error('[SponsorsService] listPackages error:', err);
      return [];
    }
  }

  async getPackageById(id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsor_packages WHERE id = ${id} LIMIT 1
    `;
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Sponsor package ${id} not found`);
    }
    const r = rows[0];
    return {
      id: r.id,
      tier: r.tier || 'bronze',
      price: Number(r.price ?? 0),
      benefits: Array.isArray(r.benefits) ? r.benefits : [],
      available: Number(r.available ?? 0),
      sold: Number(r.sold ?? 0),
      packageType: (r.package_type || 'cash') as PackageType,
      inKindDescription: r.in_kind_description || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async createPackage(dto: CreateSponsorPackageDto & { associationId?: string }) {
    const id = `PKG-${Date.now().toString(36).toUpperCase()}`;
    const tier = dto.tier || 'bronze';
    const price = BigInt(Math.round(dto.price || 0));
    const benefits = dto.benefits || [];
    const available = Math.round(dto.available ?? 0);
    const sold = Math.round(dto.sold ?? 0);
    const packageType = dto.packageType || 'cash';
    const inKindDescription = dto.inKindDescription || null;
    const associationId = await this.resolveAssociationId(dto.associationId);

    await this.prisma.$executeRaw`
      INSERT INTO public.sponsor_packages (id, tier, price, benefits, available, sold, association_id, package_type, in_kind_description, created_at, updated_at)
      VALUES (${id}, ${tier}, ${price}, ${benefits}::text[], ${available}, ${sold}, ${associationId}::uuid, ${packageType}, ${inKindDescription}, NOW(), NOW())
    `;

    return this.getPackageById(id);
  }

  async updatePackage(id: string, dto: UpdateSponsorPackageDto) {
    const existing = await this.getPackageById(id);
    const tier = dto.tier ?? existing.tier;
    const price = BigInt(Math.round(dto.price !== undefined ? dto.price : existing.price));
    const benefits = dto.benefits ?? existing.benefits;
    const available = Math.round(dto.available !== undefined ? dto.available : existing.available);
    const sold = Math.round(dto.sold !== undefined ? dto.sold : existing.sold);
    const packageType = dto.packageType ?? existing.packageType;
    const inKindDescription = dto.inKindDescription !== undefined ? dto.inKindDescription : existing.inKindDescription;

    await this.prisma.$executeRaw`
      UPDATE public.sponsor_packages
      SET tier = ${tier}, price = ${price}, benefits = ${benefits}::text[], available = ${available}, sold = ${sold},
          package_type = ${packageType}, in_kind_description = ${inKindDescription}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return this.getPackageById(id);
  }

  async deletePackage(id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.sponsor_packages WHERE id = ${id}
    `;
    return { ok: true };
  }

  // ── SPONSORS ────────────────────────────────────────────────────────────────

  async listSponsors() {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM public.sponsors
        ORDER BY amount DESC, created_at DESC
      `;
      return (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        tier: r.tier || 'bronze',
        sponsorType: (r.sponsor_type || 'new') as SponsorType,
        packageType: (r.package_type || 'cash') as PackageType,
        inKindDescription: r.in_kind_description || '',
        contact: r.contact || '',
        email: r.email || '',
        phone: r.phone || '',
        amount: Number(r.amount ?? 0),
        events: Number(r.events ?? 0),
        since: r.since instanceof Date ? r.since.toISOString().slice(0, 10) : String(r.since || ''),
        status: r.status || 'active',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    } catch (err: any) {
      console.error('[SponsorsService] listSponsors error:', err);
      return [];
    }
  }

  async getSponsorById(id: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM public.sponsors WHERE id = ${id} LIMIT 1
    `;
    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Sponsor ${id} not found`);
    }
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      tier: r.tier || 'bronze',
      sponsorType: (r.sponsor_type || 'new') as SponsorType,
      packageType: (r.package_type || 'cash') as PackageType,
      inKindDescription: r.in_kind_description || '',
      contact: r.contact || '',
      email: r.email || '',
      phone: r.phone || '',
      amount: Number(r.amount ?? 0),
      events: Number(r.events ?? 0),
      since: r.since instanceof Date ? r.since.toISOString().slice(0, 10) : String(r.since || ''),
      status: r.status || 'active',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async createSponsor(dto: CreateSponsorDto) {
    const id = `SP-${Date.now().toString(36).toUpperCase()}`;
    const name = dto.name;
    const tier = dto.tier || 'bronze';
    const sponsorType = dto.sponsorType || 'new';
    const packageType = dto.packageType || 'cash';
    const inKindDescription = dto.inKindDescription || null;
    const contact = dto.contact || '';
    const email = dto.email || '';
    const phone = dto.phone || '';
    const amount = BigInt(Math.round(dto.amount || 0));
    const events = Math.round(dto.events || 0);
    let safeSince = dto.since?.trim() || new Date().toISOString().slice(0, 10);
    if (isNaN(new Date(safeSince).getTime())) {
      safeSince = new Date().toISOString().slice(0, 10);
    }
    const status = dto.status || 'active';
    const associationId = await this.resolveAssociationId((dto as any).associationId);

    await this.prisma.$executeRaw`
      INSERT INTO public.sponsors (id, name, tier, sponsor_type, package_type, in_kind_description, contact, email, phone, amount, events, since, status, association_id, created_at, updated_at)
      VALUES (${id}, ${name}, ${tier}, ${sponsorType}, ${packageType}, ${inKindDescription}, ${contact}, ${email}, ${phone}, ${amount}, ${events}, ${safeSince}::date, ${status}, ${associationId}::uuid, NOW(), NOW())
    `;

    return this.getSponsorById(id);
  }

  async updateSponsor(id: string, dto: Partial<CreateSponsorDto>) {
    const existing = await this.getSponsorById(id);
    const name = dto.name ?? existing.name;
    const tier = dto.tier ?? existing.tier;
    const sponsorType = dto.sponsorType ?? existing.sponsorType;
    const packageType = dto.packageType ?? existing.packageType;
    const inKindDescription = dto.inKindDescription !== undefined ? dto.inKindDescription : existing.inKindDescription;
    const contact = dto.contact ?? existing.contact;
    const email = dto.email ?? existing.email;
    const phone = dto.phone ?? existing.phone;
    const amount = BigInt(Math.round(dto.amount !== undefined ? dto.amount : existing.amount));
    const events = Math.round(dto.events !== undefined ? dto.events : existing.events);
    const since = dto.since ?? existing.since;
    const status = dto.status ?? existing.status;

    await this.prisma.$executeRaw`
      UPDATE public.sponsors
      SET name = ${name}, tier = ${tier}, sponsor_type = ${sponsorType}, package_type = ${packageType}, in_kind_description = ${inKindDescription},
          contact = ${contact}, email = ${email}, phone = ${phone},
          amount = ${amount}, events = ${events}, since = ${since}::date, status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return this.getSponsorById(id);
  }

  async deleteSponsor(id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.sponsors WHERE id = ${id}
    `;
    return { ok: true };
  }

  async onboardSponsor(dto: OnboardSponsorDto) {
    const pkg = await this.getPackageById(dto.packageId);
    if (pkg.sold >= pkg.available && pkg.available > 0) {
      throw new BadRequestException('Gói tài trợ này đã hết lượt phát hành');
    }

    const sponsor = await this.createSponsor({
      name: dto.name,
      tier: pkg.tier,
      sponsorType: 'new',
      packageType: pkg.packageType,
      inKindDescription: pkg.inKindDescription,
      contact: dto.contact,
      email: dto.email,
      phone: dto.phone,
      amount: pkg.price,
      events: 0,
      since: new Date().toISOString().slice(0, 10),
      status: 'active',
    });

    await this.prisma.$executeRaw`
      UPDATE public.sponsor_packages
      SET sold = sold + 1, updated_at = NOW()
      WHERE id = ${dto.packageId}
    `;

    return sponsor;
  }
}
