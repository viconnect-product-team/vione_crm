import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export class CreateReviewDto {
  sellerId!: string;
  reviewerId?: string;
  rating!: number;
  comment!: string;
  reviewType?: 'service' | 'event' | 'networking';
}

export class UpdateReviewDto {
  rating?: number;
  comment?: string;
  reviewType?: 'service' | 'event' | 'networking';
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async listReviews(sellerId: string) {
    if (!sellerId) return { reviews: [], stats: { count: 0, avg: 0 } };

    const rows: any[] = await this.prisma.$queryRaw<any[]>`
      SELECT id, seller_id, reviewer_id, reviewer_name, rating, comment, review_type, created_at
      FROM public.reviews
      WHERE seller_id = ${sellerId}
      ORDER BY created_at DESC
    `.catch(() => [] as any[]);

    const reviews = rows.map((r) => ({
      id: r.id,
      sellerId: r.seller_id,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name || 'Hội viên',
      rating: Number(r.rating || 5),
      comment: r.comment || '',
      reviewType: r.review_type || 'service',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));

    const count = reviews.length;
    const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    return { reviews, stats: { count, avg: Number(avg.toFixed(1)) } };
  }

  async addReview(userId: string, data: CreateReviewDto) {
    if (!data.sellerId || !data.comment) {
      throw new BadRequestException('sellerId and comment are required');
    }
    const id = crypto.randomUUID();
    const reviewerId = data.reviewerId || userId;

    // Get reviewer name
    const memberRows = await this.prisma.$queryRaw<any[]>`
      SELECT name FROM public.members WHERE id = ${reviewerId}::uuid OR user_id = ${userId}::uuid LIMIT 1
    `.catch(() => [] as any[]);
    const reviewerName = memberRows[0]?.name || 'Hội viên ViOne';

    const inserted = await this.prisma.$queryRaw<any[]>`
      INSERT INTO public.reviews (id, seller_id, reviewer_id, reviewer_name, rating, comment, review_type, created_at)
      VALUES (${id}::uuid, ${data.sellerId}, ${reviewerId}, ${reviewerName}, ${data.rating || 5}, ${data.comment}, ${data.reviewType || 'service'}, now())
      RETURNING id, seller_id, reviewer_id, reviewer_name, rating, comment, review_type, created_at
    `.catch(() => [] as any[]);

    const r = inserted[0] || {
      id,
      seller_id: data.sellerId,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      rating: data.rating,
      comment: data.comment,
      review_type: data.reviewType || 'service',
      created_at: new Date(),
    };

    return {
      id: r.id,
      sellerId: r.seller_id,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name,
      rating: Number(r.rating),
      comment: r.comment,
      reviewType: r.review_type,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async updateReview(userId: string, id: string, data: UpdateReviewDto) {
    await this.prisma.$executeRaw`
      UPDATE public.reviews
      SET rating = COALESCE(${data.rating}, rating),
          comment = COALESCE(${data.comment}, comment),
          review_type = COALESCE(${data.reviewType}, review_type)
      WHERE id = ${id}::uuid
    `.catch(() => {});

    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, seller_id, reviewer_id, reviewer_name, rating, comment, review_type, created_at
      FROM public.reviews WHERE id = ${id}::uuid LIMIT 1
    `.catch(() => [] as any[]);

    if (rows.length === 0) throw new NotFoundException('Review not found');
    const r = rows[0];
    return {
      id: r.id,
      sellerId: r.seller_id,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name,
      rating: Number(r.rating),
      comment: r.comment,
      reviewType: r.review_type,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async deleteReview(userId: string, id: string) {
    await this.prisma.$executeRaw`
      DELETE FROM public.reviews WHERE id = ${id}::uuid
    `.catch(() => {});
    return { ok: true };
  }
}
