// BC-Mobile-7E — Network feed DTO (presentation over the canonical Moment
// domain). No parallel post/feed backend: a feed item IS one owner-private
// Meeting Moment (business_relationship_moments) projected for the viewer.

export const BC_NETWORK_FEED_PAGE_SIZE = 12;
/** Ảnh hiển thị trong lưới; phần dư hiện dưới dạng "+N". */
export const BC_NETWORK_FEED_GRID_PHOTOS = 3;

export type BcNetworkFeedItem = {
  momentId: string;
  ownerUserId?: string | null;
  owner?: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    headline: string | null;
    companyName: string | null;
  } | null;
  target?: {
    personId: string;
    displayName: string | null;
    avatarUrl: string | null;
    headline: string | null;
    companyName: string | null;
  } | null;
  /** Opaque person id shared with 2A (`u:` | `c:` | `g:`). */
  personId: string;
  occurredAt: string;
  createdAt?: string | null;
  /** Tên sự kiện (dòng "ngày · địa điểm" ghép từ occurredAt + place). */
  eventName: string | null;
  placeLabel: string | null;
  /** Câu mô tả cuộc gặp. */
  note: string | null;
  /** URL ký ngắn hạn, tối đa 5 ảnh, theo thứ tự sort_order. */
  photoUrls: string[];
  photoCount: number;
  visibility?: "public" | "private" | "friends" | string | null;
};

export type BcNetworkFeedPage = {
  items: BcNetworkFeedItem[];
  nextCursor: string | null;
};
