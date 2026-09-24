import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gift,
  ChevronRight,
  Sparkles,
  Award,
  Crown,
  X,
  Tag,
  Percent,
  Compass,
  ShoppingBag,
  HeartHandshake,
  Shield,
  Plane,
  Coffee,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Scale,
  Calculator,
  Hotel,
  Trophy,
  Dices,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listPerks, type Perk } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/association/perks/")({
  component: PerksScreen,
});

export const PERK_ICONS: Record<string, typeof Gift> = {
  gift: Gift,
  tag: Tag,
  percent: Percent,
  compass: Compass,
  shopping: ShoppingBag,
  handshake: HeartHandshake,
  shield: Shield,
  plane: Plane,
  coffee: Coffee,
  briefcase: Briefcase,
  education: GraduationCap,
  health: Stethoscope,
  legal: Scale,
  finance: Calculator,
  hotel: Hotel,
  trophy: Trophy,
};

const LUCKY_DRAW_PRIZES = [
  {
    id: "lucky-prize-1",
    title: "Giải Đặc Biệt Gala 2026: 01 Chuyến Du Lịch Dubai 5N4Đ + Thẻ Hội Viên Vàng",
    category: "Trúng thưởng",
    discount: "Trúng Thưởng 100%",
    summary: "Dành riêng cho hội viên may mắn tham dự Gala Doanh Nhân CEO 1983. Mã vé: CEO1983-DUBAI-VIP",
    partner: "Ban Chấp Hành Hiệp Hội CEO 1983",
    icon: "trophy",
    code: "CEO1983-DUBAI-VIP",
    claimed: true,
  },
  {
    id: "lucky-prize-2",
    title: "Giải Nhất Vòng Quay May Mắn: Bộ Quà Tặng Trống Đồng Mạ Vàng 24K",
    category: "Trúng thưởng",
    discount: "Đã Trúng",
    summary: "Vật phẩm phong thủy giới hạn mạ vàng 24K vinh danh kết nối giao thương nội khối xuất sắc.",
    partner: "CLB Doanh Nhân CEO 1983",
    icon: "gift",
    code: "CEO1983-GOLD-GIFT",
    claimed: true,
  },
  {
    id: "lucky-prize-3",
    title: "Giải Nhì Bốc Thăm: Voucher Nghỉ Dưỡng Vinpearl 5 Sao Trị Giá 10.000.000đ",
    category: "Trúng thưởng",
    discount: "10.000.000đ",
    summary: "Áp dụng nghỉ dưỡng tại toàn bộ hệ thống resort và villa Vinpearl trên toàn quốc.",
    partner: "Vinpearl Resort & Spa",
    icon: "hotel",
    code: "CEO1983-VINPEARL-VOUCHER",
    claimed: false,
  },
  {
    id: "lucky-prize-4",
    title: "Giải Khuyến Khích: Thẻ Danh Thiếp Thông Minh ViOne NFC Kim Loại Khắc Tên",
    category: "Trúng thưởng",
    discount: "Miễn Phí 100%",
    summary: "Thẻ NFC kim loại đen bóng viền mạ vàng sang trọng tích hợp công nghệ chạm danh thiếp 1 chạm.",
    partner: "ViOne Connect",
    icon: "trophy",
    code: "VIONE-NFC-CARD-VIP",
    claimed: false,
  },
];

