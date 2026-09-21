// BC-Mobile — Moment comments & likes hook with real-time WebSocket sync.

import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMomentComments,
  createMomentComment,
  deleteMomentComment,
  toggleMomentCommentLike,
  getMomentLikeStatus,
  toggleMomentLike,
} from "@/lib/business-connect/mobile/moment-comments.functions";
import type { MomentComment, MomentCommentListResponse } from "@/lib/business-connect/mobile/moment-comments.types";
import { useConnectAppSocket } from "./use-connect-app-socket";
import { useViewerUserId } from "./use-viewer-user-id";

export const momentCommentKeys = {
  root: ["bc-mobile", "moment-comments"] as const,
  detail: (momentId: string) => [...momentCommentKeys.root, momentId] as const,
  likeStatus: (momentId: string) => ["bc-mobile", "moment-likes", momentId] as const,
};

export function useMomentComments(momentId: string) {
  const queryClient = useQueryClient();
  const viewerUserId = useViewerUserId();
  const socket = useConnectAppSocket(`moment:${momentId}`);

  // 1. Comments query
  const commentsQuery = useQuery({
    queryKey: momentCommentKeys.detail(momentId),
    queryFn: () => listMomentComments(momentId),
    enabled: Boolean(momentId),
    staleTime: 10_000,
  });

  // 2. Like status query
  const likeStatusQuery = useQuery({
    queryKey: momentCommentKeys.likeStatus(momentId),
    queryFn: () => getMomentLikeStatus(momentId),
    enabled: Boolean(momentId),
    staleTime: 10_000,
  });

  // 3. Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket || !momentId) return;

    const handleCommentAdded = (data: { momentId: string; comment: MomentComment }) => {
      if (data.momentId !== momentId) return;
      queryClient.setQueryData<MomentCommentListResponse>(
        momentCommentKeys.detail(momentId),
        (old) => {
          if (!old) return { ok: true, momentId, totalComments: 1, comments: [data.comment] };
          
          // Check if already present (e.g. from optimistic update)
          const existsRecursive = (list: MomentComment[]): boolean => {
            for (const item of list) {
              if (item.id === data.comment.id) return true;
              if (item.replies && existsRecursive(item.replies)) return true;
            }
            return false;
          };

          if (existsRecursive(old.comments)) return old;

          // If Level 1 root comment
          if (!data.comment.parentId) {
            return {
              ...old,
              totalComments: old.totalComments + 1,
              comments: [...old.comments, data.comment],
            };
          }

          // If reply, find parent
          const insertReply = (list: MomentComment[]): MomentComment[] => {
            return list.map((item) => {
              if (item.id === data.comment.parentId) {
                return {
                  ...item,
                  replies: [...(item.replies || []), data.comment],
                };
              }
              if (item.replies && item.replies.length > 0) {
                return {
                  ...item,
                  replies: insertReply(item.replies),
                };
              }
              return item;
            });
          };

          return {
            ...old,
            totalComments: old.totalComments + 1,
            comments: insertReply(old.comments),
          };
        },
      );
      // Invalidate like status to update comments count
      queryClient.invalidateQueries({ queryKey: momentCommentKeys.likeStatus(momentId) });
    };

    const handleCommentDeleted = (data: { momentId: string; commentId: string }) => {
      if (data.momentId !== momentId) return;
      queryClient.setQueryData<MomentCommentListResponse>(
        momentCommentKeys.detail(momentId),
        (old) => {
          if (!old) return old;
          const removeRecursive = (list: MomentComment[]): MomentComment[] => {
            return list
              .filter((c) => c.id !== data.commentId)
              .map((c) => ({
                ...c,
                replies: c.replies ? removeRecursive(c.replies) : [],
              }));
          };
          return {
            ...old,
            totalComments: Math.max(0, old.totalComments - 1),
            comments: removeRecursive(old.comments),
          };
        },
      );
    };

    const handleCommentLiked = (data: {
      momentId: string;
      commentId: string;
      likesCount: number;
      userId: string;
      liked: boolean;
    }) => {
      if (data.momentId !== momentId) return;
      queryClient.setQueryData<MomentCommentListResponse>(
        momentCommentKeys.detail(momentId),
        (old) => {
          if (!old) return old;
          const updateLike = (list: MomentComment[]): MomentComment[] => {
            return list.map((c) => {
              if (c.id === data.commentId) {
                return {
                  ...c,
                  likesCount: data.likesCount,
                  userLiked: data.userId === viewerUserId ? data.liked : c.userLiked,
                };
              }
              if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: updateLike(c.replies),
                };
              }
              return c;
            });
          };
          return { ...old, comments: updateLike(old.comments) };
        },
      );
    };

    const handleMomentLiked = (data: {
      momentId: string;
      likesCount: number;
      userId: string;
      liked: boolean;
    }) => {
      if (data.momentId !== momentId) return;
      queryClient.setQueryData(momentCommentKeys.likeStatus(momentId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          likesCount: data.likesCount,
          userLiked: data.userId === viewerUserId ? data.liked : old.userLiked,
        };
      });
    };

    socket.on("moment:comment_added", handleCommentAdded);
    socket.on("moment:comment_deleted", handleCommentDeleted);
    socket.on("moment:comment_liked", handleCommentLiked);
    socket.on("moment:liked", handleMomentLiked);

    return () => {
      socket.off("moment:comment_added", handleCommentAdded);
      socket.off("moment:comment_deleted", handleCommentDeleted);
      socket.off("moment:comment_liked", handleCommentLiked);
      socket.off("moment:liked", handleMomentLiked);
    };
  }, [socket, momentId, queryClient, viewerUserId]);

  // 4. Mutations
  const addCommentMutation = useMutation({
    mutationFn: (input: { parentId?: string | null; content: string; mentions?: any[] }) =>
      createMomentComment(momentId, input),
    onSuccess: (res) => {
      if (res.ok && res.comment) {
        // Query cache will also receive socket event; we can eagerly invalidate or set
        queryClient.invalidateQueries({ queryKey: momentCommentKeys.detail(momentId) });
      }
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteMomentComment(momentId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentCommentKeys.detail(momentId) });
    },
  });

  const toggleCommentLikeMutation = useMutation({
    mutationFn: (commentId: string) => toggleMomentCommentLike(momentId, commentId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.setQueryData<MomentCommentListResponse>(
          momentCommentKeys.detail(momentId),
          (old) => {
            if (!old) return old;
            const updateLike = (list: MomentComment[]): MomentComment[] => {
              return list.map((c) => {
                if (c.id === res.commentId) {
                  return {
                    ...c,
                    likesCount: res.likesCount,
                    userLiked: res.liked,
                  };
                }
                if (c.replies && c.replies.length > 0) {
                  return {
                    ...c,
                    replies: updateLike(c.replies),
                  };
                }
                return c;
              });
            };
            return { ...old, comments: updateLike(old.comments) };
          },
        );
      }
    },
  });

  const toggleMomentLikeMutation = useMutation({
    mutationFn: () => toggleMomentLike(momentId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: momentCommentKeys.likeStatus(momentId) });
      const prev = queryClient.getQueryData(momentCommentKeys.likeStatus(momentId)) as any;
      if (prev) {
        const nextLiked = !prev.userLiked;
        const nextCount = nextLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1);
        queryClient.setQueryData(momentCommentKeys.likeStatus(momentId), {
          ...prev,
          userLiked: nextLiked,
          likesCount: nextCount,
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(momentCommentKeys.likeStatus(momentId), context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: momentCommentKeys.likeStatus(momentId) });
    },
  });

  return {
    comments: commentsQuery.data?.comments ?? [],
    totalComments: commentsQuery.data?.totalComments ?? (likeStatusQuery.data?.commentsCount ?? 0),
    isLoadingComments: commentsQuery.isLoading,
    likesCount: likeStatusQuery.data?.likesCount ?? 0,
    userLiked: Boolean(likeStatusQuery.data?.userLiked),
    addComment: addCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutateAsync,
    toggleCommentLike: toggleCommentLikeMutation.mutateAsync,
    toggleMomentLike: toggleMomentLikeMutation.mutate,
    isLikingMoment: toggleMomentLikeMutation.isPending,
  };
}
