import { fetchNestApi } from "@/lib/api-client";
import type {
  MomentComment,
  MomentCommentListResponse,
  MomentLikeStatus,
  MentionableUser,
} from "./moment-comments.types";

export async function listMomentComments(momentId: string): Promise<MomentCommentListResponse> {
  return fetchNestApi<MomentCommentListResponse>(`/connect-app/moments/${momentId}/comments`).catch(() => ({
    ok: false,
    momentId,
    totalComments: 0,
    comments: [],
  }));
}

export async function createMomentComment(
  momentId: string,
  input: { parentId?: string | null; content: string; photoUrl?: string | null; mentions?: any[] },
): Promise<{ ok: boolean; comment: MomentComment }> {
  return fetchNestApi<{ ok: boolean; comment: MomentComment }>(
    `/connect-app/moments/${momentId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function deleteMomentComment(
  momentId: string,
  commentId: string,
): Promise<{ ok: boolean; commentId: string }> {
  return fetchNestApi<{ ok: boolean; commentId: string }>(
    `/connect-app/moments/${momentId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
  );
}

export async function toggleMomentCommentLike(
  momentId: string,
  commentId: string,
): Promise<{ ok: boolean; commentId: string; liked: boolean; likesCount: number }> {
  return fetchNestApi<{ ok: boolean; commentId: string; liked: boolean; likesCount: number }>(
    `/connect-app/moments/${momentId}/comments/${commentId}/like`,
    {
      method: "POST",
    },
  );
}

export async function getMomentLikeStatus(momentId: string): Promise<MomentLikeStatus> {
  return fetchNestApi<MomentLikeStatus>(`/connect-app/moments/${momentId}/likes`).catch(() => ({
    ok: false,
    momentId,
    likesCount: 0,
    userLiked: false,
    commentsCount: 0,
  }));
}

export async function toggleMomentLike(
  momentId: string,
): Promise<{ ok: boolean; momentId: string; liked: boolean; likesCount: number }> {
  return fetchNestApi<{ ok: boolean; momentId: string; liked: boolean; likesCount: number }>(
    `/connect-app/moments/${momentId}/like`,
    {
      method: "POST",
    },
  );
}

export async function searchMentionableUsers(query: string): Promise<MentionableUser[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  return fetchNestApi<MentionableUser[]>(`/connect-app/moments/mentionable-users${qs}`).catch(() => []);
}