function PerksScreen() {
  const t = useT();
  const fetchPerks = useServerFn(listPerks);
  const { data: serverPerks, loading } = useServerData<Perk[]>(() => fetchPerks(), []);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [activePrize, setActivePrize] = useState<(typeof LUCKY_DRAW_PRIZES)[0] | null>(null);

  const categories = useMemo(() => {
    return ["Tất cả", "Trúng thưởng", "Golf & Nghỉ dưỡng", "Dịch vụ Doanh nghiệp", "Ẩm thực & Tiếp khách"];
  }, []);

  const combinedPerks = useMemo(() => {
    const list = [...(serverPerks || [])];
    if (selectedCategory === "Trúng thưởng") {
      return LUCKY_DRAW_PRIZES;
    }
    if (selectedCategory === "Tất cả") {
      // Đưa mục trúng thưởng lên đầu để hội viên dễ theo dõi
      return [...LUCKY_DRAW_PRIZES.slice(0, 2), ...list];
    }
    return list.filter((p) => p.category?.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [serverPerks, selectedCategory]);

  return (
    <div className="vba-animate pb-24">
      <MemberHeader title="Ưu đãi & Trúng thưởng" back />

      {/* Luxury Animated Gift Box Banner - CEO 1983 Navy & Amber Gold */}
      <div className="px-4 pt-3">
        <div
          onClick={() => setGiftModalOpen(true)}
          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#003B95] via-[#071322] to-[#0A1A3A] p-5 shadow-xl cursor-pointer group transition-transform active:scale-98"
        >
          {/* Ambient Background Light Rays & Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-[#003B95]/40 blur-2xl" />

          {/* Light Rays Escaping Outward */}
          <div
            className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 -translate-x-1/2 h-36 w-36 rounded-full opacity-60"
            style={{
              background: "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.2) 50%, transparent 80%)",
              animation: "vba-ray-burst 2.8s ease-out infinite",
            }}
          />

          <div className="relative z-10 flex items-center gap-4">
            {/* The Animated Gift Box */}
            <div className="relative flex-shrink-0">
              {/* Outer Radiant Aura */}
              <div
                className="absolute -inset-2 rounded-2xl opacity-75"
                style={{
                  animation: "vba-gift-glow 2s ease-in-out infinite",
                  background: "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(56, 189, 248, 0.2) 70%)",
                }}
              />

              {/* Shaking Gift Box Container */}
              <div
                className="relative grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/80 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-[0_4px_20px_rgba(14,165,233,0.45)]"
                style={{
                  animation: "vba-gift-shake 1.2s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite 1.8s",
                }}
              >
                {/* 3D Gift Box Ribbon Cross */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-red-600 shadow-xs" />
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2.5 bg-red-600 shadow-xs" />

                {/* Ribbon Bow on Top */}
                <span className="absolute -top-2.5 text-[15px] filter drop-shadow-[0_2px_4px_rgba(220,38,38,0.7)] select-none">
                  🎀
                </span>

                <Gift className="relative z-10 h-8 w-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />

                {/* Floating Bling Bling Sparkles */}
                <span className="pointer-events-none absolute -top-3 -right-2 text-[11px] text-amber-100 animate-pollen-1 select-none" aria-hidden="true">✨</span>
                <span className="pointer-events-none absolute top-0 -left-3 text-[10px] text-yellow-200 animate-pollen-2 select-none" aria-hidden="true">✦</span>
                <span className="pointer-events-none absolute -bottom-2 -right-1 text-[8px] text-amber-200 animate-pollen-3 select-none" aria-hidden="true">⋆</span>
                <span className="pointer-events-none absolute -top-4 left-3 text-[12px] text-white animate-bling select-none" aria-hidden="true">✨</span>
              </div>
            </div>

            {/* Banner Text - Crisp White on Navy & Gold */}
            <div className="min-w-0 flex-1 text-white">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-500/40 backdrop-blur-xs">
                  <Sparkles className="h-2.5 w-2.5 text-amber-300" /> ĐẶC QUYỀN VIP
                </span>
                <span className="text-[10px] text-amber-200 font-medium">Chạm để mở quà & quay thưởng</span>
              </div>
              <h2 className="mt-1 text-[15.5px] font-black text-white leading-snug drop-shadow-sm">
                Ưu Đãi & Danh Mục Trúng Thưởng
              </h2>
              <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-200">
                Gói voucher độc quyền, quà bốc thăm trúng thưởng & quyền lợi kết nối 2026.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Chips including Trúng thưởng */}
      <div className="mt-3.5 px-4 flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const isLucky = cat === "Trúng thưởng";
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer ${
                isActive
                  ? isLucky
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-md shadow-amber-500/25 ring-2 ring-amber-300"
                    : "bg-[#003B95] text-white shadow-md shadow-blue-900/25"
                  : isLucky
                    ? "bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {isLucky && <Trophy className={`h-3.5 w-3.5 ${isActive ? "text-slate-900" : "text-amber-500"}`} />}
              <span>{cat}</span>
              {isLucky && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Gift Box Reveal Modal */}
      {giftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setGiftModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] p-6 text-center text-slate-900 dark:text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGiftModalOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing Big Gift Box */}
            <div className="relative mx-auto my-3 grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping duration-1000" />
              <div className="relative z-10 grid h-18 w-18 place-items-center rounded-2xl bg-gradient-to-tr from-[#003B95] to-[#1E40AF] text-white shadow-lg shadow-amber-500/20 border border-amber-500/30">
                <Gift className="h-10 w-10 text-amber-300" />
              </div>
            </div>

            <h3 className="text-xl font-black text-[#003B95] dark:text-amber-400">Chúc Mừng Bạn!</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Đã mở thành công Gói Quà Tặng Đặc Quyền Hội Viên CEO 1983
            </p>

            <div className="mt-4 space-y-2 text-left text-xs">
              <div className="rounded-xl border border-amber-500/20 bg-amber-50/80 dark:bg-amber-950/40 p-3 flex items-center gap-3">
                <Award className="h-5 w-5 shrink-0 text-[#003B95] dark:text-amber-400" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Voucher Giảm 20% Dịch Vụ Golf & Khách Sạn</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Áp dụng toàn bộ hệ thống đối tác liên kết</div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-50/80 dark:bg-amber-950/40 p-3 flex items-center gap-3">
                <Crown className="h-5 w-5 shrink-0 text-[#003B95] dark:text-amber-400" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Vé VIP Tham Gia Diễn Đàn Doanh Nhân 2026</div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Quyền lợi ưu tiên đặt bàn Gala & Giao lưu B2B</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGiftModalOpen(false)}
              style={{ backgroundColor: "#2E3192", color: "#ffffff" }}
              className="mt-5 w-full rounded-xl bg-[#2E3192] hover:bg-[#19194D] py-3 text-xs font-bold text-white shadow-lg shadow-[#2E3192]/25 active:scale-98 transition cursor-pointer"
            >
              Lưu Vào Ví Ưu Đãi Của Tôi
            </button>
          </div>
        </div>
      )}

      {/* Prize Detail Modal for Trúng Thưởng */}
      {activePrize && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in-50 duration-200"
          onClick={() => setActivePrize(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl border border-amber-500/40 bg-white dark:bg-[#0f172a] p-6 text-center text-slate-900 dark:text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePrize(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto my-2 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <Trophy className="h-8 w-8" />
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <PartyPopper className="h-3 w-3 text-amber-600" /> GIẢI THƯỞNG HỘI VIÊN
            </span>

            <h3 className="mt-2 text-base font-black text-slate-900 dark:text-white leading-snug">
              {activePrize.title}
            </h3>

            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activePrize.summary}
            </p>

            <div className="mt-4 rounded-2xl border border-dashed border-amber-500/60 bg-amber-50/80 dark:bg-amber-950/30 p-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Mã Trúng Thưởng Xác Thực
              </div>
              <div className="mt-1 font-mono text-sm font-black tracking-wider text-[#003B95] dark:text-amber-300">
                {activePrize.code}
              </div>
              <div className="mt-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                Đơn vị tài trợ: {activePrize.partner}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActivePrize(null)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#003B95] to-[#2E3192] py-3 text-xs font-bold text-white shadow-lg active:scale-98 transition cursor-pointer"
            >
              Xác Nhận & Đóng
            </button>
          </div>
        </div>
      )}

      {/* Perks List */}
      <div className="mt-4 space-y-2.5 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-slate-400">
            {t("m.perks.loading")}
          </p>
        )}
        {!loading && combinedPerks.length === 0 && (
          <p className="py-10 text-center text-[13px] text-slate-400">
            {t("m.perks.empty")}
          </p>
        )}
        {combinedPerks.map((p) => {
          const Icon = PERK_ICONS[(p as any).icon] ?? Gift;
          const isPrize = (p as any).category === "Trúng thưởng";

          if (isPrize) {
            return (
              <div
                key={p.id}
                onClick={() => setActivePrize(p as any)}
                className="flex items-center gap-3 rounded-2xl border border-amber-300/80 dark:border-amber-500/40 p-3.5 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 dark:from-[#1c1810] dark:via-[#131a26] dark:to-[#17130c] shadow-sm hover:border-amber-500 transition active:scale-[0.99] cursor-pointer"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-xs">
                  <Trophy className="h-5 w-5 stroke-[2.2]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-md bg-amber-200/90 dark:bg-amber-900/60 border border-amber-400 dark:border-amber-600 px-2 py-0.5 text-[10.5px] font-extrabold text-amber-950 dark:text-amber-200">
                      🏆 Trúng thưởng
                    </span>
                    {(p as any).discount && (
                      <span className="text-[12px] font-black text-amber-600 dark:text-amber-400">
                        {(p as any).discount}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 truncate text-[14px] font-bold text-slate-900 dark:text-white">
                    {p.title}
                  </h2>
                  {p.summary && (
                    <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                      {p.summary}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-amber-500" />
              </div>
            );
          }

          return (
            <Link
              key={p.id}
              to="/association/perks/$id"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3.5 bg-white dark:bg-[#131a26] shadow-xs hover:border-amber-500/40 transition active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700 text-[#003B95] dark:text-amber-400">
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.category && (
                    <span className="inline-block rounded-md bg-amber-100 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-600/80 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-300 shadow-2xs">
                      {p.category}
                    </span>
                  )}
                  {p.discount && (
                    <span className="text-[12px] font-black text-amber-600 dark:text-amber-400">
                      {p.discount}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 truncate text-[14px] font-bold text-slate-900 dark:text-white">
                  {p.title}
                </h2>
                {p.summary && (
                  <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-500 dark:text-slate-400">
                    {p.summary}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
