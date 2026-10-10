import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConnectAppGateway } from '../connect-app.gateway';
import { ConnectMarketplaceRepository } from '../repositories/connect-marketplace.repository';
import * as crypto from 'crypto';

/**
 * ConnectMarketplaceService — Business logic service for B2B Marketplace, Products, and Quotes.
 * 100% separated from SQL & database access via ConnectMarketplaceRepository.
 */
@Injectable()
export class ConnectMarketplaceService {
  private readonly logger = new Logger(ConnectMarketplaceService.name);

  constructor(
    private readonly repo: ConnectMarketplaceRepository,
    private readonly gateway: ConnectAppGateway,
  ) {}

  /**
   * Helper: Send notification to association admins & CRM clients
   */
  async notifyAssociationAdmins(
    associationId: string,
    payload: {
      title: string;
      body: string;
      targetRoute: string;
      type?: string;
      sourceRecordId?: string;
      meta?: any;
    },
  ) {
    try {
      const now = new Date();
      const code = `NTF-${Date.now().toString(36).toUpperCase()}`;

      await this.repo.insertScopedNotification({
        code,
        title: payload.title,
        body: payload.body,
        sentAt: now,
        associationId,
      });

      const adminUserIds = await this.repo.findAssociationAdminUserIds(associationId);

      for (const adminId of adminUserIds) {
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          title: payload.title,
          body: payload.body,
          companyName: payload.meta?.companyName || payload.title,
          applicantName: payload.meta?.applicantName,
          phone: payload.meta?.phone,
          targetRoute: payload.targetRoute,
          appScope: 'crm',
          ...(payload.meta || {}),
        });
        const actionTarget = JSON.stringify({
          route: payload.targetRoute,
          targetRoute: payload.targetRoute,
          associationId,
        });

        await this.repo.insertAdminBusinessNotification({
          notifId,
          adminId,
          sourceRecordId: payload.sourceRecordId,
          associationId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          safeData,
          actionTarget,
          now,
        });

        this.gateway.emitNotification(adminId, {
          id: notifId,
          title: payload.title,
          body: payload.body,
          appScope: 'crm',
          targetApp: 'crm',
          action: { targetRoute: payload.targetRoute },
          safeDisplayData: {
            title: payload.title,
            body: payload.body,
            targetRoute: payload.targetRoute,
            appScope: 'crm',
          },
          targetRoute: payload.targetRoute,
        });
      }

      this.gateway.emitToRoom(`assoc:${associationId}`, 'notification:new', {
        title: payload.title,
        body: payload.body,
        targetRoute: payload.targetRoute,
        action: { targetRoute: payload.targetRoute },
        safeDisplayData: {
          title: payload.title,
          body: payload.body,
          targetRoute: payload.targetRoute,
        },
      });

