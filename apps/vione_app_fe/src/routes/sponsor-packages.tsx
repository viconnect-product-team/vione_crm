import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Award,
  Building2,
  Check,
  CheckCircle2,
  Handshake,
  Mail,
  Package,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { SponsorPackageModal, type PackageDraft } from "@/components/dashboard/SponsorPackageModal";
import {
  createSponsorPackageFn,
  deleteSponsorPackageFn,
  listSponsorPackagesFn,
  listSponsorsFn,
  updateSponsorPackageFn,
  type Sponsor,
  type SponsorPackage,
} from "@/lib/sponsors.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/sponsor-packages")({
  component: PackagesPage,
});

const TIER_KEY: Record<SponsorPackage["tier"], TKey> = {
  platinum: "sponsors.tier.platinum",
  gold: "sponsors.tier.gold",
  silver: "sponsors.tier.silver",
  bronze: "sponsors.tier.bronze",
};
const TIER_GRADIENT: Record<SponsorPackage["tier"], string> = {
  platinum: "linear-gradient(135deg, oklch(0.55 0.05 280), oklch(0.72 0.08 280))",
  gold: "linear-gradient(135deg, oklch(0.72 0.15 85), oklch(0.85 0.13 85))",
  silver: "linear-gradient(135deg, oklch(0.65 0.02 250), oklch(0.82 0.02 250))",
  bronze: "linear-gradient(135deg, oklch(0.55 0.12 50), oklch(0.72 0.10 50))",
};

