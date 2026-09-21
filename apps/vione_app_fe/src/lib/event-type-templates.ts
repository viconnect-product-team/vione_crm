export type EventTypeKey = "forum" | "workshop" | "networking" | "training";

export interface EventTypeTemplate {
  key: EventTypeKey;
  label: string;
  name: string;
  badge: string;
  tagline: string;
  themeGradient: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  accentColor: string;
  bgImage: string;
  defaultLocation: string;
  defaultCapacity: string;
  description: string;
  defaultTicketName: string;
  defaultTicketPrice: string;
}

export const EVENT_TYPE_TEMPLATES: Record<EventTypeKey, EventTypeTemplate> = {
  forum: {
    key: "forum",
    label: "Diễn đàn Thượng đỉnh (Forum)",
    name: "DIỄN ĐÀN DOANH NHÂN TIÊN PHONG 2026: BỨT PHÁ TĂNG TRƯỞNG & ĐỔI MỚI SỐ",
    badge: "🏛️ DIỄN ĐÀN THƯỢNG ĐỈNH DOANH NHÂN",
    tagline: "Quy tụ 200+ Lãnh đạo, Chủ tịch & CEO dẫn dắt tương lai kinh tế",
    themeGradient: "linear-gradient(135deg, #071322 0%, #003B95 55%, #0A2540 100%)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeText: "#F59E0B",
    textColor: "#FFFFFF",
    accentColor: "#F59E0B",
    bgImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Khách sạn JW Marriott Hanoi - Grand Ballroom, Mễ Trì, Nam Từ Liêm, Hà Nội",
    defaultCapacity: "250",
    description: "Hội nghị cấp cao thường niên của CLB Doanh Nhân CEO 1983 tập trung vào chiến lược tái cấu trúc, ứng dụng AI & chuyển đổi số toàn diện cho doanh nghiệp.",
    defaultTicketName: "Vé Diễn Đàn C-Level (Bao gồm Tea-break & Tài liệu)",
    defaultTicketPrice: "0",
  },
  workshop: {
    key: "workshop",
    label: "Hội thảo Chuyên đề (Workshop)",
    name: "HỘI THẢO MASTERCLASS: TỐI ƯU HỆ THỐNG VẬN HÀNH & QUẢN TRỊ TÀI CHÍNH C-LEVEL",
    badge: "⚡ WORKSHOP THỰC CHIẾN CHUYÊN SÂU",
    tagline: "Chiến lược thực thi & Case study giải pháp cùng các Chuyên gia Cố vấn",
    themeGradient: "linear-gradient(135deg, #042F2E 0%, #0D9488 55%, #115E59 100%)",
    badgeBg: "rgba(52, 211, 153, 0.2)",
    badgeText: "#34D399",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
    bgImage: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Trung tâm Đổi mới Sáng tạo Quốc gia (NIC), Cầu Giấy, Hà Nội",
    defaultCapacity: "100",
    description: "Phiên làm việc chuyên sâu phân tích chiến lược tối ưu dòng tiền, chuẩn hóa quy trình SOP và tự động hóa báo cáo quản trị.",
    defaultTicketName: "Vé Workshop Thực Chiến (Tặng bộ Template Quản trị)",
    defaultTicketPrice: "0",
  },
  networking: {
    key: "networking",
    label: "Dạ tiệc Kết nối B2B (Networking / Gala)",
    name: "DẠ TIỆC GALA KẾT NỐI DOANH NHÂN CEO 1983: GIAO THƯƠNG & XÚC TIẾN B2B",
    badge: "🌟 DẠ TIỆC KẾT NỐI THƯƠNG MẠI LUXURY",
    tagline: "Đêm tiệc kết nối đỉnh cao, vinh danh đối tác & Vòng quay may mắn",
    themeGradient: "linear-gradient(135deg, #3A1005 0%, #B45309 55%, #78350F 100%)",
    badgeBg: "rgba(251, 191, 36, 0.25)",
    badgeText: "#FBBF24",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    bgImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "InterContinental Hanoi Landmark72, Phạm Hùng, Hà Nội",
    defaultCapacity: "180",
    description: "Đêm tiệc Networking sang trọng kết hợp chương trình Vòng quay may mắn (Lucky Draw), trao kỷ niệm chương và ký kết xúc tiến thương mại.",
    defaultTicketName: "Vé VIP Gala Dinner (Bao gồm Tiệc tối & Rượu vang)",
    defaultTicketPrice: "500000",
  },
  training: {
    key: "training",
    label: "Đào tạo Huấn luyện (Executive Training)",
    name: "CHƯƠNG TRÌNH HUẤN LUYỆN LÃNH ĐẠO: NÂNG TẦM BẢN LĨNH & TƯ DUY CHIẾN LƯỢC",
    badge: "🎓 EXECUTIVE TRAINING ACADEMY",
    tagline: "Đào tạo đặc quyền dành riêng cho Hội viên CLB Doanh Nhân CEO 1983",
    themeGradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 55%, #312E81 100%)",
    badgeBg: "rgba(167, 139, 250, 0.25)",
    badgeText: "#A78BFA",
    textColor: "#FFFFFF",
    accentColor: "#A78BFA",
    bgImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Hội trường Diamond Hall, Tòa nhà CEO Tower, Phạm Hùng, Hà Nội",
    defaultCapacity: "120",
    description: "Khóa đào tạo chuyên sâu về kỹ năng đàm phán thương vụ lớn, truyền cảm hứng đội ngũ và xây dựng văn hóa doanh nghiệp bền vững.",
    defaultTicketName: "Vé Huấn Luyện C-Level (Chứng nhận hoàn thành)",
    defaultTicketPrice: "0",
  },
};
