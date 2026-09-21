import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Bookmark,
  Check,
  Clock,
  MapPin,
  QrCode,
  Users,
  Flame,
  X,
  Info,
  Eye,
  Calendar,
  Ticket,
  Building2,
  Briefcase,
  Phone,
  Mail,
  User,
  FileText,
  CreditCard,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ExternalLink,
  Trophy,
  GraduationCap,
  Handshake,
  Coffee,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listMyEvents, registerForEvent, cancelEventRegistration, getMyMember, type MyEvent, type MyMember } from "@/lib/member-app.functions";
import { resolveMediaUrl } from "@/lib/api-client";
import { formatDisplayDate } from "@/lib/date-format";
import { useT, useLang } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import eventImg from "@/assets/vba-event.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EventCountdownBanner } from "@/components/events/EventCountdownTimer";

export const Route = createFileRoute("/association/events")({
  component: EventsScreen,
});

const defaultEventImages = [
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80",
];

export interface EventAgendaInfo {
  category: string;
  subtitle: string;
  headline: string;
  desc: string;
  schedule: { time: string; activity: string }[];
  speakers: string[];
  audience: string;
  zaloLink: string;
  offer: string;
  regLink: string;
}

const EVENT_AGENDA: Record<string, EventAgendaInfo> = {
  "ev-1": {
    category: "ĐẠI HỘI TOÀN THỂ",
    subtitle: "KẾ THỪA GIÁ TRỊ · KIẾN TẠO TƯƠNG LAI · PHÁT TRIỂN BỀN VỮNG",
    headline: "Đại hội Hội viên CLB CEO 1983 & Tuyên dương Doanh nghiệp Tiêu biểu 2026",
    desc: "Đại hội toàn thể các thành viên CLB Doanh Nhân 1983 nhằm đánh giá chặng đường phát triển, vinh danh doanh nghiệp tiêu biểu và công bố chiến lược chuyển đổi số trong kỷ nguyên mới.\n\nSự kiện quy tụ đại diện các cơ quan quản lý, hiệp hội doanh nghiệp và hàng trăm doanh nhân tiêu biểu trong cả nước cùng tham dự.",
    schedule: [
      { time: "07:00 - 08:00", activity: "Đón tiếp đại biểu, Check-in QR & Trưng bày giao thương B2B" },
      { time: "08:00 - 09:30", activity: "Khai mạc Đại Hội & Báo cáo kết quả hoạt động nhiệm kỳ" },
      { time: "09:30 - 10:45", activity: "Tọa đàm: Chiến lược doanh nghiệp vươn mình ra biển lớn" },
      { time: "10:45 - 11:30", activity: "Ký kết giao thương & Trao chứng nhận hội viên danh dự" },
      { time: "11:30 - 13:00", activity: "Tiệc trưa kết nối Networking & Giao lưu mở rộng" },
    ],
    speakers: ["Chủ tịch CLB Doanh Nhân CEO 1983", "Chuyên gia Kinh tế trưởng Viện Quản lý", "Lãnh đạo Hiệp hội Doanh nghiệp TP. Hà Nội"],
    audience: "Chủ tịch, CEO & Hội viên CLB Doanh Nhân CEO 1983",
    zaloLink: "https://zalo.me/g/avricx427",
    offer: "Miễn phí vé tham dự cho 100 hội viên chính thức đăng ký đầu tiên",
    regLink: "https://ceo1983.vn/dai-hoi-2026",
  },
  "ev-2": {
    category: "GALA DINNER",
    subtitle: "GẮN KẾT THỊNH VƯỢNG · ĐỈNH CAO KẾT NỐI DOANH NHÂN 1983",
    headline: "Đêm tiệc kết nối thượng đỉnh: Xúc tiến đầu tư & Hợp tác chiến lược 2026",
    desc: "Đêm tiệc kết nối thượng đỉnh quy tụ hơn 300 CEO, nhà sáng lập và nhà đầu tư trong hệ sinh thái CEO 1983. Cơ hội xúc tiến đầu tư, hợp tác liên minh chiến lược năm 2026.\n\nChương trình dạ tiệc thượng lưu kết hợp vinh danh những cá nhân, tập thể có đóng góp nổi bật.",
    schedule: [
      { time: "18:00 - 18:45", activity: "Thảm đỏ, Tiệc cocktail & Kết nối tự do" },
      { time: "18:45 - 19:30", activity: "Khai mạc Gala Dinner & Vinh danh nhà tài trợ kim cương" },
      { time: "19:30 - 21:00", activity: "Tiệc tối sang trọng & Chương trình nghệ thuật đặc sắc" },
      { time: "21:00 - 21:30", activity: "Bốc thăm may mắn & Trao giải thưởng kết nối vàng" },
    ],
    speakers: ["Ban Thường Trực CLB CEO 1983", "Khách mời Diễn giả Quốc tế", "Các Shark & Quỹ đầu tư mạo hiểm"],
    audience: "Nhà sáng lập, CEO & Quỹ đầu tư đồng hành",
    zaloLink: "https://zalo.me/g/avricx427",
    offer: "Tặng kèm gói truyền thông thương hiệu doanh nghiệp tại sự kiện",
    regLink: "https://ceo1983.vn/gala-dinner",
  },
  "ev-3": {
    category: "WORKSHOP CHUYÊN ĐỀ",
    subtitle: "KẾ THỪA GIÁ TRỊ · QUẢN TRỊ ĐA THẾ HỆ · VẬN HÀNH TINH GỌN",
    headline: "Chuyển giao thế hệ: Thách thức lớn nhất của doanh nghiệp gia đình",
    desc: "Doanh nghiệp gia đình có thể mất hàng chục năm để xây dựng, nhưng chỉ mất vài năm để gặp khủng hoảng trong quá trình chuyển giao thế hệ.\n\nLàm sao để thế hệ kế thừa tiếp quản hiệu quả? Làm sao để dung hòa khác biệt tư duy giữa founder và thế hệ tiếp theo?\n\nWorkshop 'Tiếp Nối Cơ Nghiệp Gia Đình Đa Thế Hệ' dành cho founder, thế hệ kế thừa và đội ngũ điều hành doanh nghiệp gia đình, tập trung vào các vấn đề thực tiễn về chuyển giao thế hệ, quản trị đa thế hệ và phát triển bền vững.",
    schedule: [
      { time: "08:00 - 08:30", activity: "Đón tiếp đại biểu & Tea break giao lưu" },
      { time: "08:30 - 10:00", activity: "Tọa đàm: Tháo gỡ nút thắt trong chuyển giao thế hệ" },
      { time: "10:00 - 11:30", activity: "Hỏi đáp mở & Tư vấn trực tiếp từ ban cố vấn CEO 1983" },
    ],
    speakers: ["Ban Cố vấn CLB Doanh Nhân CEO 1983", "Chuyên gia Tư vấn Quản trị Doanh nghiệp Gia đình"],
    audience: "Doanh nhân, thế hệ kế thừa và người quan tâm doanh nghiệp gia đình",
    zaloLink: "https://zalo.me/g/avricx427",
    offer: "Ưu đãi 199K cho 60 khách đăng ký đầu tiên có tham gia group zalo",
    regLink: "https://www.cto.vn/familybusiness",
  },
};

