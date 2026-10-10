import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * ConnectMarketplaceRepository — Data Access Layer for B2B Marketplace, Products, Inquiries, Quotes, and Leads.
 * Encapsulates 100% of raw SQL and database interactions.
 */
@Injectable()
export class ConnectMarketplaceRepository {
  private readonly logger = new Logger(ConnectMarketplaceRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async insertScopedNotification(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.notifications (
        id, code, title, body, audience, channel, status, sent_at, association_id, app_scope, target_app, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${data.code}, ${data.title}, ${data.body},
        'staff', 'inapp', 'sent', ${data.sentAt}, ${data.associationId}::uuid, 'crm', 'crm', ${data.sentAt}, ${data.sentAt}
      )
    `.catch((err) => console.warn('Could not insert scoped public.notifications:', err));
  }

  async findAssociationAdminUserIds(associationId: string): Promise<string[]> {
    const adminMembers = await this.prisma.$queryRaw<any[]>`
      SELECT DISTINCT user_id FROM public.memberships
      WHERE (association_id = ${associationId}::uuid OR association_id IS NULL)
        AND role IN ('admin', 'association_admin', 'owner', 'staff', 'manager', 'executive')
      UNION
      SELECT DISTINCT user_id FROM public.user_roles
      WHERE role IN ('platform_admin', 'tenant_admin')
      UNION
      SELECT DISTINCT id AS user_id FROM public.vione_users
      WHERE email LIKE '%admin%' OR username LIKE '%admin%'
    `.catch(() => [] as any[]);

    return Array.from(new Set(adminMembers.map((m) => m.user_id).filter(Boolean)));
  }

  async insertAdminBusinessNotification(data: any): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, action_kind, action_label_key, action_target,
        priority, status, app_scope, target_app, created_at, updated_at, dedupe_key
      ) VALUES (
        ${data.notifId}::uuid, ${data.adminId}::uuid, 'association', ${data.sourceRecordId || data.associationId},
        ${data.type || 'assoc_registration'}, ${data.type || 'assoc_admin_alert'},
        ${data.title}, ${data.body},
        ${data.safeData}::jsonb, 'navigate', 'Xem hồ sơ & duyệt', ${data.actionTarget}::jsonb,
        'high', 'delivered', 'crm', 'crm', ${data.now}, ${data.now}, ${`assoc_alert:${data.notifId}`}
      )
    `.catch((err) => console.warn('Error inserting business_notification for admin:', err));
  }

  async listMarketplaceProducts(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
             COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
             COALESCE(m.phone, '') as seller_phone,
             COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
      FROM public.products p
      LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
      LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
      ORDER BY p.created_at DESC
    `.catch((err) => {
      console.error(`listMarketplaceProducts error: ${err?.message}`);
      return [];
    });
  }

  async findProductDetailById(id: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT p.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
             COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
             COALESCE(m.phone, '') as seller_phone,
             COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
      FROM public.products p
      LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
      LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
      WHERE p.id = ${id} LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async bumpProductViews(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE public.products SET views = COALESCE(views, 0) + 1 WHERE id = ${id}
    `.catch(() => {});
  }

  async findQuotesByProductId(id: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT q.*,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as buyer_name,
             COALESCE(m.cover_url, u.avatar_url, '') as buyer_avatar,
             COALESCE(m.phone, q.contact, '') as buyer_phone,
             COALESCE(m.name, bi.company_name, '') as buyer_company
      FROM public.quote_requests q
      LEFT JOIN public.members m ON (q.buyer_id = m.user_id::text OR q.buyer_id = m.id OR q.buyer_id = m.code)
      LEFT JOIN public.vione_users u ON (q.buyer_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (q.buyer_id = bi.owner_user_id::text)
      WHERE q.product_id = ${id}
      ORDER BY q.created_at DESC
    `.catch(() => []);
  }

  async insertProduct(data: any): Promise<any> {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.products (
        id, seller_id, title, name, description, price, original_price, member_price, unit, currency,
        category, status, views, emoji, pdf_url, image_urls, image_url, company, website_url, facebook_url,
        association_id, created_at, updated_at
      ) VALUES (
        ${data.id}, ${data.sellerId}, ${data.title}, ${data.title}, ${data.description ?? ''}, ${Number(data.price ?? 0)},
        ${data.originalPrice}, ${data.memberPrice}, ${data.unit}, ${data.currency},
        ${data.category ?? 'mk.cat.other'}, ${data.status ?? 'active'}, 0, ${data.emoji ?? '🛍️'},
        ${data.pdfUrl ?? ''}, ${data.imageUrls}::text[], ${data.firstImage}, ${data.company}, ${data.websiteUrl ?? ''}, ${data.facebookUrl ?? ''},
        ${data.assocId}::uuid, NOW(), NOW()
      )
      RETURNING *
    `.catch(async (err) => {
      console.warn('createMarketplaceProduct primary insert failed, using fallback:', err?.message);
      return this.prisma.$queryRaw<any[]>`
        INSERT INTO public.products (
          id, seller_id, title, description, price, category, status, views, emoji, pdf_url, image_urls, website_url, facebook_url, association_id, created_at, updated_at
        ) VALUES (
          ${data.id}, ${data.sellerId}, ${data.title}, ${data.description ?? ''}, ${Number(data.price ?? 0)},
          ${data.category ?? 'mk.cat.other'}, ${data.status ?? 'active'}, 0, ${data.emoji ?? '🛍️'},
          ${data.pdfUrl ?? ''}, ${data.imageUrls}::text[], ${data.websiteUrl ?? ''}, ${data.facebookUrl ?? ''},
          ${data.assocId}::uuid, NOW(), NOW()
        )
        RETURNING *
      `.catch(() => [] as any[]);
    });
    return rows[0] || null;
  }

  async updateProduct(id: string, data: any): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.products
      SET
        title = COALESCE(${data.title}, title),
        name = COALESCE(${data.title}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.cleanPrice}, price),
        original_price = COALESCE(${data.cleanOriginalPrice}, original_price),
        member_price = COALESCE(${data.cleanMemberPrice}, member_price),
        company = COALESCE(${data.company}, company),
        unit = COALESCE(${data.unit}, unit),
        currency = COALESCE(${data.currency}, currency),
        image_url = COALESCE(${data.firstImage}, image_url),
        image_urls = COALESCE(${data.imageUrls}::text[], image_urls),
        category = COALESCE(${data.category}, category),
        status = COALESCE(${data.status}, status),
        emoji = COALESCE(${data.emoji}, emoji),
        pdf_url = COALESCE(${data.pdfUrl}, pdf_url),
        website_url = COALESCE(${data.websiteUrl}, website_url),
        facebook_url = COALESCE(${data.facebookUrl}, facebook_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.products WHERE id = ${id}
    `;
  }

  async toggleProductSold(id: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.products
      SET status = CASE WHEN status = 'sold' THEN 'active' ELSE 'sold' END,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  }

  async listProductQuotes(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT q.*, p.title as product_title, p.price as product_price
      FROM public.quote_requests q
      LEFT JOIN public.products p ON q.product_id = p.id
      ORDER BY q.created_at DESC
    `.catch(() => []);
  }

  async findProductForQuoteCheck(productId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.title, p.seller_id, p.association_id, m.user_id as seller_user_id, m.id as member_id
      FROM public.products p
      LEFT JOIN public.members m ON (m.user_id::text = p.seller_id::text OR m.id::text = p.seller_id::text)
      WHERE p.id = ${productId} LIMIT 1
    `.catch(() => []);
  }

  async insertQuoteRequest(data: any): Promise<any> {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.quote_requests (
        id, product_id, buyer_id, quantity, message, contact, status, reminder_count, created_at, updated_at
      ) VALUES (
        ${data.id}, ${data.productId}, ${data.buyerId}::uuid, ${data.quantity},
        ${data.message ?? ''}, ${data.contact ?? ''}, 'sent', 0, NOW(), NOW()
      )
      RETURNING *
    `.catch(() => [] as any[]);
    return rows[0] || null;
  }

  async findBuyerDetails(userId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT name, phone, email FROM public.vione_users WHERE id = ${userId}::uuid LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async insertSellerQuoteNotifications(notifId: string, targetUserId: string, targetMemberId: string, quoteId: string, title: string, body: string, safeData: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, 'marketplace', $3, 'quote_requested', 'new_quote',
        $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
      )
    `, notifId, targetUserId, quoteId, title, body, safeData, `quote-req-${quoteId}`).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_notifications (
        id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
      )
    `, targetMemberId, title, body, quoteId).catch(() => {});
  }

