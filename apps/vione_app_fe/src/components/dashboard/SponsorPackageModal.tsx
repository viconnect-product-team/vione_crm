import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { SponsorPackage } from "@/lib/sponsors.functions";

export type PackageDraft = {
  tier: SponsorPackage["tier"];
  price: number;
  packageType: "cash" | "in_kind";
  inKindDescription: string;
  available: number;
  sold: number;
  benefits: string[];
};

const TIERS: SponsorPackage["tier"][] = ["platinum", "gold", "silver", "bronze"];

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function SponsorPackageModal({
  open,
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: SponsorPackage | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (draft: PackageDraft) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<PackageDraft>({
    tier: "gold",
    price: 0,
    packageType: "cash",
    inKindDescription: "",
    available: 0,
    sold: 0,
    benefits: [],
  });
  // Raw text for numeric inputs so users can clear the field and retype
  // without the value snapping back to 0 on every keystroke.
  const [raw, setRaw] = useState({ price: "0", available: "0", sold: "0" });

  useEffect(() => {
    if (open) {
      setDraft(
        initial
          ? {
              tier: initial.tier,
              price: initial.price,
              packageType: initial.packageType || "cash",
              inKindDescription: initial.inKindDescription || "",
              available: initial.available,
              sold: initial.sold,
              benefits: [...initial.benefits],
            }
          : { tier: "gold", price: 0, packageType: "cash", inKindDescription: "", available: 0, sold: 0, benefits: [] },
      );
      setRaw(
        initial
          ? {
              price: String(initial.price),
              available: String(initial.available),
              sold: String(initial.sold),
            }
          : { price: "0", available: "0", sold: "0" },
      );
    }
  }, [open, initial]);

  if (!open) return null;

  const setBenefit = (i: number, v: string) =>
    setDraft((d) => ({ ...d, benefits: d.benefits.map((b, idx) => (idx === i ? v : b)) }));
  const removeBenefit = (i: number) =>
    setDraft((d) => ({ ...d, benefits: d.benefits.filter((_, idx) => idx !== i) }));
  const addBenefit = () => setDraft((d) => ({ ...d, benefits: [...d.benefits, ""] }));

  const submit = () => {
    onSubmit({
      ...draft,
      price: Math.max(0, Number(raw.price) || 0),
      available: Math.max(0, Number(raw.available) || 0),
      sold: Math.max(0, Number(raw.sold) || 0),
      benefits: draft.benefits.map((b) => b.trim()).filter(Boolean),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? t("pkg.edit") : t("pkg.create")}
      onClick={() => !submitting && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-base font-semibold text-foreground">
            {initial ? t("pkg.edit") : t("pkg.create")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("onb.cancel")}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="pkg-tier">
                {t("pkg.field.tier")}
              </label>
              <select
                id="pkg-tier"
                className={inputCls}
                value={draft.tier}
                onChange={(e) =>
                  setDraft({ ...draft, tier: e.target.value as SponsorPackage["tier"] })
                }
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {t(`sponsors.tier.${tier}` as never)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pkg-type">
                Hình thức gói tài trợ
              </label>
              <select
                id="pkg-type"
                className={inputCls}
                value={draft.packageType}
                onChange={(e) =>
                  setDraft({ ...draft, packageType: e.target.value as "cash" | "in_kind" })
                }
              >
                <option value="cash">💵 Tài trợ bằng Tiền</option>
                <option value="in_kind">🎁 Tài trợ Hiện vật</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls} htmlFor="pkg-price">
                {draft.packageType === "in_kind" ? "Định giá quy đổi tương đương (VNĐ)" : t("pkg.field.price")}
              </label>
              <input
                id="pkg-price"
                type="number"
                min={0}
                className={inputCls}
                value={raw.price}
                onChange={(e) => setRaw({ ...raw, price: e.target.value })}
              />
            </div>
            {draft.packageType === "in_kind" && (
              <div>
                <label className={labelCls} htmlFor="pkg-inkind-desc">
                  Mô tả chi tiết hiện vật tài trợ
                </label>
                <input
                  id="pkg-inkind-desc"
                  type="text"
                  placeholder="Ví dụ: 200 bộ quà tặng cao cấp, Teabreak tiệc trà, Địa điểm tổ chức..."
                  className={inputCls}
                  value={draft.inKindDescription}
                  onChange={(e) => setDraft({ ...draft, inKindDescription: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="pkg-available">
                {t("pkg.field.available")}
              </label>
              <input
                id="pkg-available"
                type="number"
                min={0}
                className={inputCls}
                value={raw.available}
                onChange={(e) => setRaw({ ...raw, available: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pkg-sold">
                {t("pkg.field.sold")}
              </label>
              <input
                id="pkg-sold"
                type="number"
                min={0}
                className={inputCls}
                value={raw.sold}
                onChange={(e) => setRaw({ ...raw, sold: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t("pkg.field.benefits")}</label>
            <div className="space-y-2">
              {draft.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    placeholder={t("pkg.benefit.ph")}
                    aria-label={t("pkg.field.benefits")}
                    value={b}
                    onChange={(e) => setBenefit(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefit(i)}
                    aria-label={t("pkg.benefit.remove")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addBenefit}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> {t("pkg.benefit.add")}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {t("onb.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting ? t("onb.submitting") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