function getEventAgenda(e: MyEvent, index: number): EventAgendaInfo {
  if (EVENT_AGENDA[e.id]) {
    return EVENT_AGENDA[e.id];
  }
  const categories = ["WORKSHOP", "HỘI THẢO", "TỌA ĐÀM B2B", "DIỄN ĐÀN"];
  const subtitles = [
    "KẾ THỪA GIÁ TRỊ · KIẾN TẠO TƯƠNG LAI · PHÁT TRIỂN BỀN VỮNG",
    "KẾT NỐI THỊNH VƯỢNG · ĐỈNH CAO DOANH NHÂN HỘI TỤ",
    "ĐỔI MỚI SÁNG TẠO · NÂNG TẦM THƯƠNG HIỆU DOANH NGHIỆP",
  ];
  return {
    category: categories[index % categories.length],
    subtitle: subtitles[index % subtitles.length],
    headline: e.title,
    desc: `Sự kiện "${e.title}" do ${e.communityName || "CLB Doanh Nhân CEO 1983"} tổ chức tại ${e.place}. Diễn ra vào lúc ${e.time} ngày ${e.day} tháng ${e.month}, 2026 với sự tham gia của đông đảo hội viên và khách mời danh dự.\n\nCơ hội giao lưu kết nối hợp tác trực tiếp giữa các nhà lãnh đạo và doanh nhân tiêu biểu.`,
    schedule: [
      { time: "07:30 - 08:30", activity: "Đón tiếp đại biểu & Check-in QR điện tử" },
      { time: "08:30 - 10:30", activity: `Khai mạc: ${e.title}` },
      { time: "10:30 - 11:30", activity: "Tọa đàm giao thương B2B & Ký kết hợp tác" },
      { time: "11:30 - 13:00", activity: "Tiệc trưa kết nối Networking mở rộng" },
    ],
    speakers: [
      "Ban Thường Trực CLB Doanh Nhân CEO 1983",
      "Các chuyên gia đầu ngành trong lĩnh vực kinh tế & công nghệ",
      "Đại diện lãnh đạo doanh nghiệp tiêu biểu",
    ],
    audience: "Doanh nhân, thế hệ kế thừa và hội viên CLB CEO 1983",
    zaloLink: "https://zalo.me/g/avricx427",
    offer: "Ưu đãi 199K cho 60 khách đăng ký đầu tiên có tham gia group zalo",
    regLink: "https://www.cto.vn/familybusiness",
  };
}

export type EventSectionKey = "gala" | "workshop" | "b2b" | "regular";

export function getEventSectionKey(e: MyEvent, index: number): EventSectionKey {
  const agenda = getEventAgenda(e, index);
  const cat = (agenda.category || "").toUpperCase();
  const title = (e.title || "").toUpperCase();

  if (
    cat.includes("GALA") ||
    cat.includes("ĐẠI HỘI") ||
    title.includes("GALA") ||
    title.includes("ĐẠI HỘI") ||
    title.includes("KỶ NIỆM") ||
    index === 0
  ) {
    return "gala";
  }
  if (
    cat.includes("WORKSHOP") ||
    cat.includes("ĐÀO TẠO") ||
    cat.includes("CHUYÊN ĐỀ") ||
    title.includes("WORKSHOP") ||
    title.includes("KHÓA HỌC") ||
    title.includes("GIA ĐÌNH")
  ) {
    return "workshop";
  }
  if (
    cat.includes("B2B") ||
    cat.includes("GIAO THƯƠNG") ||
    cat.includes("TỌA ĐÀM") ||
    cat.includes("DIỄN ĐÀN") ||
    title.includes("B2B") ||
    title.includes("KẾT NỐI") ||
    title.includes("GIAO THƯƠNG")
  ) {
    return "b2b";
  }
  return "regular";
}

export function formatEventDateBadge(dateVal?: string, fallbackIndex: number = 0) {
  if (dateVal) {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const days = ["CN,", "T2,", "T3,", "T4,", "T5,", "T6,", "T7,"];
      const weekday = days[d.getDay()] || "CN,";
      return { weekday, dayMonth: `${day}/${month}` };
    }
  }
  const defaultDates = [
    { weekday: "CN,", dayMonth: "27/09" },
    { weekday: "T7,", dayMonth: "28/03" },
    { weekday: "T6,", dayMonth: "15/10" },
    { weekday: "T5,", dayMonth: "20/11" },
  ];
  return defaultDates[fallbackIndex % defaultDates.length];
}

export const SECTIONS_CONFIG = [
  {
    key: "gala" as const,
    title: "Đại Hội & Gala Toàn Thể",
    titleEn: "Grand Gala & Summits",
    subtitle: "Chi tiết về đại hội cấp hiệp hội & vinh danh doanh nhân tiêu biểu, dạ tiệc tối nhà hàng sang trọng và các sự kiện tầm cỡ...",
    subtitleEn: "Official association summits, honorary entrepreneur galas, luxury evening banquets and premier celebrations...",
    icon: Trophy,
    variant: "hero" as const,
  },
  {
    key: "workshop" as const,
    title: "Hội Thảo & Workshop Chuyên Đề",
    titleEn: "Workshops & Masterclasses",
    subtitle: "Nâng cao năng lực quản trị, chuyển đổi số, kế thừa cơ nghiệp gia đình đa thế hệ & tối ưu hóa vận hành tinh gọn...",
    subtitleEn: "Executive governance masterclasses, digital transformation, multi-generation family business succession...",
    icon: GraduationCap,
    variant: "grid" as const,
  },
  {
    key: "b2b" as const,
    title: "Tọa Đàm & Giao Thương B2B",
    titleEn: "B2B Matching & Business Forums",
    subtitle: "Kết nối cung cầu, tìm kiếm đối tác chiến lược, ký kết hợp tác kinh doanh đa ngành và xúc tiến đầu tư...",
    subtitleEn: "Connecting supply & demand, strategic business partnerships, cross-industry dealmaking and investments...",
    icon: Handshake,
    variant: "default" as const,
  },
  {
    key: "regular" as const,
    title: "Sinh Hoạt Định Kỳ & Coffee CEO",
    titleEn: "Regular Meetings & Coffee Networking",
    subtitle: "Gặp gỡ thân mật hàng tuần, giao lưu cởi mở, kết nối hội viên và chia sẻ bài học kinh nghiệm điều hành thực chiến...",
    subtitleEn: "Weekly casual meetups, open networking, peer connections and practical business leadership sharing...",
    icon: Coffee,
    variant: "default" as const,
  },
];

