// BC-Mobile-7B+ — Community news server adapter. SERVER ONLY.
// Reads the canonical `news` table with the REQUEST-SCOPED client only
// (news_select_assoc RLS = member of the association). Published rows only.
// Zero writes, zero cross-domain effects, no privileged client.

import type {
  CommunityNewsDetailDTO,
  CommunityNewsPageDTO,
  CommunityNewsSummaryDTO,
} from "./community-news.types";

type AnyClient = { from: (table: string) => any };

export const COMMUNITY_NEWS_PAGE_SIZE = 10;

const NEWS_SELECT = "id, title, excerpt, category, author, published_at, views, status, created_at";

type NewsRow = {
  id: string;
  title: string | null;
  excerpt: string | null;
  category: string | null;
  author: string | null;
  published_at: string | null;
  views: number | null;
  status: string | null;
};

function clean(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  return v.length === 0 || v === "—" ? null : v;
}

export function mapCommunityNews(row: NewsRow): CommunityNewsSummaryDTO {
  return {
    newsRef: row.id,
    title: clean(row.title) ?? "",
    excerpt: clean(row.excerpt),
    category: clean(row.category),
    author: clean(row.author),
    publishedLabel: clean(row.published_at),
    views: typeof row.views === "number" && row.views > 0 ? row.views : 0,
  };
}

async function requireCommunityMembership(
  user: AnyClient,
  viewerId: string,
  communityId: string,
): Promise<boolean> {
  const { data, error } = await user
    .from("memberships")
    .select("association_id")
    .eq("user_id", viewerId)
    .eq("association_id", communityId)
    .maybeSingle();
  return !error && !!data;
}

export async function listCommunityNews(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  offset?: number;
}): Promise<CommunityNewsPageDTO | null> {
  const { user, viewerId, communityId } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const offset = Math.max(0, input.offset ?? 0);
  const { data, error, count } = await user
    .from("news")
    .select(NEWS_SELECT, { count: "exact" })
    .eq("association_id", communityId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + COMMUNITY_NEWS_PAGE_SIZE - 1);

  if (error) throw new Error("community_news_unavailable");

  const rows = (data ?? []) as NewsRow[];
  const items = rows.map(mapCommunityNews);
  const totalCount = typeof count === "number" ? count : offset + items.length;
  const nextOffset =
    items.length === COMMUNITY_NEWS_PAGE_SIZE && offset + items.length < totalCount
      ? offset + items.length
      : null;

  return { items, totalCount, nextOffset };
}

export async function getCommunityNewsDetail(input: {
  user: AnyClient;
  viewerId: string;
  communityId: string;
  newsRef: string;
}): Promise<CommunityNewsDetailDTO | null> {
  const { user, viewerId, communityId, newsRef } = input;
  if (!(await requireCommunityMembership(user, viewerId, communityId))) return null;

  const { data, error } = await user
    .from("news")
    .select(NEWS_SELECT)
    .eq("association_id", communityId)
    .eq("status", "published")
    .eq("id", newsRef)
    .maybeSingle();
  if (error || !data) return null;

  const { data: community } = await user
    .from("associations")
    .select("name")
    .eq("id", communityId)
    .maybeSingle();

  return {
    news: mapCommunityNews(data as NewsRow),
    communityName: ((community as { name?: string } | null)?.name ?? "").trim(),
  };
}
