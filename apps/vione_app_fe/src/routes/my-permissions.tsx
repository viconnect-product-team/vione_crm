import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, ShieldCheck, Star } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useRole } from "@/hooks/use-role";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { listMyAssociationsFn, type MyAssociation } from "@/lib/associations.functions";
import { baseLang, useLang, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/my-permissions")({
  head: () => ({
    meta: [
      { title: "Phân quyền của tôi — ViOne" },
      {
        name: "description",
        content: "Xem vai trò và những thao tác bạn được phép thực hiện trong hệ thống.",
      },
    ],
  }),
  component: MyPermissionsPage,
});

type EffectiveRole = "platform_admin" | "admin" | "member";
type Access = "full" | "scoped" | "own" | "none";

type Row = {
  feature: { vi: string; en: string };
  platform_admin: Access;
  admin: Access;
  member: Access;
};

// Mirrors the RLS-enforced access matrix used in /platform/permissions.
const ROWS: Row[] = [
  {
    feature: { vi: "Quản lý hiệp hội", en: "Manage associations" },
    platform_admin: "full",
    admin: "none",
    member: "none",
  },
  {
    feature: { vi: "Chỉ định quản trị viên hiệp hội", en: "Assign association admins" },
    platform_admin: "full",
    admin: "none",
    member: "none",
  },
  {
    feature: { vi: "Cài đặt & logo hiệp hội", en: "Association settings & logo" },
    platform_admin: "full",
    admin: "scoped",
    member: "none",
  },
  {
    feature: { vi: "Hội viên & doanh nghiệp", en: "Members & companies" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Sự kiện & đăng ký", en: "Events & registrations" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Tài chính & hoá đơn", en: "Finance & invoices" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Nhà tài trợ", en: "Sponsors" },
    platform_admin: "full",
    admin: "scoped",
    member: "none",
  },
  {
    feature: { vi: "Truyền thông & email", en: "Communication & email" },
    platform_admin: "full",
    admin: "scoped",
    member: "none",
  },
  {
    feature: { vi: "Tin tức & tài liệu", en: "News & documents" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Biểu quyết & quản trị", en: "Voting & governance" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Sàn cơ hội & sản phẩm", en: "Marketplace & opportunities" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Thẻ hội viên & check-in", en: "Member card & check-in" },
    platform_admin: "full",
    admin: "scoped",
    member: "own",
  },
  {
    feature: { vi: "Hồ sơ cá nhân", en: "Personal profile" },
    platform_admin: "full",
    admin: "own",
    member: "own",
  },
];

const TONE: Record<Access, { bg: string; fg: string }> = {
  full: { bg: "oklch(0.93 0.07 155)", fg: "oklch(0.40 0.16 155)" },
  scoped: { bg: "oklch(0.94 0.05 220)", fg: "oklch(0.42 0.15 220)" },
  own: { bg: "oklch(0.94 0.09 75)", fg: "oklch(0.45 0.14 65)" },
  none: { bg: "oklch(0.94 0.01 250)", fg: "oklch(0.55 0.02 250)" },
};

function AccessBadge({ access, label }: { access: Access; label: string }) {
  const s = TONE[access];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {access === "none" ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}

function MyPermissionsPage() {
  const t = useT();
  const { lang } = useLang();
  const { isPlatformAdmin, isAdmin, loading } = useRole();

  const fetchMine = useServerFn(listMyAssociationsFn);
  const { data: myAssocs } = useServerData<MyAssociation[]>(() => fetchMine(), []);

  const effective: EffectiveRole = isPlatformAdmin
    ? "platform_admin"
    : isAdmin
      ? "admin"
      : "member";
  const roleLabel = t(`myperm.you.${effective}` as TKey);

  const legend: Record<Access, string> = {
    full: t("perm.legend.full"),
    scoped: t("perm.legend.scoped"),
    own: t("perm.legend.own"),
    none: t("perm.legend.none"),
  };

  function roleBadge(role: string) {
    const key =
      role === "admin" ? "admin" : role === "platform_admin" ? "platform_admin" : "member";
    return t(`perm.role.${key}` as TKey);
  }

  return (
    <AppShell>
      <PageHeader title={t("myperm.title")} subtitle={t("myperm.subtitle")} />

      {/* Effective role summary */}
      <Card className="mb-6 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("myperm.role")}
            </div>
            <div className="text-lg font-bold text-foreground">{roleLabel}</div>
          </div>
        </div>
      </Card>

      {/* Memberships */}
      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">{t("myperm.roleCard.title")}</h3>
        </div>
        {!loading && (myAssocs?.length ?? 0) === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("myperm.noAssoc")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left">{t("myperm.assoc")}</th>
                  <th className="px-5 py-3 text-left">{t("myperm.role")}</th>
                  <th className="px-5 py-3 text-right">{t("myperm.active")}</th>
                </tr>
              </thead>
              <tbody>
                {(myAssocs ?? []).map((a: any) => (
                  <tr
                    key={a.associationId}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{a.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-foreground">
                        {roleBadge(a.role)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {a.isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {t("myperm.active")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Personalized capabilities */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">{t("myperm.caps.title")}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("myperm.caps.subtitle")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">{t("perm.col.feature")}</th>
                <th className="px-5 py-3 text-right">{roleLabel}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const access = r[effective];
                return (
                  <tr
                    key={i}
                    className="border-b border-border last:border-0 hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{r.feature[baseLang(lang)]}</td>
                    <td className="px-5 py-3 text-right">
                      <AccessBadge access={access} label={legend[access]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