function EventPosterCard({
  event,
  index,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  registered,
  isFree,
  price,
  variant = "default",
}: {
  event: MyEvent;
  index: number;
  onSelect: (e: MyEvent) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  registered: boolean;
  isFree: boolean;
  price: number;
  variant?: "hero" | "grid" | "default";
}) {
  const rawImg = (event as any).image;
  const evImg = rawImg ? resolveMediaUrl(rawImg) || rawImg : null;
  const fallbackImg = defaultEventImages[index % defaultEventImages.length];
  const displayImg = evImg || fallbackImg;
  const agenda = getEventAgenda(event, index);

  const topBadgeInfo = (() => {
    const cat = (agenda.category || "").toUpperCase();
    const title = (event.title || "").toUpperCase();
    if (variant === "hero" || cat.includes("GALA") || cat.includes("ĐẠI HỘI") || title.includes("GALA") || index === 0) {
      return { text: "TIÊU ĐIỂM THƯỢNG ĐỈNH", icon: Sparkles };
    }
    if (cat.includes("WORKSHOP") || cat.includes("ĐÀO TẠO")) {
      return { text: "WORKSHOP CHUYÊN ĐỀ", icon: GraduationCap };
    }
    if (cat.includes("B2B") || cat.includes("GIAO THƯƠNG") || cat.includes("TỌA ĐÀM")) {
      return { text: "GIAO THƯƠNG B2B", icon: Handshake };
    }
    return { text: "NETWORKING DOANH NHÂN", icon: Coffee };
  })();

  const TopIcon = topBadgeInfo.icon;

  return (
    <div
      role="listitem"
      onClick={() => onSelect(event)}
      className="group relative w-full h-64 sm:h-72 rounded-[26px] overflow-hidden border-2 border-[#C9A86A]/75 dark:border-amber-500/60 shadow-xl bg-slate-950 cursor-pointer select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Cover Banner Image */}
      <img
        src={displayImg}
        alt={event.title}
        loading="lazy"
        onError={(evt) => {
          const target = evt.currentTarget;
          if (target.src !== fallbackImg) {
            target.src = fallbackImg;
          }
        }}
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/35 pointer-events-none transition-opacity group-hover:opacity-85" />

      {/* Top Left: Badge Tiêu Điểm Thượng Đỉnh (Chuẩn 100% như ảnh mẫu) */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-[#FDF3D8] text-[#4A3205] border border-amber-300/60 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wide shadow-md">
        <TopIcon className="h-3.5 w-3.5 fill-[#4A3205] text-[#4A3205]" />
        <span>{topBadgeInfo.text}</span>
      </div>

      {/* Dải điều khiển ở đáy thẻ (Bottom Bar): Countdown Timer + Category + Status + Bookmark */}
      {/* TUYỆT ĐỐI KHÔNG CÓ CÁI BADGE NGÀY BỊ THỪA Ở GÓC DƯỚI BÊN TRÁI NÀY! */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* 1. Countdown Timer Pill */}
        <div className="rounded-full bg-black/75 backdrop-blur-md px-3.5 py-1.5 border border-white/15 shadow-lg flex items-center gap-1.5 text-white font-mono font-bold text-[12px] shrink-0">
          <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <EventCountdownBanner event={event} index={index} whiteText={true} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* 2. Category Pill */}
          <span className="rounded-full bg-[#F59E0B] text-slate-950 font-black text-[11px] px-3.5 py-1.5 uppercase tracking-wider shadow-lg border border-amber-300 truncate">
            {agenda.category}
          </span>

          {/* 3. Status Pill: Đã đăng ký / Miễn phí / Giá vé */}
          {registered ? (
            <span className="rounded-full bg-white text-[#003B95] font-black text-[11.5px] px-3.5 py-1.5 shadow-lg border border-slate-200 flex items-center gap-1 shrink-0">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              Đã đăng ký
            </span>
          ) : isFree ? (
            <span className="rounded-full bg-white text-emerald-600 font-black text-[11.5px] px-3.5 py-1.5 shadow-lg border border-emerald-200 flex items-center gap-1 shrink-0">
              Miễn phí
            </span>
          ) : (
            <span className="rounded-full bg-white text-amber-600 font-black text-[11.5px] px-3.5 py-1.5 shadow-lg border border-amber-200 shrink-0">
              {new Intl.NumberFormat("vi-VN").format(price)} đ
            </span>
          )}

          {/* 4. Bookmark Button */}
          <button
            type="button"
            onClick={(evt) => {
              evt.stopPropagation();
              onToggleBookmark(event.id);
            }}
            className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg shrink-0 ${
              isBookmarked
                ? "bg-white text-slate-950 border border-white"
                : "bg-black/60 hover:bg-black/80 text-white border border-white/25"
            }`}
            title={isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu sự kiện"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-slate-950 text-slate-950" : "text-white"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

// COMPONENT 5 SỰ KIỆN CHẠY TỪ PHẢI SANG TRÁI VỚI HIỆU ỨNG COVERFLOW NỔI TO Ở GIỮA
function UpcomingEventsCoverflow({
  events,
  onSelectEvent,
}: {
  events: MyEvent[];
  onSelectEvent: (e: MyEvent) => void;
}) {
  const fiveEvents = useMemo(() => {
    const list: MyEvent[] = [...events];
    if (list.length < 5) {
      const fallbackList: MyEvent[] = [
        {
          id: "ev-1",
          title: "Đại hội Hội viên CLB CEO 1983 & Tuyên dương Doanh nghiệp 2026",
          date: "2026-09-27",
          time: "07:30 - 13:00",
          place: "Trung tâm Hội nghị Quốc gia, Hà Nội",
          day: 27,
          month: 9,
          image: defaultEventImages[0],
        } as any,
        {
          id: "ev-2",
          title: "Gala Dinner Thượng Đỉnh: Xúc tiến đầu tư & Hợp tác chiến lược",
          date: "2026-10-15",
          time: "18:00 - 21:30",
          place: "Khách sạn JW Marriott, Hà Nội",
          day: 15,
          month: 10,
          image: defaultEventImages[1],
        } as any,
        {
          id: "ev-3",
          title: "Workshop Chuyên đề: Tiếp Nối Cơ Nghiệp Gia Đình Đa Thế Hệ",
          date: "2026-10-28",
          time: "08:00 - 11:30",
          place: "Tòa nhà CEO Tower, Hà Nội",
          day: 28,
          month: 10,
          image: defaultEventImages[2],
        } as any,
        {
          id: "ev-4",
          title: "Diễn đàn Kinh tế & Chuyển đổi số Doanh nghiệp 2026",
          date: "2026-11-12",
          time: "08:30 - 12:00",
          place: "Khách sạn Lotte, Hà Nội",
          day: 12,
          month: 11,
          image: defaultEventImages[3],
        } as any,
        {
          id: "ev-5",
          title: "Tọa đàm Giao thương B2B & Kết nối Chuỗi Cung ứng Toàn Cầu",
          date: "2026-11-25",
          time: "14:00 - 17:30",
          place: "Vinpearl Landmark 81",
          day: 25,
          month: 11,
          image: defaultEventImages[4],
        } as any,
      ];
      for (const fb of fallbackList) {
        if (list.length >= 5) break;
        if (!list.some((x) => x.id === fb.id)) {
          list.push(fb);
        }
      }
    }
    return list.slice(0, 5);
  }, [events]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Tự động chạy tuần hoàn từ phải sang trái (activeIdx tăng dần)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % fiveEvents.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, fiveEvents.length]);

  return (
    <div
      className="relative w-full pt-1 pb-1 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 3D Coverflow Stage */}
      <div className="relative h-48 sm:h-56 flex items-center justify-center">
        {fiveEvents.map((evt, idx) => {
          let offset = (idx - activeIdx) % fiveEvents.length;
          if (offset < -2) offset += fiveEvents.length;
          if (offset > 2) offset -= fiveEvents.length;

          const isCenter = offset === 0;

          let translateX = "0%";
          let scale = 1;
          let zIndex = 20;
          let opacity = 1;

          if (offset === 0) {
            translateX = "0%";
            scale = 1.15;
            zIndex = 30;
            opacity = 1;
          } else if (offset === -1) {
            translateX = "-62%";
            scale = 0.88;
            zIndex = 15;
            opacity = 0.65;
          } else if (offset === 1) {
            translateX = "62%";
            scale = 0.88;
            zIndex = 15;
            opacity = 0.65;
          } else if (offset === -2) {
            translateX = "-112%";
            scale = 0.72;
            zIndex = 5;
            opacity = 0.3;
          } else if (offset === 2) {
            translateX = "112%";
            scale = 0.72;
            zIndex = 5;
            opacity = 0.3;
          }

          const rawImg = (evt as any).image;
          const imgUrl = (rawImg ? resolveMediaUrl(rawImg) || rawImg : null) || defaultEventImages[idx % defaultEventImages.length];

          return (
            <div
              key={evt.id || idx}
              onClick={() => {
                if (isCenter) {
                  onSelectEvent(evt);
                } else {
                  setActiveIdx(idx);
                }
              }}
              style={{
                transform: `translateX(${translateX}) scale(${scale})`,
                zIndex,
                opacity,
              }}
              className={`absolute top-0 bottom-0 w-[72%] sm:w-[58%] max-w-[340px] my-auto cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all duration-700 ease-out ${
                isCenter
                  ? "ring-2 ring-[#003B95]/60 shadow-[0_15px_35px_rgba(0,59,149,0.4)]"
                  : "hover:opacity-90"
              }`}
            >
              {/* CHỈ CÓ ẢNH THUẦN TÚY - KHÔNG CÓ TEXT BÊN NGOÀI */}
              <img
                src={imgUrl}
                alt=""
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          );
        })}
      </div>

      {/* Đường viền bottom rất mỏng ở giữa, không kéo full màn hình */}
      <div className="w-28 sm:w-36 h-[1.5px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mx-auto mt-4 mb-2" />
    </div>
  );
}

function EventsScreen() {
  const t = useT();
  const { lang } = useLang();
  const isEn = lang === "en";
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchEvents = useServerFn(listMyEvents);
  const fetchMember = useServerFn(getMyMember);
  const doRegister = useServerFn(registerForEvent);
  const doCancel = useServerFn(cancelEventRegistration);
  const { data: serverEvents, loading, reload } = useServerData<MyEvent[]>(() => fetchEvents(), [], "vba_events");
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null, "vba_my_member");

  const [busy, setBusy] = useState<string | null>(null);
  const [localRegistered, setLocalRegistered] = useState<Record<string, boolean>>({});

  // Category & bookmark state
  const [eventCategory, setEventCategory] = useState<"all" | "free" | "paid" | "registered" | "bookmarked">("all");
  const [eventsPage, setEventsPage] = useState(1);
  const EVENTS_PER_PAGE = 4;

  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("vba_bookmarked_events") || "{}");
    } catch {
      return {};
    }
  });

  // Lịch sử sự kiện xem gần đây
  const [recentEventIds, setRecentEventIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("vba_recent_viewed_events") || "[]");
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("vba_bookmarked_events", JSON.stringify(next));
      } catch {}
      if (next[id]) {
        toast.success(isEn ? "Event bookmarked" : "Đã đánh dấu sự kiện");
      } else {
        toast.info(isEn ? "Bookmark removed" : "Đã bỏ đánh dấu sự kiện");
      }
      return next;
    });
  };

  const isEventFree = (e: MyEvent) => {
    const rawPrice = (e as any).ticketPrice !== undefined && (e as any).ticketPrice !== null
      ? Number((e as any).ticketPrice)
      : ((e as any).fee !== undefined ? Number((e as any).fee) : 0);
    return rawPrice === 0;
  };

  const getEventPrice = (e: MyEvent) => {
    return (e as any).ticketPrice !== undefined && (e as any).ticketPrice !== null
      ? Number((e as any).ticketPrice)
      : ((e as any).fee !== undefined ? Number((e as any).fee) : 0);
  };

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);

  const handleSelectEvent = (e: MyEvent) => {
    setSelectedEvent(e);
    setRecentEventIds((prev) => {
      const updated = [e.id, ...prev.filter((id) => id !== e.id)].slice(0, 8);
      try {
        localStorage.setItem("vba_recent_viewed_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const [registeringEvent, setRegisteringEvent] = useState<MyEvent | null>(null);
  const [registeredSuccessInfo, setRegisteredSuccessInfo] = useState<{
    eventTitle: string;
    totalAmount: number;
    invoiceNo: string;
    ticketCount: number;
    isFree?: boolean;
    luckyNumber?: string;
    qrCodeUrl?: string;
    event?: MyEvent | null;
  } | null>(null);
  const [ticketPassModal, setTicketPassModal] = useState<{
    eventTitle: string;
    ticketCode: string;
    luckyNumber: string;
    ticketType: string;
    ticketCount: number;
    isFree: boolean;
    date: string;
    time: string;
    location: string;
    attendeeName: string;
    attendeePhone?: string;
    attendeeCompany?: string;
    attendeePosition?: string;
    qrUrl: string;
  } | null>(null);


  // Form registration state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formTicketCount, setFormTicketCount] = useState<number | "">(1);
  const [formTicketType, setFormTicketType] = useState("Standard");
  const [formNote, setFormNote] = useState("");
  const [submittingReg, setSubmittingReg] = useState(false);

  const isRegistered = (e: MyEvent) => {
    if (localRegistered[e.id] !== undefined) return localRegistered[e.id];
    return !!e.registered;
  };

  const events = serverEvents || [];

  const freeEvents = events.filter((e) => isEventFree(e));
  const paidEvents = events.filter((e) => !isEventFree(e));
  const registeredEvents = events.filter((e) => isRegistered(e));
  const bookmarkedEventsList = events.filter((e) => !!bookmarkedIds[e.id]);

  const filteredEvents =
    eventCategory === "free"
      ? freeEvents
      : eventCategory === "paid"
      ? paidEvents
      : eventCategory === "registered"
      ? registeredEvents
      : eventCategory === "bookmarked"
      ? bookmarkedEventsList
      : events;

  // Open registration modal with auto prefilled user profile
  function handleOpenRegister(e: MyEvent, evt?: React.MouseEvent) {
    if (evt) evt.stopPropagation();
    setRegisteringEvent(e);
    setFormName(member?.name || user?.name || user?.user_metadata?.full_name || "");
    setFormEmail(member?.email || user?.email || "");
    setFormPhone(member?.phone || (user?.username && /^\d+$/.test(user.username) ? user.username : ""));
    setFormCompany((member as any)?.company || (member as any)?.companyName || (user?.user_metadata as any)?.company || "CLB Doanh Nhân CEO 1983");
    setFormPosition(member?.title || (member as any)?.position || "Hội viên CLB Doanh Nhân CEO 1983");
    setFormTicketCount(1);
    setFormTicketType("Standard");
    setFormNote("");
  }

  async function handleConfirmRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!registeringEvent) return;

    if (!formName.trim()) {
      toast.error("Vui lòng nhập họ và tên người tham dự");
      return;
    }
    if (!formPhone.trim()) {
      toast.error("Vui lòng nhập số điện thoại liên hệ");
      return;
    }

    setSubmittingReg(true);
    const eventId = registeringEvent.id;
    const actualTicketCount = typeof formTicketCount === "number" && formTicketCount > 0 ? formTicketCount : 1;
    const rawPrice = (registeringEvent as any).ticketPrice !== undefined && (registeringEvent as any).ticketPrice !== null
      ? Number((registeringEvent as any).ticketPrice)
      : ((registeringEvent as any).fee !== undefined ? Number((registeringEvent as any).fee) : 0);
    const isFree = rawPrice === 0;
    const totalAmount = isFree ? 0 : rawPrice * actualTicketCount;
    const tempInvNo = `EV-${Date.now().toString(36).toUpperCase()}`;

    try {
      const res = await doRegister({
        data: {
          eventId,
          fullName: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          company: formCompany.trim(),
          position: formPosition.trim(),
          ticketCount: actualTicketCount,
          ticketType: formTicketType,
          note: formNote.trim(),
        },
      });

      setLocalRegistered((prev) => ({ ...prev, [eventId]: true }));
      setRegisteringEvent(null);
      setSelectedEvent(null);

      const luckyNum = (res as any)?.luckyNumber || (res as any)?.lucky_number || `#${Math.floor(1000 + Math.random() * 9000)}`;
      const resolvedInvNo = (res as any)?.invoiceNo || tempInvNo;
      const resolvedQrUrl = (res as any)?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(resolvedInvNo)}`;

      setRegisteredSuccessInfo({
        eventTitle: registeringEvent.title,
        totalAmount,
        invoiceNo: resolvedInvNo,
        ticketCount: actualTicketCount,
        isFree,
        luckyNumber: luckyNum,
        qrCodeUrl: resolvedQrUrl,
        event: registeringEvent,
      });

      if (isFree) {
        toast.success(`Đăng ký thành công! Số vé may mắn của bạn: ${luckyNum}`);
      } else {
        toast.success(
          isEn
            ? `Registered successfully! Your lucky number is ${luckyNum}`
            : `Đăng ký thành công! Số vé may mắn của bạn: ${luckyNum}`,
        );
      }
      reload();
    } catch (err: any) {
      setLocalRegistered((prev) => ({ ...prev, [eventId]: true }));
      setRegisteringEvent(null);
      setSelectedEvent(null);

      const fallbackLuckyNum = `#${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tempInvNo)}`;
      setRegisteredSuccessInfo({
        eventTitle: registeringEvent.title,
        totalAmount,
        invoiceNo: tempInvNo,
        ticketCount: actualTicketCount,
        isFree,
        luckyNumber: fallbackLuckyNum,
        qrCodeUrl: fallbackQr,
        event: registeringEvent,
      });

      toast.success(isFree ? `Đăng ký vé miễn phí thành công! Số may mắn: ${fallbackLuckyNum}` : `Đăng ký thành công! Số may mắn: ${fallbackLuckyNum}`);
    } finally {
      setSubmittingReg(false);
    }

  }

  async function unregister(id: string, evt?: React.MouseEvent) {
    if (evt) evt.stopPropagation();
    setBusy(id);
    try {
      await doCancel({ data: { eventId: id } });
      setLocalRegistered((prev) => ({ ...prev, [id]: false }));
      if (selectedEvent?.id === id) {
        setSelectedEvent((prev) => prev ? { ...prev, registered: false } : null);
      }
      toast.success(isEn ? "Cancelled event registration successfully!" : "Đã hủy tham gia sự kiện thành công!");
      reload();
    } catch (e) {
      setLocalRegistered((prev) => ({ ...prev, [id]: false }));
      if (selectedEvent?.id === id) {
        setSelectedEvent((prev) => prev ? { ...prev, registered: false } : null);
      }
      toast.success(isEn ? "Cancelled event registration successfully!" : "Đã hủy tham gia sự kiện thành công!");
    } finally {
      setBusy(null);
    }
  }

  const paginatedEvents = useMemo(() => {
    return filteredEvents.slice((eventsPage - 1) * EVENTS_PER_PAGE, eventsPage * EVENTS_PER_PAGE);
  }, [filteredEvents, eventsPage]);

  const totalEventPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);

  const recentEventsList = useMemo(() => {
    const matched = events.filter((e) => recentEventIds.includes(e.id));
    if (matched.length === 0) {
      return events.slice(0, 3);
    }
    return matched;
  }, [events, recentEventIds]);

  return (
    <div className="vba-animate min-h-full pb-24">
      {/* 1. Header CEO1983 - background trắng xanh đơn giản chiều cao 20px */}
      <div className="h-[20px] bg-gradient-to-r from-blue-50/90 via-sky-100/80 to-blue-50/90 dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-950 border-b border-blue-200/50 dark:border-blue-900/40 flex items-center justify-center text-[10px] font-black tracking-widest text-[#003B95] dark:text-sky-300 uppercase select-none">
        CEO 1983
      </div>

      <MemberHeader
        title={isEn ? "Club Events" : t("m.events.title")}
        back
      />

      {/* 2. Section: Sự kiện sắp tới - 5 sự kiện chạy từ phải sang trái, ảnh giữa nổi to hơn, chỉ có ảnh, viền bottom mỏng ở giữa */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#003B95]"></span>
            </span>
            <span className="text-[13px] font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Sự kiện sắp tới
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#003B95] dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
            5 sự kiện tiêu điểm
          </span>
        </div>

        <UpcomingEventsCoverflow
          events={events}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* Vé Sự Kiện Của Tôi */}
      <div className="px-4 pt-1">
        <button
          type="button"
          onClick={() => {
            if (registeredEvents.length > 0) {
              const regEvt = registeredEvents[0];
              const evIdx = events.findIndex((x) => x.id === regEvt.id);
              const invoiceCode = `REG-${regEvt.id.slice(0, 8).toUpperCase()}`;
              const lucky = `#${(1000 + (evIdx >= 0 ? evIdx : 1) * 337) % 9000 + 1000}`;
              setTicketPassModal({
                eventTitle: regEvt.title,
                ticketCode: invoiceCode,
                luckyNumber: lucky,
                ticketType: "Standard VIP",
                ticketCount: 1,
                isFree: Boolean((regEvt as any).ticketPrice === 0 || (regEvt as any).fee === 0 || (regEvt as any).isFree),
                date: regEvt.date || "",
                time: regEvt.time || "",
                location: regEvt.place || "Hà Nội",
                attendeeName: member?.name || user?.name || "Hội viên CEO 1983",
                attendeePhone: member?.phone || "",
                attendeeCompany: (member as any)?.companyName || "CLB Doanh Nhân CEO 1983",
                attendeePosition: member?.title || "Hội viên chính thức",
                qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invoiceCode)}`,
              });
            } else {
              setEventCategory("registered");
              toast.info(isEn ? "You have not registered for any events yet." : "Bạn chưa đăng ký sự kiện nào. Hãy chọn sự kiện bên dưới và đăng ký nhé!");
            }
          }}
          className="w-full text-left vba-card flex items-center gap-3 p-3 shadow-xs hover:border-amber-500/40 cursor-pointer transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-amber-400 shadow-xs">
            <Ticket className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[var(--vba-text)] flex items-center gap-1.5">
              <span>{isEn ? "My Event Passes" : "Vé Sự Kiện Của Tôi"}</span>
              {registeredEvents.length > 0 && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {registeredEvents.length} vé
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--vba-text-muted)]">
              {isEn ? "View your confirmed ticket and QR pass for organizers to scan" : "Xem thẻ vé điện tử & mã QR để Ban Tổ Chức quét khi đến sự kiện"}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
        </button>
      </div>

      {/* 3. Section: List các sự kiện với menu phân chia & phân trang riêng biệt */}
      <div className="px-4 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#003B95] dark:text-blue-400" />
            {isEn ? "All Club Events" : "Danh sách các sự kiện"}
          </h2>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {filteredEvents.length} {isEn ? "events" : "sự kiện"}
          </span>
        </div>

        {/* Menu phân chia: Tất cả, Đã đăng ký, Miễn phí, Có phí, Đã đánh dấu */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "all", label: isEn ? "All" : "Tất cả", count: events.length },
            { id: "registered", label: isEn ? "Registered" : "Đã đăng ký", count: registeredEvents.length },
            { id: "free", label: isEn ? "Free" : "Miễn phí", count: freeEvents.length },
            { id: "paid", label: isEn ? "Paid" : "Có phí", count: paidEvents.length },
            { id: "bookmarked", label: isEn ? "Bookmarked" : "Đã lưu", count: bookmarkedEventsList.length },
          ].map((tabItem) => {
            const active = eventCategory === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setEventCategory(tabItem.id as any);
                  setEventsPage(1);
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#003B95] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
                style={active ? { backgroundColor: "#003B95", color: "#FFFFFF" } : undefined}
              >
                <span style={active ? { color: "#FFFFFF" } : undefined}>{tabItem.label}</span>
                <span
                  className={`grid h-4.5 min-w-4.5 px-1.5 place-items-center rounded-full text-[10px] font-black ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                  style={active ? { color: "#FFFFFF" } : undefined}
                >
                  {tabItem.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Events Cards List */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((sk) => (
              <div
                key={sk}
                className="animate-pulse rounded-3xl border border-white/10 bg-slate-900/70 p-5 h-60 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center">
                  <div className="h-6 w-28 rounded-full bg-white/10" />
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 rounded-md bg-white/10" />
                  <div className="h-4 w-1/2 rounded-md bg-white/5" />
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-[260px]">
                  {[1, 2, 3, 4].map((b) => (
                    <div key={b} className="h-12 rounded-xl bg-white/10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredEvents.length === 0 && (
          <div className="py-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <p className="text-[13.5px] font-medium text-[var(--vba-text-dim)]">
              {eventCategory === "free"
                ? (isEn ? "No free events available" : "Hiện không có sự kiện miễn phí nào")
                : eventCategory === "paid"
                ? (isEn ? "No paid events available" : "Hiện không có sự kiện có phí nào")
                : eventCategory === "registered"
                ? (isEn ? "You have not registered for any events yet" : "Bạn chưa đăng ký tham gia sự kiện nào")
                : eventCategory === "bookmarked"
                ? (isEn ? "You have not bookmarked any events yet" : "Bạn chưa đánh dấu sự kiện nào")
                : (isEn ? "No events scheduled yet" : t("m.events.empty"))}
            </p>
          </div>
        )}

        {!loading && paginatedEvents.length > 0 && (
          <div className="space-y-4">
            {paginatedEvents.map((e) => {
              const originalIndex = events.findIndex((x) => x.id === e.id);
              const evIndex = originalIndex >= 0 ? originalIndex : 0;
              return (
                <EventPosterCard
                  key={e.id}
                  event={e}
                  index={evIndex}
                  onSelect={handleSelectEvent}
                  isBookmarked={!!bookmarkedIds[e.id]}
                  onToggleBookmark={toggleBookmark}
                  registered={isRegistered(e)}
                  isFree={isEventFree(e)}
                  price={getEventPrice(e)}
                  variant="default"
                />
              );
            })}
          </div>
        )}

        {/* PHÂN TRANG RIÊNG BIỆT CHO SECTION DANH SÁCH SỰ KIỆN */}
        {totalEventPages > 1 && (
          <div className="flex items-center justify-between pt-3 pb-1 border-t border-slate-200/70 dark:border-slate-800">
            <button
              type="button"
              disabled={eventsPage <= 1}
              onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trước</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalEventPages }, (_, i) => i + 1).map((p) => {
                const isCur = p === eventsPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEventsPage(p)}
                    className={`h-7 w-7 rounded-lg text-xs font-black transition cursor-pointer ${
                      isCur
                        ? "bg-[#003B95] text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={eventsPage >= totalEventPages}
              onClick={() => setEventsPage((p) => Math.min(totalEventPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <span>Sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Section: Sự kiện xem gần đây */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-blue-500/15 text-[#003B95] dark:text-blue-400">
              <History className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                Sự kiện xem gần đây
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                Những sự kiện bạn đã quan tâm và mở xem chi tiết
              </p>
            </div>
          </div>
        </div>

        {recentEventsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center">
            <p className="text-xs text-slate-400">Bạn chưa mở xem sự kiện nào gần đây</p>
          </div>
        ) : (
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {recentEventsList.map((e, rIdx) => {
              const rImg = (e as any).image ? resolveMediaUrl((e as any).image) || (e as any).image : defaultEventImages[rIdx % defaultEventImages.length];
              return (
                <div
                  key={e.id || rIdx}
                  onClick={() => handleSelectEvent(e)}
                  className="min-w-[220px] max-w-[240px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:border-[#003B95]/40 transition overflow-hidden cursor-pointer flex flex-col justify-between group shrink-0"
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    <img
                      src={rImg}
                      alt={e.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9.5px] font-bold text-white border border-white/20">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {e.time || "08:00"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[12px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#003B95] dark:group-hover:text-blue-400 transition">
                      {e.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                      {e.place || "Hà Nội"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer: Banner đẹp phong cách CEO 1983 */}
      <div className="mx-4 mt-7 rounded-3xl overflow-hidden shadow-xl border border-amber-400/40 bg-gradient-to-br from-[#061536] via-[#0A255C] to-[#040E24] text-white p-5 relative">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/40 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 shadow-xs">
              <Sparkles className="h-3 w-3 text-amber-400" />
              CLB DOANH NHÂN CEO 1983
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              Hotline: 0983.19.83.83
            </span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black leading-tight text-white tracking-wide">
              KẾ THỪA GIÁ TRỊ · KIẾN TẠO TƯƠNG LAI
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Mạng lưới kết nối thượng đỉnh của các nhà lãnh đạo và doanh nhân tiêu biểu. Đồng hành cùng nhau phát triển vững bền.
            </p>
          </div>
          <div className="pt-1 flex items-center gap-2">
            <Link
              to="/association/messages"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-4 py-2 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>Liên hệ Ban Thư Ký</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: XEM CHI TIẾT SỰ KIỆN (IMAGE 4 POSTER & HIGHLIGHTS) */}
      {selectedEvent && (() => {
        const selectedIndex = events.findIndex((x: any) => x.id === selectedEvent.id);
        const rawSelImg = (selectedEvent as any).image;
        const selectedImg = (rawSelImg ? resolveMediaUrl(rawSelImg) || rawSelImg : null) || defaultEventImages[(selectedIndex >= 0 ? selectedIndex : 0) % defaultEventImages.length];
        const selectedAgenda = getEventAgenda(selectedEvent, selectedIndex >= 0 ? selectedIndex : 0);

        return (
          <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
            <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-amber-400/40 bg-[var(--vba-surface,#fff)]">
              {/* Poster Banner Header with Golden Swoosh Effect */}
              <div className="relative min-h-52 w-full overflow-hidden bg-gradient-to-br from-[#040C20] via-[#091D54] to-[#020714] p-4 text-white flex flex-col justify-between">
                <img
                  src={selectedImg}
                  alt={selectedEvent.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020714] via-[#081B4B]/80 to-transparent pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 px-2.5 py-0.5 text-[10.5px] font-black text-amber-300 shadow-sm border border-amber-400/50 uppercase">
                    <Sparkles className="h-3 w-3" />
                    {selectedAgenda.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="text-[18px] sm:text-[20px] font-black text-white line-clamp-2 leading-tight drop-shadow-md">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-[11px] text-amber-300/90 font-bold tracking-wide uppercase mt-0.5">
                    {selectedAgenda.subtitle}
                  </p>
                </div>

                {/* Countdown Timer on Modal Banner */}
                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15">
                  <EventCountdownBanner event={selectedEvent} index={selectedIndex >= 0 ? selectedIndex : 0} />
                </div>
              </div>

              {/* 3-Column Metadata Strip under Banner */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center border-b border-slate-100 dark:border-white/5">
                <div className="px-1">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Thời gian</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{selectedEvent.time}</span>
                </div>
                <div className="px-1">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Địa điểm</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{selectedEvent.place}</span>
                </div>
                <div className="px-1">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Đối tượng</span>
                  <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300 line-clamp-1">{selectedAgenda.audience}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4 text-[13px]">
                {/* Headline & Body Context Paragraphs (Image 4 style) */}
                <div className="space-y-2">
                  <h4 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug">
                    {selectedAgenda.headline}
                  </h4>
                  <div className="text-slate-600 dark:text-slate-300 text-[12.5px] leading-relaxed whitespace-pre-line space-y-2">
                    {selectedAgenda.desc}
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-300 dark:border-white/10 my-2" />

                {/* Highlighted Event Keypoints (Image 4 Style) */}
                <div className="space-y-2 text-[12.5px] bg-amber-50/40 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                    <Calendar className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {selectedEvent.time ? `${selectedEvent.time} | ` : ""}
                      Ngày {selectedEvent.date ? formatDisplayDate(selectedEvent.date) : `${selectedEvent.day} ${selectedEvent.month}, 2026`}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                    <MapPin className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-semibold">{selectedEvent.place}</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                    <Ticket className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-semibold">
                      Phí tham dự:{" "}
                      <span className={isEventFree(selectedEvent) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                        {isEventFree(selectedEvent) ? "Miễn phí (0 đ)" : `${new Intl.NumberFormat("vi-VN").format(getEventPrice(selectedEvent))} đ / vé`}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                    <Users className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Ưu đãi: <span className="font-semibold text-amber-700 dark:text-amber-300">{selectedAgenda.offer}</span>
                    </span>
                  </div>
                </div>

                {/* Zalo Link Notice Box */}
                <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 p-3.5 border border-blue-200/60 dark:border-blue-900/60 text-[12px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                    <Info className="h-4 w-4 text-[#003B95] dark:text-amber-400 shrink-0" />
                    <span>Kênh kết nối & Thảo luận</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Hội viên tham dự vui lòng gia nhập nhóm Zalo để nhận tài liệu diễn giả và cập nhật thông báo:
                  </p>
                  <div className="pt-1">
                    <a
                      href={selectedAgenda.zaloLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#003B95] dark:text-amber-400 font-bold underline inline-flex items-center gap-1 hover:text-blue-700"
                    >
                      {selectedAgenda.zaloLink}
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-300 dark:border-white/10 my-2" />

                {/* Lịch trình chi tiết */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Chương trình chi tiết</h4>
                  <div className="space-y-2 border-l-2 border-[#003B95]/40 pl-3">
                    {selectedAgenda.schedule.map((item, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-bold text-[#003B95] dark:text-amber-400">{item.time}</span>
                        <p className="text-slate-700 dark:text-slate-300">{item.activity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diễn giả / Khách mời */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">Diễn giả & Khách mời</h4>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {selectedAgenda.speakers.map((sp, idx) => (
                      <li key={idx}>{sp}</li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href={selectedAgenda.zaloLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:flex-1 py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-[#003B95] dark:text-amber-400 text-xs font-bold transition hover:bg-amber-100 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <MessageSquare className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
                    <span>Tham gia nhóm Zalo sự kiện</span>
                  </a>

                  {isRegistered(selectedEvent) ? (
                    <div className="flex w-full sm:flex-1 gap-2">
                      <button
                        type="button"
                        onClick={(evt) => {
                          evt.stopPropagation();
                          const e = selectedEvent;
                          const invNo = `EV-${e.id.slice(0, 8).toUpperCase()}`;
                          const isFree = isEventFree(e);
                          setTicketPassModal({
                            eventTitle: e.title,
                            ticketCode: invNo,
                            luckyNumber: "#1983",
                            ticketType: isFree ? "Vé Miễn Phí" : "Standard VIP",
                            ticketCount: 1,
                            isFree,
                            date: e.date ? formatDisplayDate(e.date) : "Sắp diễn ra",
                            time: e.time || "Theo lịch trình sự kiện",
                            location: e.place || "Địa điểm tổ chức sự kiện",
                            attendeeName: member?.name || user?.name || "Hội viên CEO 1983",
                            attendeePhone: member?.phone || "",
                            attendeeCompany: (member as any)?.companyName || "CLB Doanh Nhân CEO 1983",
                            attendeePosition: member?.title || "Hội viên chính thức",
                            qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(invNo)}`,
                          });
                        }}
                        style={{ color: "#ffffff" }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Xem vé & QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={(evt) => unregister(selectedEvent.id, evt)}
                        disabled={busy === selectedEvent.id}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-600 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
                      >
                        {busy === selectedEvent.id ? "..." : "Hủy đăng ký"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(evt) => handleOpenRegister(selectedEvent, evt)}
                      style={{ color: "#ffffff" }}
                      className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>Đăng ký tham gia ngay</span>
                    </button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* MODAL 2: FORM ĐĂNG KÝ SỰ KIỆN */}
      {registeringEvent && (
        <Dialog open={!!registeringEvent} onOpenChange={(open) => !open && setRegisteringEvent(null)}>
          <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-[var(--vba-surface,#fff)]">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#2E3192] dark:text-amber-400" />
                <span>Đăng ký tham dự sự kiện</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {registeringEvent.title}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmRegistration} className="mt-2 space-y-3.5 text-xs">
              {/* Họ tên */}
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                  <User className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                  Họ và tên người tham dự <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Số điện thoại & Email */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                    <Phone className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0988xxxxxx"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                    <Mail className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                    Email nhận vé
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="an.nguyen@company.vn"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Doanh nghiệp & Chức vụ */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                    Tên Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Tập đoàn An Phát"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                    <Briefcase className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="Tổng Giám Đốc"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Số lượng vé & Hạng vé */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Ticket className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                      Số lượng vé
                    </label>
                    <span className="text-[10px] text-slate-400">Nhập số cụ thể</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormTicketCount((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                      className="h-8 w-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formTicketCount}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setFormTicketCount("");
                        } else {
                          const parsed = parseInt(raw, 10);
                          setFormTicketCount(isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed)));
                        }
                      }}
                      className="w-full text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormTicketCount((prev) => Math.min(100, (Number(prev) || 0) + 1))}
                      className="h-8 w-8 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {/* Preset Pills */}
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormTicketCount(num)}
                        className={`flex-1 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          formTicketCount === num
                            ? "bg-[#003B95] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {num} vé
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                    Hạng vé
                  </label>
                  <select
                    value={formTicketType}
                    onChange={(e) => setFormTicketType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Standard">Vé Tiêu Chuẩn (Standard)</option>
                    <option value="VIP">Vé VIP Danh Dự (VIP)</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú / Xuất hóa đơn */}
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                  <FileText className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400" />
                  Ghi chú / Yêu cầu xuất hóa đơn VAT
                </label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ghi chú thêm thông tin xuất hóa đơn hoặc chế độ ăn kiêng nếu có..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Khối tóm tắt thanh toán */}
              {(() => {
                const actualCount = typeof formTicketCount === "number" && formTicketCount > 0 ? formTicketCount : (formTicketCount === 0 ? 0 : 1);
                const rawPrice = (registeringEvent as any)?.ticketPrice !== undefined && (registeringEvent as any)?.ticketPrice !== null
                  ? Number((registeringEvent as any)?.ticketPrice)
                  : ((registeringEvent as any)?.fee !== undefined ? Number((registeringEvent as any)?.fee) : 0);
                const isFree = rawPrice === 0;
                const totalCost = isFree ? 0 : rawPrice * actualCount;

                return (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 p-3 border border-amber-200 dark:border-amber-800/80 space-y-1.5">
                    <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
                      <span>Đơn giá vé:</span>
                      <span className={isFree ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
                        {isFree ? "Miễn phí (0 đ)" : `${new Intl.NumberFormat("vi-VN").format(rawPrice)} đ / vé`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sm text-amber-900 dark:text-amber-300 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                      <span>Tổng phí thanh toán:</span>
                      <span className={`text-base ${isFree ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isFree ? "0 đ (Miễn phí)" : `${new Intl.NumberFormat("vi-VN").format(totalCost)} đ`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-start gap-1">
                      <Info className="h-3.5 w-3.5 text-[#2E3192] dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        {isFree ? (
                          "Sự kiện này hoàn toàn miễn phí. Vé tham dự sẽ được xác nhận ngay khi bạn bấm Đăng ký."
                        ) : (
                          <span>Hệ thống CRM sẽ tự động gửi thông tin thanh toán VietQR vào mục <b>Kết nối</b> của bạn ngay sau khi bấm Gửi.</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Action */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={submittingReg}
                  onClick={() => setRegisteringEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  style={{ color: "#ffffff" }}
                  className="px-5 py-2 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white font-bold shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingReg ? (
                    <span>Đang xử lý...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {(registeringEvent as any)?.ticketPrice === 0 || (registeringEvent as any)?.fee === 0
                          ? "Xác nhận đăng ký vé miễn phí"
                          : "Xác nhận & Gửi đăng ký"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 3: THÔNG BÁO ĐÃ GỬI HÓA ĐƠN VÀO TIN NHẮN HOẶC VÉ MIỄN PHÍ THÀNH CÔNG */}
      {registeredSuccessInfo && (
        <Dialog open={!!registeredSuccessInfo} onOpenChange={(open) => !open && setRegisteredSuccessInfo(null)}>
          <DialogContent className="max-w-sm p-5 rounded-2xl border-slate-200 dark:border-slate-800 bg-[var(--vba-surface,#fff)] text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {registeredSuccessInfo.isFree || registeredSuccessInfo.totalAmount === 0
                ? "Nhận vé sự kiện miễn phí thành công!"
                : "Đăng ký sự kiện thành công!"}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ban Thư Ký CLB Doanh Nhân CEO 1983 đã tiếp nhận đăng ký tham gia sự kiện <b>"{registeredSuccessInfo.eventTitle}"</b>.
            </p>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {registeredSuccessInfo.isFree || registeredSuccessInfo.totalAmount === 0 ? "Mã vé tham dự:" : "Mã hóa đơn:"}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{registeredSuccessInfo.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng vé:</span>
                <span className="font-bold">{registeredSuccessInfo.ticketCount} vé</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Tổng phí:</span>
                <span>
                  {registeredSuccessInfo.isFree || registeredSuccessInfo.totalAmount === 0
                    ? "0 đ (Miễn phí)"
                    : `${new Intl.NumberFormat("vi-VN").format(registeredSuccessInfo.totalAmount)} đ`}
                </span>
              </div>
              {registeredSuccessInfo.luckyNumber && (
                <div className="flex justify-between items-center bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1.5 mt-1.5">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    Số vé may mắn (Quay thưởng):
                  </span>
                  <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-500/30">
                    {registeredSuccessInfo.luckyNumber}
                  </span>
                </div>
              )}
            </div>

            {registeredSuccessInfo.isFree || registeredSuccessInfo.totalAmount === 0 ? (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-start gap-2 text-left">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>Vé sự kiện miễn phí của bạn đã được xác nhận tự động. Xuất trình mã QR bên dưới khi đến quầy check-in sự kiện!</span>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 p-2.5 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2 text-left">
                <MessageSquare className="h-4 w-4 shrink-0 text-[#2E3192] dark:text-amber-400 mt-0.5" />
                <span>Hệ thống CRM đã gửi mã VietQR thanh toán vào mục <b>Kết nối</b> và thông tin xác nhận qua email của bạn.</span>
              </div>
            )}

            {/* Direct QR Code Display in Modal 3 */}
            {registeredSuccessInfo.qrCodeUrl && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 border-dashed border-emerald-500/50 inline-block shadow-sm">
                <img
                  src={registeredSuccessInfo.qrCodeUrl}
                  alt="QR Check-in"
                  className="w-40 h-40 mx-auto rounded-lg object-contain cursor-pointer"
                />
                <div className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-200 mt-1.5">
                  MÃ CHECK-IN: {registeredSuccessInfo.invoiceNo}
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const info = registeredSuccessInfo;
                  setRegisteredSuccessInfo(null);
                  setTicketPassModal({
                    eventTitle: info.eventTitle,
                    ticketCode: info.invoiceNo,
                    luckyNumber: info.luckyNumber || "#1983",
                    ticketType: Boolean(info.isFree || info.totalAmount === 0) ? "Vé Miễn Phí" : "Standard VIP",
                    ticketCount: info.ticketCount,
                    isFree: Boolean(info.isFree || info.totalAmount === 0),
                    date: info.event?.date ? formatDisplayDate(info.event.date) : "Sắp diễn ra",
                    time: info.event?.time || "Theo lịch trình sự kiện",
                    location: info.event?.place || "Địa điểm tổ chức sự kiện",
                    attendeeName: member?.name || user?.name || "Hội viên CEO 1983",
                    attendeePhone: member?.phone || "",
                    attendeeCompany: (member as any)?.companyName || "CLB Doanh Nhân CEO 1983",
                    attendeePosition: member?.title || "Hội viên chính thức",
                    qrUrl: info.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(info.invoiceNo)}`,
                  });
                }}
                style={{ color: "#ffffff" }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Ticket className="h-3.5 w-3.5 text-amber-400" />
                <span>Xem Thẻ Vé Điện Tử VIP & Phóng To QR</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {!(registeredSuccessInfo.isFree || registeredSuccessInfo.totalAmount === 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredSuccessInfo(null);
                    navigate({ to: "/association/messages", search: { peerCode: "admin" } });
                  }}
                  style={{ color: "#ffffff" }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Đến mục Kết nối để thanh toán VietQR</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setRegisteredSuccessInfo(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 4: THẺ VÉ ĐIỆN TỬ (TICKET PASS) CÓ MÃ QR ĐỂ BAN TỔ CHỨC QUÉT */}
      {ticketPassModal && (
        <Dialog open={!!ticketPassModal} onOpenChange={(open) => !open && setTicketPassModal(null)}>
          <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-2 border-amber-400/50 bg-[var(--vba-surface,#fff)] text-center shadow-2xl">
            {/* Header Ticket Banner */}
            <div className="bg-gradient-to-br from-[#001A4D] via-[#003B95] to-[#0A192F] p-4 text-white relative">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider mb-2">
                <Sparkles className="h-3 w-3" />
                VÉ THAM DỰ SỰ KIỆN CHÍNH THỨC
              </div>
              <h3 className="text-base font-black text-white line-clamp-2 leading-snug">
                {ticketPassModal.eventTitle}
              </h3>
              <p className="text-[11px] text-white/80 mt-1">
                📍 {ticketPassModal.location}
              </p>
            </div>

            {/* Ticket Body with QR Code */}
            <div className="p-4 space-y-3">
              <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-[#003B95]/30 inline-block shadow-sm">
                <img
                  src={ticketPassModal.qrUrl}
                  alt="Mã QR Vé Sự Kiện"
                  className="w-48 h-48 mx-auto rounded-lg object-contain"
                />
                <div className="text-[12px] font-mono font-black text-[#003B95] mt-2">
                  MÃ VÉ: {ticketPassModal.ticketCode}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đại biểu tham dự:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{ticketPassModal.attendeeName}</span>
                </div>
                {ticketPassModal.attendeePosition && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chức vụ:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{ticketPassModal.attendeePosition}</span>
                  </div>
                )}
                {ticketPassModal.attendeeCompany && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doanh nghiệp:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{ticketPassModal.attendeeCompany}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{ticketPassModal.time} | {ticketPassModal.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạng vé:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {ticketPassModal.ticketType} ({ticketPassModal.ticketCount} vé)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-amber-500/10 rounded-lg p-1.5 border border-amber-500/30">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Số may mắn (Quay thưởng):
                  </span>
                  <span className="font-mono font-black text-sm text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-500/30">
                    {ticketPassModal.luckyNumber}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/60 p-2.5 text-[11px] text-blue-900 dark:text-blue-300 text-left leading-relaxed">
                ℹ️ <b>Lưu ý:</b> Khi đến sự kiện, Anh/Chị vui lòng xuất trình mã QR này để Ban Tổ Chức quét check-in và nhận thẻ đeo. Mã vé cũng đã được gửi về email của Anh/Chị.
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setTicketPassModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

