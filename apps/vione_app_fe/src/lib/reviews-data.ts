import { MEMBERS } from "./members-data";

export type Review = {
  id: string;
  sellerId: string;
  reviewerId: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string;
};

function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

const COMMENTS_VI = [
  "Hợp tác chuyên nghiệp, phản hồi nhanh và đúng cam kết.",
  "Sản phẩm chất lượng, ưu đãi tốt cho hội viên.",
  "Đội ngũ tư vấn nhiệt tình, sẽ tiếp tục đồng hành.",
  "Giao hàng đúng hẹn, đóng gói cẩn thận.",
  "Quy trình bài bản, đáng để giới thiệu trong hội.",
  "Giá cạnh tranh, dịch vụ hậu mãi tốt.",
];

const _cache = new Map<string, Review[]>();

export function getReviewsForSeller(sellerId: string): Review[] {
  if (_cache.has(sellerId)) return _cache.get(sellerId)!;
  const rnd = seed(sellerId + "-rev");
  const count = 3 + Math.floor(rnd() * 5);
  const others = MEMBERS.filter((m) => m.id !== sellerId);
  const list: Review[] = [];
  for (let i = 0; i < count; i++) {
    const reviewer = others[Math.floor(rnd() * others.length)];
    const rating = 3 + Math.floor(rnd() * 3); // 3..5
    list.push({
      id: `rv-${sellerId}-${i}`,
      sellerId,
      reviewerId: reviewer.id,
      rating,
      comment: COMMENTS_VI[Math.floor(rnd() * COMMENTS_VI.length)],
      createdAt: new Date(Date.now() - Math.floor(rnd() * 90) * 86400000).toISOString(),
    });
  }
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  _cache.set(sellerId, list);
  return list;
}

export function getReviewStats(sellerId: string) {
  const list = getReviewsForSeller(sellerId);
  const count = list.length;
  const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, avg };
}

export type Interaction = {
  id: string;
  type: "connect" | "message" | "quote" | "meeting" | "event";
  at: string;
  title: string;
  detail?: string;
};

const INT_POOL: Omit<Interaction, "id" | "at">[] = [
  { type: "connect", title: "Đã kết nối trong mạng lưới hội viên" },
  { type: "message", title: "Nhắn tin trao đổi", detail: "Đã trao đổi qua hộp thư hội viên." },
  { type: "quote", title: "Yêu cầu báo giá sản phẩm", detail: "Gửi RFQ qua trang Marketplace." },
  { type: "meeting", title: "Họp 1-1 trong sự kiện CEO Networking" },
  { type: "event", title: "Cùng tham dự Diễn đàn Doanh nghiệp 2026" },
  { type: "message", title: "Phản hồi câu hỏi hợp tác", detail: "Trả lời trong vòng 2 giờ." },
];

export function getInteractionsWith(sellerId: string): Interaction[] {
  const rnd = seed(sellerId + "-int");
  const count = 4 + Math.floor(rnd() * 4);
  const list: Interaction[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = INT_POOL[Math.floor(rnd() * INT_POOL.length)];
    list.push({
      id: `int-${sellerId}-${i}`,
      ...tpl,
      at: new Date(Date.now() - Math.floor(rnd() * 60) * 86400000 - i * 3600_000).toISOString(),
    });
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}
