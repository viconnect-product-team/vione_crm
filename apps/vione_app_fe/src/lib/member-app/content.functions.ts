import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { relTime, fmtDate } from "./shared";
import { fetchNestApiFromServer } from "@/lib/api-client";

// ---------- News ----------
export type NewsItem = {
  id: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  time: string;
  views: number;
  image?: string;
};

const DEFAULT_NEWS_IMAGES = [
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80",
];

export const listNews = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }: any): Promise<NewsItem[]> => {
    try {
      const token = context?.token;
      const items = await fetchNestApiFromServer<any[]>("/content/news", token);
      return (items ?? []).map((n: any, idx: number) => ({
        id: n.id,
        title: n.title,
        category: n.category ?? "",
        author: n.author ?? "",
        excerpt: n.excerpt ?? "",
        time: relTime(n.time || n.created_at || n.createdAt),
        views: n.views ?? 0,
        image: n.image || n.thumbnail || n.cover_url || n.cover_image || DEFAULT_NEWS_IMAGES[idx % DEFAULT_NEWS_IMAGES.length],
      }));
    } catch {
      return [];
    }
  });

export type LibraryDoc = {
  id: string;
  name: string;
  category: string;
  size: string;
  type: string;
  time: string;
  url?: string;
  description?: string;
  chapters?: string[];
};

const DEFAULT_CEO1983_DOCS: LibraryDoc[] = [
  {
    id: "doc-1",
    name: "Điều lệ hoạt động CLB Doanh Nhân CEO 1983 (Ban hành 2026)",
    category: "Pháp lý & Điều lệ",
    size: "3.2 MB",
    type: "PDF",
    time: "15/08/2026",
    description: "Văn bản pháp lý nền tảng quy định tôn chỉ, mục đích, cơ cấu điều hành và quyền lợi cốt lõi của các thành viên CLB Doanh Nhân CEO 1983.",
    chapters: [
      "Chương I: Tôn chỉ, mục đích và tư cách pháp nhân",
      "Chương II: Tiêu chuẩn, quyền lợi và nghĩa vụ hội viên",
      "Chương III: Tổ chức bộ máy Ban Thường Trực và Ban Chấp Hành",
      "Chương IV: Quản lý tài chính, quỹ tương trợ và xúc tiến thương mại",
    ],
  },
  {
    id: "doc-2",
    name: "Quy chế kết nối giao thương B2B & Xúc tiến thương mại nội khối",
    category: "Quy chế nội bộ",
    size: "2.4 MB",
    type: "PDF",
    time: "02/09/2026",
    description: "Quy chuẩn văn hóa trao đổi cơ hội kinh doanh, giới thiệu sản phẩm và bảo vệ quyền lợi hội viên trong các giao dịch hợp tác đầu tư.",
    chapters: [
      "Điều 1: Nguyên tắc ưu tiên kết nối và giao dịch nội khối",
      "Điều 2: Tiêu chuẩn xác thực sản phẩm, dịch vụ niêm yết",
      "Điều 3: Cơ chế phản hồi, đánh giá tín nhiệm đối tác",
      "Điều 4: Thẩm định hợp đồng và giải quyết tranh chấp",
    ],
  },
  {
    id: "doc-3",
    name: "Sổ tay hướng dẫn sử dụng ứng dụng ViOne & Thẻ VIP NFC",
    category: "Hướng dẫn & Cẩm nang",
    size: "4.8 MB",
    type: "PDF",
    time: "05/09/2026",
    description: "Cẩm nang hướng dẫn chạm thẻ thông minh trao đổi danh thiếp, quét mã QR sự kiện, đăng tải sản phẩm và trao đổi cơ hội kinh doanh.",
    chapters: [
      "Phần 1: Kích hoạt tài khoản và cấu hình hồ sơ cá nhân / doanh nghiệp",
      "Phần 2: Sử dụng thẻ thông minh NFC và QR cá nhân hóa",
      "Phần 3: Đăng tải sản phẩm và tiếp nhận yêu cầu báo giá B2B",
      "Phần 4: Tạo sự kiện và kiểm soát vé mời qua QR Code",
    ],
  },
  {
    id: "doc-4",
    name: "Hồ sơ năng lực liên minh doanh nghiệp CEO 1983 - Profile 2026",
    category: "Hồ sơ doanh nghiệp",
    size: "8.5 MB",
    type: "PDF",
    time: "10/09/2026",
    description: "Tập hợp năng lực sản xuất, giải pháp công nghệ, tiềm lực tài chính và mạng lưới đối tác của hơn 100 doanh nghiệp tiêu biểu trong CLB.",
    chapters: [
      "Khối 1: Công nghệ, Viễn thông & Chuyển đổi số",
      "Khối 2: Bất động sản, Xây dựng & Vật liệu mới",
      "Khối 3: Sản xuất, Xuất nhập khẩu & Chuỗi cung ứng",
      "Khối 4: Tài chính, Luật & Dịch vụ doanh nghiệp",
    ],
  },
];

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }: any): Promise<LibraryDoc[]> => {
    try {
      const token = context?.token;
      const res = await fetchNestApiFromServer<any[]>("/documents", token);
      if (Array.isArray(res) && res.length > 0) {
        return res.map((d: any) => ({
          id: d.id,
          name: d.name || d.title,
          category: d.category ?? "Tài liệu",
          size: d.size ?? "2.4 MB",
          type: d.type ?? "PDF",
          time: fmtDate(d.uploadedAt || d.uploaded_at) ?? "10/08/2026",
          description: d.description || d.summary,
          url: d.url || d.fileUrl || d.file_url,
          chapters: d.chapters,
        }));
      }
    } catch {
      // ignore
    }
    return DEFAULT_CEO1983_DOCS;
  });

// ---------- Perks / Tiện ích ----------
export type Perk = {
  id: string;
  title: string;
  category: string;
  partner: string;
  summary: string;
  description: string;
  discount: string;
  icon: string;
  link: string;
  validUntil: string | null;
};

function mapPerk(p: any): Perk {
  return {
    id: p.id,
    title: p.title,
    category: p.category ?? "",
    partner: p.partner ?? "",
    summary: p.summary ?? "",
    description: p.description ?? "",
    discount: p.discount ?? "",
    icon: p.icon ?? "Gift",
    link: p.link ?? "",
    validUntil: fmtDate(p.validUntil || p.valid_until),
  };
}

export const listPerks = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .handler(async ({ context }: any): Promise<Perk[]> => {
    try {
      const token = context?.token;
      const items = await fetchNestApiFromServer<any[]>("/content/perks", token);
      return (items ?? []).map((r: any) => mapPerk(r));
    } catch {
      return [];
    }
  });

export const getPerk = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }: any): Promise<Perk | null> => {
    try {
      const token = context?.token;
      const row = await fetchNestApiFromServer<any>("/content/perks/" + data.id, token);
      return row ? mapPerk(row) : null;
    } catch {
      return null;
    }
  });
