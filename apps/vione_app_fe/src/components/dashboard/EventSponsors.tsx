import { useMemo } from "react";
import { Award, Building2, CheckCircle2, Handshake, Mail, Phone } from "lucide-react";
import { useFmt, useT } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { listSponsorsFn, type Sponsor } from "@/lib/sponsors.functions";

const FALLBACK_EVENT_SPONSORS: Sponsor[] = [
  {
    id: "SP-001",
    name: "Tập đoàn Công nghệ SunTech Global",
    tier: "platinum",
    sponsorType: "regular",
    packageType: "cash",
    contact: "Nguyễn Văn Hùng (Chủ tịch HĐQT)",
    email: "hung.nv@suntech-global.vn",
    phone: "0908 123 456",
    amount: 200000000,
    events: 8,
    since: "2023-01-15",
    status: "active",
  },
  {
    id: "SP-002",
    name: "Công ty Cổ phần Trầm Hương & Yến Sào Hoàng Gia",
    tier: "gold",
    sponsorType: "regular",
    packageType: "in_kind",
    inKindDescription: "200 bộ quà tặng Yến Sào & Trầm Hương Thượng Hạng dành tặng tất cả CEO",
    contact: "Trần Mai Phương (Tổng Giám Đốc)",
    email: "phuong.tm@hoanggiagroup.vn",
    phone: "0912 345 678",
    amount: 100000000,
    events: 5,
    since: "2023-06-20",
    status: "active",
  },
  {
    id: "SP-003",
    name: "Ngân hàng TMCP Tiên Phong (TPBank) - Khối SME",
    tier: "silver",
    sponsorType: "regular",
    packageType: "cash",
    contact: "Lê Minh Tuấn (GĐ Khối KHDN)",
    email: "tuanlm@tpb.com.vn",
    phone: "0983 999 888",
    amount: 50000000,
    events: 3,
    since: "2024-02-10",
    status: "active",
  },
  {
    id: "SP-004",
    name: "Artisan Coffee & Roastery",
    tier: "bronze",
    sponsorType: "new",
    packageType: "in_kind",
    inKindDescription: "Toàn bộ quầy cà phê pha máy Espresso cao cấp & bánh teabreak",
    contact: "Phạm Thu Hà (Nhà Sáng Lập)",
    email: "ha.pham@artisancoffee.vn",
    phone: "0934 567 890",
    amount: 20000000,
    events: 2,
    since: "2024-05-18",
    status: "active",
  },
];

const TIER_META: Record<
  Sponsor["tier"],
  { label: string; icon: string; border: string; bg: string; text: string }
> = {
  platinum: {
    label: "Nhà Tài Trợ Kim Cương / Bạch Kim",
    icon: "💎",
    border: "border-sky-500/30",
    bg: "bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent",
    text: "text-sky-600 dark:text-sky-400",
  },
  gold: {
    label: "Nhà Tài Trợ Vàng",
    icon: "🥇",
    border: "border-amber-500/30",
    bg: "bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent",
    text: "text-amber-600 dark:text-amber-400",
  },
  silver: {
    label: "Nhà Tài Trợ Bạc",
    icon: "🥈",
    border: "border-slate-400/30",
    bg: "bg-gradient-to-r from-slate-400/10 via-slate-300/5 to-transparent",
    text: "text-slate-600 dark:text-slate-300",
  },
  bronze: {
    label: "Nhà Tài Trợ Đồng",
    icon: "🥉",
    border: "border-orange-600/30",
    bg: "bg-gradient-to-r from-orange-600/10 via-amber-700/5 to-transparent",
    text: "text-orange-700 dark:text-orange-400",
  },
};

/**
 * Sponsors / partners showcase section for the event detail page.
 */
export function EventSponsors({ sponsors: propSponsors }: { sponsors?: Sponsor[] }) {
  const t = useT();
  const fmt = useFmt();
  const { data: rawSponsors } = useServerData<Sponsor[]>(() => listSponsorsFn(), []);

  const allSponsors = useMemo(() => {
    if (propSponsors && propSponsors.length > 0) return propSponsors;
    if (Array.isArray(rawSponsors) && rawSponsors.length > 0) return rawSponsors;
    return FALLBACK_EVENT_SPONSORS;
  }, [propSponsors, rawSponsors]);

  const tiers: Sponsor["tier"][] = ["platinum", "gold", "silver", "bronze"];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Đơn Vị Đồng Hành & Nhà Tài Trợ Sự Kiện ({allSponsors.length})</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          Được tài trợ bởi các doanh nghiệp hội viên tiên phong
        </span>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => {
          const tierSponsors = allSponsors.filter((s) => s.tier === tier);
          if (tierSponsors.length === 0) return null;
          const meta = TIER_META[tier];

          return (
            <div
              key={tier}
              className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${meta.text}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {tierSponsors.length} doanh nghiệp
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tierSponsors.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-card/90 p-3.5 shadow-xs backdrop-blur-xs hover:border-primary/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                            {sp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {sp.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {sp.contact}
                            </p>
                          </div>
                        </div>

                        {sp.packageType === "in_kind" ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                            🎁 Hiện vật
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            💵 Tiền mặt
                          </span>
                        )}
                      </div>

                      {sp.inKindDescription && (
                        <p className="mt-2 text-[11px] italic text-purple-800 dark:text-purple-300 bg-purple-500/10 p-2 rounded-lg leading-relaxed">
                          🎁 {sp.inKindDescription}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{sp.phone}</span>
                        </span>
                      </div>
                      <span className="font-mono font-black text-foreground">
                        {fmt.money(sp.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
