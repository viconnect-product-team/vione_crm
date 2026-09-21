import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Save, Sparkles, ImagePlus, X } from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useT } from "@/lib/i18n";
import { ICON_OPTIONS, OPPORTUNITY_TYPES, type OpportunityTypeKey } from "@/lib/opportunities-data";
import { getOpportunityFn, updateOpportunityFn } from "@/lib/opportunities.functions";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/date-format";
import { uploadProductMedia } from "@/lib/upload-media";
import { resolveMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/opportunities/$id/edit")({
  ssr: false,
  loader: async ({ params }) => {
    const res = await getOpportunityFn({ data: { id: params.id } });
    if (!res) throw notFound();
    return res;
  },
  component: EditOpportunityPage,
});

function EditOpportunityPage() {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const { opportunity: opp } = Route.useLoaderData();
  const saveOpp = useServerFn(updateOpportunityFn);

  const [title, setTitle] = useState(opp.title);
  const [desc, setDesc] = useState(opp.description);
  const [type, setType] = useState<OpportunityTypeKey>(opp.type);
  const [budgetMin, setBudgetMin] = useState(opp.budgetMin ? formatCurrencyInput(opp.budgetMin) : "");
  const [budgetMax, setBudgetMax] = useState(opp.budgetMax ? formatCurrencyInput(opp.budgetMax) : "");
  const [region, setRegion] = useState(opp.region);
  const [industry, setIndustry] = useState(opp.industry);
  const [deadline, setDeadline] = useState(opp.deadline.slice(0, 10));
  const [emoji, setEmoji] = useState(opp.emoji);
  const [status, setStatus] = useState<"open" | "closed">(opp.status);
  const [company, setCompany] = useState(opp.company ?? "");
  const [contactName, setContactName] = useState(opp.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(opp.contactPhone ?? "");
  const [contactTitle, setContactTitle] = useState(opp.contactTitle ?? "");
  const [image, setImage] = useState(opp.image || (opp as any).imageUrl || "");

  // Cho phép quản trị viên / nhân sự CRM chỉnh sửa cơ hội được đăng từ ứng dụng mobile
  const isOwner = opp.posterId === CURRENT_USER_ID;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || !region.trim() || !industry.trim()) return;
    await saveOpp({
      data: {
        id: opp.id,
        title: title.trim(),
        description: desc.trim(),
        type,
        budgetMin: budgetMin ? parseCurrencyInput(budgetMin) : undefined,
        budgetMax: budgetMax ? parseCurrencyInput(budgetMax) : undefined,
        region: region.trim(),
        industry: industry.trim(),
        deadline: new Date(deadline).toISOString(),
        emoji,
        status,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactTitle: contactTitle.trim() || undefined,
        company: company.trim() || undefined,
        image: image || undefined,
        imageUrl: image || undefined,
      },
    });
    await router.invalidate();
    toast.success(t("opp.toast.updated"));
    navigate({ to: "/opportunities/$id", params: { id: opp.id } });
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/opportunities/$id"
          params={{ id: opp.id }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("opp.detail.back")}
        </Link>
      </div>

      <PageHeader title={t("opp.edit.title")} subtitle={opp.title} />

      <Card className="mx-auto max-w-2xl">
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> {t("opp.edit.subtitle")}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.titleField")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.desc")}</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={5}
              required
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.type")}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as OpportunityTypeKey)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {OPPORTUNITY_TYPES.map((c: any) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.deadline")}</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.region")}</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.industry")}</label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Doanh nghiệp / Tổ chức</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="VD: Tập đoàn ViConnect"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Người liên hệ</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Chức vụ người liên hệ</label>
              <input
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                placeholder="VD: Giám đốc Kinh doanh"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Số điện thoại liên hệ</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                {t("opp.form.budgetMin")} (VNĐ)
              </label>
              <input
                value={budgetMin}
                onChange={(e) => setBudgetMin(formatCurrencyInput(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                {t("opp.form.budgetMax")} (VNĐ)
              </label>
              <input
                value={budgetMax}
                onChange={(e) => setBudgetMax(formatCurrencyInput(e.target.value))}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.edit.status")}</label>
            <div className="flex gap-2">
              {(["open", "closed"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    status === s
                      ? s === "open"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-foreground/40 bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: s === "open" ? "rgb(34 197 94)" : "rgb(148 163 184)" }}
                  />
                  {t(`opp.status.${s}` as "opp.status.open" | "opp.status.closed")}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{t("opp.edit.statusHint")}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">{t("opp.form.icon")}</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setEmoji(i)}
                  className={`h-9 w-9 rounded-lg border text-lg transition ${
                    emoji === i
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              Hình ảnh cơ hội (doanh nghiệp / dự án đính kèm)
            </label>
            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-border bg-secondary/30 p-2.5">
                <div className="relative h-48 w-full overflow-hidden rounded-lg bg-black/10">
                  <img
                    src={resolveMediaUrl(image) || image}
                    alt={title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = "0.5";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-2 right-2 rounded-lg bg-black/60 p-1.5 text-white hover:bg-black/80 transition shadow-md"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                  <span className="truncate font-mono">{image}</span>
                  <label className="cursor-pointer text-xs font-semibold text-primary hover:underline shrink-0">
                    Thay ảnh khác
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const uploaded = await uploadProductMedia(file, opp.posterId);
                          setImage(uploaded);
                          toast.success("Tải ảnh mới thành công");
                        } catch (err: any) {
                          toast.error(err?.message || "Lỗi tải ảnh");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 hover:bg-secondary/40 transition">
                <ImagePlus className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Chưa có hình ảnh. Tải ảnh giới thiệu cơ hội / dự án từ thiết bị
                </p>
                <label className="cursor-pointer rounded-lg bg-primary/10 border border-primary/30 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition">
                  Chọn ảnh từ máy tính
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const uploaded = await uploadProductMedia(file, opp.posterId);
                        setImage(uploaded);
                        toast.success("Tải ảnh thành công");
                      } catch (err: any) {
                        toast.error(err?.message || "Lỗi tải ảnh");
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Link
              to="/opportunities/$id"
              params={{ id: opp.id }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("opp.form.cancel")}
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Save className="h-4 w-4" /> {t("opp.edit.save")}
            </button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
