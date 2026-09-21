// BC-Mobile-7B+ — Community news (bảng tin) contracts. Client-safe.
// Read-only projection of the canonical `news` table. No feed, no posting,
// no reactions, no comments.

export type CommunityNewsSummaryDTO = {
  /** Opaque reference (news.id). */
  newsRef: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  author: string | null;
  /** Canonical published label as stored (text) — never re-derived. */
  publishedLabel: string | null;
  views: number;
};

export type CommunityNewsPageDTO = {
  items: CommunityNewsSummaryDTO[];
  totalCount: number;
  nextOffset: number | null;
};

export type CommunityNewsDetailDTO = {
  news: CommunityNewsSummaryDTO;
  communityName: string;
};
