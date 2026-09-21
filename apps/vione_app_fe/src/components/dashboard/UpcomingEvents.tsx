import { Clock, MapPin } from "lucide-react";
import { useT, useLang } from "@/lib/i18n";

const events = [
  {
    day: "15",
    monthVi: "TH 6",
    monthEn: "JUN",
    titleVi: "Diễn đàn Kinh tế Việt Nam 2024",
    titleEn: "Vietnam Economic Forum 2024",
    time: "08:00 - 17:00",
    locVi: "Trung tâm Hội nghị Quốc gia",
    locEn: "National Convention Center",
    count: 256,
    accent: "oklch(0.55 0.20 270)",
  },
  {
    day: "22",
    monthVi: "TH 6",
    monthEn: "JUN",
    titleVi: "Workshop: Chuyển đổi số trong doanh nghiệp",
    titleEn: "Workshop: Digital transformation for enterprises",
    time: "09:00 - 12:00",
    locVi: "Toà nhà VBA, Hà Nội",
    locEn: "VBA Building, Hanoi",
    count: 128,
    accent: "oklch(0.65 0.18 340)",
  },
  {
    day: "05",
    monthVi: "TH 7",
    monthEn: "JUL",
    titleVi: "Gala Dinner - Kết nối doanh nhân",
    titleEn: "Gala Dinner - Business Networking",
    time: "18:00 - 21:00",
    locVi: "Khách sạn Melia Hanoi",
    locEn: "Melia Hanoi Hotel",
    count: 198,
    accent: "oklch(0.65 0.16 155)",
  },
];

export function UpcomingEvents() {
  const t = useT();
  const { lang } = useLang();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t("events.upcoming.title")}</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary-glow">
          {t("events.viewAll")}
        </button>
      </div>
      <div className="space-y-3">
        {events.map((e, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-xl border border-border p-3 transition hover:border-primary/30 hover:bg-secondary/40"
          >
            <div
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-primary-foreground"
              style={{ background: e.accent }}
            >
              <span className="text-lg font-bold leading-none">{e.day}</span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-wide opacity-90">
                {lang === "vi" ? e.monthVi : e.monthEn}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {lang === "vi" ? e.titleVi : e.titleEn}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {e.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {lang === "vi" ? e.locVi : e.locEn}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{e.count}</div>
              <div className="text-[10px] text-muted-foreground">{t("events.registered")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
