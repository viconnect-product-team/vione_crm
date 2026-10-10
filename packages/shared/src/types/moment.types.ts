import { MomentCategory } from "../enums/categories.enum.js";

export interface SharedMomentMedia {
  id: string;
  momentId: string;
  mediaType: "image" | "video";
  url: string;
  order: number;
}

export interface SharedMomentComment {
  id: string;
  momentId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  photoUrl?: string;
  parentId?: string;
  likesCount: number;
  isLiked?: boolean;
  createdAt: string;
  replies?: SharedMomentComment[];
}

export interface SharedMoment {
  id: string;
  authorId: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorAvatar?: string;
  content: string;
  category?: MomentCategory;
  media: SharedMomentMedia[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  taggedUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMomentPayload {
  content: string;
  category?: MomentCategory;
  photoUrls?: string[];
  taggedUserIds?: string[];
}