      this.gateway.emitToAll('notification:new', {
        title: payload.title,
        body: payload.body,
        targetRoute: payload.targetRoute,
        action: { targetRoute: payload.targetRoute },
        safeDisplayData: {
          title: payload.title,
          body: payload.body,
          targetRoute: payload.targetRoute,
        },
      });
    } catch (err) {
      this.logger.warn('Error in notifyAssociationAdmins:', err);
    }
  }

  // ── Marketplace Products ──────────────────────────────────────────────
  async listMarketplaceProducts(query?: any) {
    const rows = await this.repo.listMarketplaceProducts();

    return rows.map((r) => {
      const imgList = Array.isArray(r.image_urls) ? r.image_urls : (typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : []);
      const firstImg = (imgList && imgList.length > 0 ? imgList[0] : null) || r.image_url || null;
      return {
        id: r.id,
        sellerId: r.seller_id,
        sellerName: r.seller_name || undefined,
        sellerAvatar: r.seller_avatar || undefined,
        sellerPhone: r.seller_phone || undefined,
        sellerCompany: r.seller_company || undefined,
        title: r.title,
        name: r.title,
        description: r.description ?? '',
        price: Number(r.price ?? 0),
        originalPrice: r.original_price ? Number(r.original_price) : undefined,
        memberPrice: r.member_price ? Number(r.member_price) : undefined,
        category: r.category ?? 'mk.cat.other',
        company: r.seller_company || r.company || 'CLB Doanh Nhân CEO 1983',
        status: r.status ?? 'active',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
        time: r.created_at ? new Date(r.created_at).toISOString() : '',
        views: Number(r.views ?? 0),
        emoji: r.emoji ?? '🛍️',
        pdfUrl: r.pdf_url ?? '',
        imageUrls: imgList,
        imageUrl: firstImg,
        websiteUrl: r.website_url ?? '',
        facebookUrl: r.facebook_url ?? '',
        associationId: r.association_id,
      };
    });
  }

  async getMarketplaceProductById(id: string) {
    const r = await this.repo.findProductDetailById(id);
    if (!r) return null;

    await this.repo.bumpProductViews(id);
    const quotes = await this.repo.findQuotesByProductId(id);

    const imgList = Array.isArray(r.image_urls) ? r.image_urls : (typeof r.image_urls === 'string' ? JSON.parse(r.image_urls) : []);
    const firstImg = (imgList && imgList.length > 0 ? imgList[0] : null) || r.image_url || null;

    return {
      product: {
        id: r.id,
        sellerId: r.seller_id,
        sellerName: r.seller_name || undefined,
        sellerAvatar: r.seller_avatar || undefined,
        sellerPhone: r.seller_phone || undefined,
        sellerCompany: r.seller_company || undefined,
        title: r.title,
        name: r.title,
        description: r.description ?? '',
        price: Number(r.price ?? 0),
        originalPrice: r.original_price ? Number(r.original_price) : undefined,
        memberPrice: r.member_price ? Number(r.member_price) : undefined,
        category: r.category ?? 'mk.cat.other',
        company: r.seller_company || r.company || 'CLB Doanh Nhân CEO 1983',
        status: r.status ?? 'active',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
        time: r.created_at ? new Date(r.created_at).toISOString() : '',
        views: Number(r.views ?? 0),
        emoji: r.emoji ?? '🛍️',
        pdfUrl: r.pdf_url ?? '',
        imageUrls: imgList,
        imageUrl: firstImg,
        websiteUrl: r.website_url ?? '',
        facebookUrl: r.facebook_url ?? '',
        associationId: r.association_id,
      },
      quotes: quotes.map((q) => ({
        id: q.id,
        productId: q.product_id,
        buyerId: q.buyer_id,
        buyerName: q.buyer_name || undefined,
        buyerAvatar: q.buyer_avatar || undefined,
        buyerPhone: q.buyer_phone || undefined,
        buyerCompany: q.buyer_company || undefined,
        quantity: Number(q.quantity ?? 1),
        message: q.message ?? '',
        contact: q.contact ?? '',
        status: q.status ?? 'sent',
        reminderCount: Number(q.reminder_count ?? 0),
        createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
        updatedAt: q.updated_at ? new Date(q.updated_at).toISOString() : '',
      })),
    };
  }

  async createMarketplaceProduct(userId: string, data: any) {
    const id = data.id || `prod-${Date.now()}`;
    const sellerId = String(data.sellerId || userId || 'ceo1983');
    const title = (data.title || data.name || 'Sản phẩm mới').trim();
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
    const firstImage = imageUrls[0] || data.imageUrl || data.image || null;
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();
    const originalPrice = data.originalPrice !== undefined ? Number(data.originalPrice) : Number(data.price ?? 0);
    const memberPrice = data.memberPrice !== undefined ? Number(data.memberPrice) : Number(data.price ?? 0);
    const unit = data.unit || 'Gói';
    const currency = data.currency || 'VND';
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    const r = (await this.repo.insertProduct({
      id,
      sellerId,
      title,
      description: data.description ?? '',
      price: Number(data.price ?? 0),
      originalPrice,
      memberPrice,
      unit,
      currency,
      category: data.category ?? 'mk.cat.other',
      status: data.status ?? 'active',
      emoji: data.emoji ?? '🛍️',
      pdfUrl: data.pdfUrl ?? '',
      imageUrls,
      firstImage,
      company,
      websiteUrl: data.websiteUrl ?? '',
      facebookUrl: data.facebookUrl ?? '',
      assocId,
    })) || {};

    return {
      id: r.id || id,
      sellerId: r.seller_id,
      title: r.title || title,
      name: r.name || r.title || title,
      description: r.description ?? '',
      price: Number(r.price ?? 0),
      originalPrice,
      memberPrice,
      unit: r.unit || unit,
      currency: r.currency || currency,
      category: r.category ?? 'mk.cat.other',
      status: r.status ?? 'active',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      views: 0,
      emoji: r.emoji ?? '🛍️',
      pdfUrl: r.pdf_url ?? '',
      imageUrls: Array.isArray(r.image_urls) ? r.image_urls : (firstImage ? [firstImage] : []),
      imageUrl: firstImage,
      company: company || r.company || 'CLB Doanh Nhân CEO 1983',
      websiteUrl: r.website_url ?? '',
      facebookUrl: r.facebook_url ?? '',
    };
  }

  async updateMarketplaceProduct(userId: string, id: string, data: any) {
    const title = data.title || data.name;
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : null);
    const firstImage = imageUrls && imageUrls[0] ? imageUrls[0] : (data.imageUrl || null);
    const cleanPrice = data.price !== undefined ? Number(data.price) : null;
    const cleanOriginalPrice = data.originalPrice !== undefined ? Number(data.originalPrice) : null;
    const cleanMemberPrice = data.memberPrice !== undefined ? Number(data.memberPrice) : null;

    const r = await this.repo.updateProduct(id, {
      title,
      description: data.description,
      cleanPrice,
      cleanOriginalPrice,
      cleanMemberPrice,
      company: data.company,
      unit: data.unit,
      currency: data.currency,
      firstImage,
      imageUrls,
      category: data.category,
      status: data.status,
      emoji: data.emoji,
      pdfUrl: data.pdfUrl,
      websiteUrl: data.websiteUrl,
      facebookUrl: data.facebookUrl,
    });

    if (!r) return null;
    return {
      id: r.id,
      sellerId: r.seller_id,
      title: r.title,
      description: r.description ?? '',
      price: Number(r.price ?? 0),
      category: r.category ?? 'mk.cat.other',
      status: r.status ?? 'active',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
      views: Number(r.views ?? 0),
      emoji: r.emoji ?? '🛍️',
      pdfUrl: r.pdf_url ?? '',
      imageUrls: Array.isArray(r.image_urls) ? r.image_urls : [],
      websiteUrl: r.website_url ?? '',
      facebookUrl: r.facebook_url ?? '',
    };
  }

  async deleteMarketplaceProduct(userId: string, id: string) {
    await this.repo.deleteProduct(id);
    return { ok: true };
  }

  async toggleProductSold(userId: string, id: string) {
    const r = await this.repo.toggleProductSold(id);
    if (!r) return null;
    return { id: r.id, status: r.status };
  }

  async listProductQuotes(userId: string) {
    const rows = await this.repo.listProductQuotes();
    return rows.map((q) => ({
      id: q.id,
      productId: q.product_id,
      productTitle: q.product_title || undefined,
      productPrice: q.product_price ? Number(q.product_price) : undefined,
      buyerId: q.buyer_id,
      quantity: Number(q.quantity ?? 1),
      message: q.message ?? '',
      contact: q.contact ?? '',
      status: q.status ?? 'sent',
      reminderCount: Number(q.reminder_count ?? 0),
      createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
      updatedAt: q.updated_at ? new Date(q.updated_at).toISOString() : '',
    }));
  }

  async requestProductQuote(userId: string, data: any) {
    if (!data?.productId) {
      throw new BadRequestException('Vui lòng chỉ định sản phẩm cần gửi yêu cầu báo giá!');
    }

    let prodRows: any[] = [];
    let prodTitle = 'Sản phẩm Marketplace';
    let assocId = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
    try {
      prodRows = await this.repo.findProductForQuoteCheck(data.productId);
      if (prodRows && prodRows.length > 0) {
        const prod = prodRows[0];
        if (prod.title) prodTitle = prod.title;
        if (prod.association_id) assocId = prod.association_id;
        const uid = String(userId || '').trim().toLowerCase();
        const sellerId = String(prod.seller_id || '').trim().toLowerCase();
        const sellerUserId = String(prod.seller_user_id || '').trim().toLowerCase();
        const memberId = String(prod.member_id || '').trim().toLowerCase();

        if (uid && (uid === sellerId || uid === sellerUserId || uid === memberId)) {
          throw new BadRequestException('Bạn là người đăng sản phẩm này nên không thể tự gửi yêu cầu báo giá cho chính mình!');
        }
      }
    } catch (checkErr: any) {
      if (checkErr instanceof BadRequestException) throw checkErr;
    }

    const id = `quote-${Date.now()}`;
    let q: any = {
      id,
      product_id: data.productId,
      buyer_id: userId,
      quantity: Number(data.quantity ?? 1),
      message: data.message ?? '',
      contact: data.contact ?? '',
      status: 'sent',
      reminder_count: 0,
      created_at: new Date(),
    };

    try {
      const inserted = await this.repo.insertQuoteRequest({
        id,
        productId: data.productId,
        buyerId: userId,
        quantity: Number(data.quantity ?? 1),
        message: data.message,
        contact: data.contact,
      });
      if (inserted) q = inserted;
    } catch (e: any) {
      this.logger.warn('Fallback quote insert:', e?.message);
    }

    let buyerName = 'Thành viên ViOne Connect';
    let buyerPhone = data.contact || '';
    try {
      const buyer = await this.repo.findBuyerDetails(userId);
      if (buyer) {
        buyerName = buyer.name || buyerName;
        buyerPhone = buyerPhone || buyer.phone || '';
      }
    } catch {}

    try {
      await this.notifyAssociationAdmins(assocId, {
        title: `[CRM Báo giá] Yêu cầu báo giá mới: ${prodTitle}`,
        body: `Khách hàng/Hội viên ${buyerName} (SĐT: ${buyerPhone || 'Chưa cung cấp'}) gửi yêu cầu báo giá cho sản phẩm "${prodTitle}" (SL: ${data.quantity ?? 1}). Ghi chú: "${(data.message || '').slice(0, 120)}"`,
        targetRoute: '/marketplace',
        type: 'crm_quote_lead',
        sourceRecordId: id,
        meta: {
          leadType: 'quote_request',
          buyerId: userId,
          buyerName,
          buyerPhone,
          productId: data.productId,
          productTitle: prodTitle,
          quantity: data.quantity ?? 1,
          message: data.message,
          contact: data.contact,
        },
      });
    } catch (crmErr: any) {
      this.logger.warn('CRM quote notification dispatch error:', crmErr?.message);
    }

    try {
      if (prodRows.length > 0 && prodRows[0].seller_id) {
        const prod = prodRows[0];
        const targetUserId = prod.seller_user_id || prod.seller_id;
        const targetMemberId = prod.member_id || prod.seller_id;
        const notifTitle = 'Yêu cầu báo giá mới trên Marketplace';
        const notifBody = `Sản phẩm "${prod.title}" của bạn vừa nhận được yêu cầu báo giá (${data.quantity ?? 1} sản phẩm) từ ${buyerName} (SĐT: ${buyerPhone}): "${(data.message || '').slice(0, 100)}"`;
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          quoteId: id,
          productId: data.productId,
          targetRoute: `/marketplace`,
        });

        await this.repo.insertSellerQuoteNotifications(
          notifId,
          targetUserId,
          targetMemberId,
          id,
          notifTitle,
          notifBody,
          safeData,
        );

        this.gateway.emitNotification(String(targetUserId), {
          id: notifId,
          title: notifTitle,
          body: notifBody,
          action: { targetRoute: '/marketplace' },
          safeDisplayData: { title: notifTitle, body: notifBody },
        });
      }
    } catch (e: any) {
      this.logger.warn('Failed to send seller quote notification:', e?.message);
    }

    return {
      id: q.id,
      productId: q.product_id,
      buyerId: q.buyer_id,
      quantity: Number(q.quantity ?? 1),
      message: q.message ?? '',
      contact: q.contact ?? '',
      status: q.status ?? 'sent',
      reminderCount: 0,
      createdAt: q.created_at ? new Date(q.created_at).toISOString() : '',
    };
  }

  async updateQuoteStatus(userId: string, id: string, status: string) {
    const q = await this.repo.updateQuoteStatus(id, status);
    if (!q) return null;

    try {
      const notifTitle = 'Cập nhật trạng thái yêu cầu báo giá';
      const notifBody = `Yêu cầu báo giá #${id} của bạn đã chuyển sang trạng thái: ${status}.`;
      const notifId = crypto.randomUUID();
      const safeData = JSON.stringify({
        title: notifTitle,
        body: notifBody,
        quoteId: id,
        status,
        targetRoute: '/marketplace',
      });

      await this.repo.insertBuyerQuoteStatusNotification(
        notifId,
        q.buyer_id,
        id,
        status,
        notifTitle,
        notifBody,
        safeData,
      );

      this.gateway.emitNotification(String(q.buyer_id), {
        id: notifId,
        title: notifTitle,
        body: notifBody,
        action: { targetRoute: '/marketplace' },
        safeDisplayData: { title: notifTitle, body: notifBody },
      });
    } catch {}

    return { id: q.id, status: q.status };
  }

  async sendQuoteReminder(userId: string, id: string) {
    const q = await this.repo.incrementQuoteReminder(id);
    if (!q) return null;

    try {
      const prod = await this.repo.findProductTitleAndSeller(q.product_id);
      if (prod && prod.seller_id) {
        const notifTitle = 'Nhắc nhở phản hồi báo giá Marketplace';
        const notifBody = `Khách hàng đang chờ phản hồi báo giá cho sản phẩm "${prod.title}".`;
        const notifId = crypto.randomUUID();
        const safeData = JSON.stringify({
          title: notifTitle,
          body: notifBody,
          quoteId: id,
          targetRoute: '/marketplace',
        });

        await this.repo.insertSellerReminderNotification(
          notifId,
          prod.seller_id,
          id,
          notifTitle,
          notifBody,
          safeData,
        );

        this.gateway.emitNotification(String(prod.seller_id), {
          id: notifId,
          title: notifTitle,
          body: notifBody,
          action: { targetRoute: '/marketplace' },
          safeDisplayData: { title: notifTitle, body: notifBody },
        });
      }
    } catch {}

    return { id: q.id, reminderCount: Number(q.reminder_count ?? 1) };
  }

  async cancelQuote(userId: string, id: string, reason: string) {
    const q = await this.repo.cancelQuote(id, reason);
    if (!q) return null;
    return { id, status: 'cancelled', cancelReason: reason };
  }

  // ── Catalog Products ──────────────────────────────────────────────────
  async listActiveProducts() {
    try {
      const rows = await this.repo.listActiveProducts();
      if (rows.length === 0) return [];

      return rows.map((p) => {
        const numPrice = Number(p.price || p.sale_price || p.cost || 0);
        const formattedPrice = p.price_text || (numPrice > 0 ? `${numPrice.toLocaleString('vi-VN')} đ` : (p.price || 'Liên hệ báo giá'));
        const imgList = Array.isArray(p.image_urls) ? p.image_urls : (typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : []);
        const firstImg = (imgList && imgList.length > 0 ? imgList[0] : null) || p.image_url || p.image || null;
        return {
          id: String(p.id),
          name: p.name || p.title || 'Sản phẩm doanh nghiệp',
          title: p.title || p.name || 'Sản phẩm doanh nghiệp',
          company: p.seller_company || p.company || p.association_name || 'CLB Doanh Nhân CEO 1983',
          sellerName: p.seller_name || undefined,
          sellerAvatar: p.seller_avatar || undefined,
          sellerPhone: p.seller_phone || undefined,
          category: p.category || 'Sản phẩm & Dịch vụ',
          likes: Number(p.likes ?? 0),
          views: Number(p.views ?? 0),
          time: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
          imageUrl: firstImg,
          imageUrls: imgList.length > 0 ? imgList : (firstImg ? [firstImg] : []),
          price: formattedPrice,
          originalPrice: p.original_price ? `${Number(p.original_price).toLocaleString('vi-VN')} đ` : undefined,
          memberPrice: p.member_discount_price || p.member_price ? `${Number(p.member_discount_price || p.member_price).toLocaleString('vi-VN')} đ` : undefined,
          unit: p.unit || 'Gói',
          currency: p.currency || 'VND',
          sellerId: p.seller_id ? String(p.seller_id) : undefined,
        };
      });
    } catch {
      return [];
    }
  }

  async createProduct(userId: string, data: any) {
    const prodId = data.id || `PROD-${Date.now().toString(36).toUpperCase()}`;
    const name = (data.name || data.title || 'Sản phẩm mới').trim();
    const description = (data.description || '').trim();
    const company = (data.company || 'CLB Doanh Nhân CEO 1983').trim();
    const category = (data.category || 'Sản phẩm & Dịch vụ').trim();
    const price = Number(data.price || 0);
    const originalPrice = data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '' ? Number(data.originalPrice) : price;
    const memberPrice = data.memberPrice !== undefined && data.memberPrice !== null && data.memberPrice !== '' ? Number(data.memberPrice) : price;
    const unit = data.unit || 'Gói';
    const currency = data.currency || 'VND';
    const imageUrls: string[] = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []);
    const imageUrl = imageUrls[0] || data.imageUrl || null;
    const sellerId = String(data.sellerId || userId || 'ceo1983');
    const status = data.status || 'active';
    const assocId = data.associationId || 'c1983000-0000-4000-8000-000000001983';

    await this.repo.insertCatalogProduct(
      prodId,
      name,
      description,
      company,
      category,
      price,
      originalPrice,
      memberPrice,
      unit,
      currency,
      imageUrl,
      imageUrls,
      sellerId,
      status,
      assocId,
    );

    return { ok: true, id: prodId };
  }

  async updateProduct(userId: string, productId: string, data: any) {
    const name = data.name || data.title;
    const cleanPrice = data.price !== undefined && data.price !== null && data.price !== '' ? Number(data.price) : null;
    const cleanOriginalPrice = data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '' ? Number(data.originalPrice) : cleanPrice;
    const cleanMemberPrice = data.memberPrice !== undefined && data.memberPrice !== null && data.memberPrice !== '' ? Number(data.memberPrice) : cleanPrice;
    const imageUrls: string[] | null = Array.isArray(data.imageUrls) ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : null);
    const imageUrl = imageUrls && imageUrls[0] ? imageUrls[0] : (data.imageUrl || null);

    await this.repo.updateCatalogProduct(
      productId,
      name,
      data.description,
      data.company,
      data.category,
      cleanPrice,
      cleanOriginalPrice,
      cleanMemberPrice,
      data.unit,
      data.currency,
      imageUrl,
      imageUrls,
    );

    return { ok: true };
  }

  async deleteProduct(userId: string, productId: string) {
    await this.repo.deleteCatalogProduct(productId);
    return { ok: true };
  }
}