  async updateQuoteStatus(id: string, status: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  }

  async insertBuyerQuoteStatusNotification(notifId: string, buyerId: string, quoteId: string, status: string, title: string, body: string, safeData: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, 'marketplace', $3, 'quote_status_updated', 'quote_status',
        $4, $5, $6::jsonb, 'normal', 'delivered', $7, 'all', 'all', NOW(), NOW()
      )
    `, notifId, buyerId, quoteId, title, body, safeData, `quote-status-${quoteId}-${status}`).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_notifications (
        id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
      )
    `, buyerId, title, body, quoteId).catch(() => {});
  }

  async incrementQuoteReminder(id: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET reminder_count = COALESCE(reminder_count, 0) + 1, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  }

  async findProductTitleAndSeller(productId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT p.title, p.seller_id
      FROM public.products p
      WHERE p.id = ${productId} LIMIT 1
    `.catch(() => []);
    return rows[0] || null;
  }

  async insertSellerReminderNotification(notifId: string, sellerId: string, quoteId: string, title: string, body: string, safeData: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.business_notifications (
        id, recipient_user_id, source_domain, source_record_id, event_kind, notification_kind,
        title_key, body_key, safe_display_data, priority, status, dedupe_key, app_scope, target_app, created_at, updated_at
      ) VALUES (
        $1::uuid, $2::uuid, 'marketplace', $3, 'quote_reminder', 'quote_reminder',
        $4, $5, $6::jsonb, 'high', 'delivered', $7, 'all', 'all', NOW(), NOW()
      )
    `, notifId, sellerId, quoteId, title, body, safeData, `quote-remind-${quoteId}-${Date.now()}`).catch(() => {});

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.member_notifications (
        id, recipient_id, title, body, read, dismissed, ref_type, ref_id, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, false, false, 'quote', $4, NOW()
      )
    `, sellerId, title, body, quoteId).catch(() => {});
  }

  async cancelQuote(id: string, reason: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      UPDATE public.quote_requests
      SET status = 'cancelled', cancel_reason = ${reason ?? ''}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  }

  async listActiveProducts(): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.*, a.name as association_name,
             COALESCE(m.contact, m.name, u.name, 'Hội viên CLB') as seller_name,
             COALESCE(m.cover_url, u.avatar_url, '') as seller_avatar,
             COALESCE(m.phone, '') as seller_phone,
             COALESCE(p.company, m.name, bi.company_name, 'CLB Doanh Nhân CEO 1983') as seller_company
      FROM public.products p
      LEFT JOIN public.associations a ON p.association_id = a.id
      LEFT JOIN public.members m ON (p.seller_id = m.user_id::text OR p.seller_id = m.id OR p.seller_id = m.code)
      LEFT JOIN public.vione_users u ON (p.seller_id = u.id::text)
      LEFT JOIN public.business_identities bi ON (p.seller_id = bi.owner_user_id::text)
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 100
    `.catch(() => []);
  }

  async insertCatalogProduct(prodId: string, name: string, description: string, company: string, category: string, price: number, originalPrice: number, memberPrice: number, unit: string, currency: string, imageUrl: string | null, imageUrls: string[], sellerId: string, status: string, assocId: string): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.products (
          id, title, name, description, company, category,
          price, original_price, member_price, unit, currency,
          image_url, image_urls, seller_id, status, views, emoji,
          association_id, created_at, updated_at
        ) VALUES (
          ${prodId}, ${name}, ${name}, ${description}, ${company}, ${category},
          ${price}, ${originalPrice}, ${memberPrice}, ${unit}, ${currency},
          ${imageUrl}, ${imageUrls}::text[], ${sellerId}, ${status}, 0, '🛍️',
          ${assocId}::uuid, now(), now()
        )
      `;
    } catch (err: any) {
      await this.prisma.$executeRaw`
        INSERT INTO public.products (
          id, title, description, category, price,
          seller_id, status, views, emoji,
          association_id, created_at, updated_at
        ) VALUES (
          ${prodId}, ${name}, ${description}, ${category}, ${price},
          ${sellerId}, ${status}, 0, '🛍️',
          ${assocId}::uuid, now(), now()
        )
      `;
    }
  }

  async updateCatalogProduct(productId: string, name: string, description: string, company: string, category: string, cleanPrice: number | null, cleanOriginalPrice: number | null, cleanMemberPrice: number | null, unit: string, currency: string, imageUrl: string | null, imageUrls: string[] | null): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE public.products
        SET
          title = COALESCE(${name}, title),
          name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          company = COALESCE(${company}, company),
          category = COALESCE(${category}, category),
          price = COALESCE(${cleanPrice}, price),
          original_price = COALESCE(${cleanOriginalPrice}, original_price),
          member_price = COALESCE(${cleanMemberPrice}, member_price),
          unit = COALESCE(${unit}, unit),
          currency = COALESCE(${currency}, currency),
          image_url = COALESCE(${imageUrl}, image_url),
          image_urls = COALESCE(${imageUrls}::text[], image_urls),
          updated_at = now()
        WHERE id = ${productId}
      `;
    } catch (err: any) {
      await this.prisma.$executeRaw`
        UPDATE public.products
        SET
          title = COALESCE(${name}, title),
          description = COALESCE(${description}, description),
          price = COALESCE(${cleanPrice}, price),
          updated_at = now()
        WHERE id = ${productId}
      `;
    }
  }

  async deleteCatalogProduct(productId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.products WHERE id = ${productId}
    `.catch(() => {});
  }
}
