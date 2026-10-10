import { z } from "zod";
import { MomentCategory } from "../enums/categories.enum.js";

export const CreateMomentSchema = z.object({
  content: z.string().min(1, "Nội dung bài viết không được để trống"),
  category: z.nativeEnum(MomentCategory).optional(),
  photoUrls: z.array(z.string().url("URL ảnh không hợp lệ")).max(9, "Tối đa 9 ảnh").optional(),
  taggedUserIds: z.array(z.string().uuid("User ID không hợp lệ")).optional(),
});

export type CreateMomentDto = z.infer<typeof CreateMomentSchema>;

export const CommentMomentSchema = z.object({
  momentId: z.string().uuid("Moment ID không hợp lệ"),
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  photoUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

export type CommentMomentDto = z.infer<typeof CommentMomentSchema>;