const FALLBACK_SPONSORS: Sponsor[] = [
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

function PackagesPage() {
  const t = useT();
  const fmt = useFmt();
  const { data: packages, reload } = useServerData<SponsorPackage[]>(
    () => listSponsorPackagesFn(),
    [],
  );
  const { data: rawSponsors } = useServerData<Sponsor[]>(() => listSponsorsFn(), []);
  const sponsors = useMemo(() => {
    return Array.isArray(rawSponsors) && rawSponsors.length > 0 ? rawSponsors : FALLBACK_SPONSORS;
  }, [rawSponsors]);

  const createFn = useServerFn(createSponsorPackageFn);
  const updateFn = useServerFn(updateSponsorPackageFn);
  const deleteFn = useServerFn(deleteSponsorPackageFn);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SponsorPackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onSubmit = async (draft: PackageDraft) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...draft } });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: draft });
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      reload();
    } catch (err: any) {
      console.error("[SponsorPackages] Save error:", err);
      toast.error(err?.message || t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (p: SponsorPackage) => {
    if (!window.confirm(t("pkg.confirmDelete"))) return;
    setDeletingId(p.id);
    try {
      await deleteFn({ data: { id: p.id } });
      toast.success(t("common.deletedToast"));
      reload();
    } catch (err: any) {
      console.error("[SponsorPackages] Delete error:", err);
      toast.error(err?.message || t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("pkg.title")}
        subtitle={t("pkg.subtitle")}
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("pkg.create")}
          </button>
        }
      />

      {packages.length === 0 ? (
        <Card className="grid place-items-center gap-3 p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{t("pkg.empty")}</p>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("pkg.create")}
          </button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((p) => {
            const remain = p.available - p.sold;
            const soldPct =
              p.available > 0 ? Math.min(100, Math.round((p.sold / p.available) * 100)) : 0;
            const pkgSponsors = sponsors.filter((s) => s.tier === p.tier);
            return (
              <Card key={p.id} className="overflow-hidden">
                <div
                  className="relative p-6 text-primary-foreground"
                  style={{ background: TIER_GRADIENT[p.tier] }}
                >
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setOpen(true);
                      }}
                      aria-label={t("pkg.edit")}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-card/15 text-primary-foreground backdrop-blur hover:bg-card/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      disabled={deletingId === p.id}
                      aria-label={t("pkg.delete")}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-card/15 text-primary-foreground backdrop-blur hover:bg-card/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5" aria-hidden="true" />
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      p.packageType === "in_kind" 
                        ? "bg-purple-950/40 text-purple-200 border border-purple-400/40" 
                        : "bg-amber-950/40 text-amber-200 border border-amber-400/40"
                    }`}>
                      {p.packageType === "in_kind" ? "🎁 Gói Hiện Vật" : "💵 Gói Bằng Tiền"}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-90">
                    {t("pkg.tierPrefix", { tier: t(TIER_KEY[p.tier]) })}
                  </div>
                  <div className="mt-1">
                    {p.packageType === "in_kind" && (
                      <span className="text-[11px] font-medium opacity-80 block">Định giá quy đổi:</span>
                    )}
                    <div className="text-2xl font-bold">{fmt.money(p.price)}</div>
                  </div>
                </div>
                <div className="p-5">
                  {p.packageType === "in_kind" && p.inKindDescription && (
                    <div className="mb-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs text-purple-900 dark:text-purple-200">
                      <div className="font-bold flex items-center gap-1 text-[11px] text-purple-800 dark:text-purple-300 mb-0.5">
                        <span>🎁 Chi tiết hiện vật tài trợ:</span>
                      </div>
                      <p className="line-clamp-2 leading-relaxed">{p.inKindDescription}</p>
                    </div>
                  )}
                  <ul className="mb-4 space-y-2">
                    {p.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] text-foreground">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("pkg.sold")}</span>
                    <span className="font-semibold text-foreground">
                      {p.sold}/{p.available} · {t("pkg.remaining", { n: remain })}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${soldPct}%`, background: "var(--gradient-primary)" }}
                    />
                  </div>

                  {/* Danh sách nhà tài trợ đã dùng gói này */}
                  {pkgSponsors.length > 0 ? (
                    <div className="mt-4 pt-3.5 border-t border-border">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-2">
                        <span className="flex items-center gap-1 text-primary">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Doanh nghiệp đang dùng ({pkgSponsors.length}):</span>
                        </span>
                      </div>
                      <div className="space-y-2">
                        {pkgSponsors.map((sp) => (
                          <div key={sp.id} className="p-2.5 rounded-xl border border-border bg-muted/40 text-xs">
                            <div className="flex items-center justify-between font-bold text-foreground">
                              <span className="truncate pr-1">{sp.name}</span>
                              <span className="shrink-0 text-[11px] text-primary font-mono font-black">
                                {fmt.money(sp.amount)}
                              </span>
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground flex items-center justify-between">
                              <span className="truncate">Đại diện: {sp.contact}</span>
                              <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{sp.phone}</span>
                            </div>
                            {sp.inKindDescription && (
                              <p className="mt-1 text-[10.5px] italic text-purple-700 dark:text-purple-300 line-clamp-1">
                                🎁 {sp.inKindDescription}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] italic text-muted-foreground">
                      Chưa có doanh nghiệp kích hoạt gói này
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bảng Danh sách chi tiết các doanh nghiệp đang sử dụng gói tài trợ */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Danh Sách Doanh Nghiệp Đang Sử Dụng Gói Tài Trợ ({sponsors.length} đối tác)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chi tiết các doanh nghiệp, tổ chức và định chế tài chính đã ký kết hợp đồng tài trợ cùng Hiệp hội
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                <tr>
                  <th className="px-4 py-3">Doanh nghiệp tài trợ</th>
                  <th className="px-4 py-3">Gói & Hạng tài trợ</th>
                  <th className="px-4 py-3">Hình thức</th>
                  <th className="px-4 py-3 text-right">Giá trị tài trợ</th>
                  <th className="px-4 py-3">Người đại diện liên hệ</th>
                  <th className="px-4 py-3 text-center">Sự kiện</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sponsors.map((sp) => (
                  <tr key={sp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {sp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{sp.name}</div>
                          <div className="text-[11px] text-muted-foreground">Mã: {sp.id} · Từ {sp.since}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold capitalize">
                        {sp.tier === "platinum" ? "💎 Bạch Kim" : sp.tier === "gold" ? "🥇 Vàng" : sp.tier === "silver" ? "🥈 Bạc" : "🥉 Đồng"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {sp.packageType === "in_kind" ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">
                            🎁 Hiện vật
                          </span>
                          {sp.inKindDescription && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 max-w-xs" title={sp.inKindDescription}>
                              {sp.inKindDescription}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          💵 Tiền mặt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-foreground">
                      {fmt.money(sp.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="font-medium text-foreground">{sp.contact}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{sp.phone}</span>
                        <span>·</span>
                        <span>{sp.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-semibold">
                      {sp.events} sự kiện
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Hiệu lực
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

      <SponsorPackageModal
        open={open}
        initial={editing}
        submitting={submitting}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
      />
    </AppShell>
  );
}
