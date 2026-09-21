export type MomentCommentAuthor = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  jobTitle: string | null;
  companyName: string | null;
};

export type MomentCommentMention = {
  userId: string;
  displayName: string;
};

export type MomentComment = {
  id: string;
  momentId: string;
  userId: string;
  parentId: string | null;
  content: string;
  photoUrl?: string | null;
  mentions: MomentCommentMention[];
  createdAt: string;
  author: MomentCommentAuthor;
  likesCount: number;
  userLiked: boolean;
  replies?: MomentComment[];
};

export type MomentCommentListResponse = {
  ok: boolean;
  momentId: string;
  totalComments: number;
  comments: MomentComment[];
};

export type MomentLikeStatus = {
  ok: boolean;
  momentId: string;
  likesCount: number;
  userLiked: boolean;
  commentsCount: number;
};

export type MentionableUser = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  initials: string;
  jobTitle: string | null;
  companyName: string | null;
};
