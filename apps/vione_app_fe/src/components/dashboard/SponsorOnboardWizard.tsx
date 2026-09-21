import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Package, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import {
  listSponsorPackagesFn,
  onboardSponsorFn,
  type Sponsor,
  type SponsorPackage,
} from "@/lib/sponsors.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

type Info = { name: string; contact: string; email: string; phone: string };

const TIER_KEY: Record<SponsorPackage["tier"], TKey> = {
  platinum: "sponsors.tier.platinum",
  gold: "sponsors.tier.gold",
  silver: "sponsors.tier.silver",
  bronze: "sponsors.tier.bronze",
};

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
const labelCls = "mb-1.5 block text-xs font-medium text-muted-foreground";

export function SponsorOnboardWizard({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (sponsor: Sponsor) => void;
}) {
  const t = useT();
  const fmt = useFmt();
  const onboardFn = useServerFn(onboardSponsorFn);
  const { data: packages } = useServerData<SponsorPackage[]>(() => listSponsorPackagesFn(), []);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [info, setInfo] = useState<Info>({ name: "", contact: "", email: "", phone: "" });

  const selected = useMemo(
    () => packages.find((p) => p.id === packageId) ?? null,
    [packages, packageId],
  );

  const reset = () => {
    setStep(0);
    setPackageId(null);
    setInfo({ name: "", contact: "", email: "", phone: "" });
  };

  const close = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  if (!open) return null;

  const next = () => {
    if (step === 0 && !selected) {
      toast.error(t("onb.err.package"));
      return;
    }
    if (step === 1 && !info.name.trim()) {
      toast.error(t("onb.err.name"));
      return;
    }
    setStep((s) => (s + 1) as 0 | 1 | 2);
  };
  const back = () => setStep((s) => (s - 1) as 0 | 1 | 2);

  const submit = async () => {
    if (!selected) {
      toast.error(t("onb.err.package"));
      return;
    }
    if (!info.name.trim()) {
      toast.error(t("onb.err.name"));
      return;
    }
    setSubmitting(true);
    try {
      const sponsor = await onboardFn({
        data: {
          packageId: selected.id,
          name: info.name.trim(),
          contact: info.contact.trim(),
          email: info.email.trim(),
          phone: info.phone.trim(),
        },
      });
      toast.success(t("onb.success"));
      reset();
      onCreated(sponsor);
    } catch {
      toast.error(t("onb.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [t("onb.step.package"), t("onb.step.info"), t("onb.step.review")];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("onb.title")}
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t("onb.title")}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={t("onb.cancel")}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <ol
            className="flex items-center gap-2"
            aria-label={t("onb.step.of", { n: step + 1, total: 3 })}
          >
            {steps.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary/15 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <span
                  className={`truncate text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && (
                  <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("onb.package.heading")}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.package.hint")}</p>
              </div>
              {packages.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                  {t("onb.package.none")}
                </p>
              ) : (
                <div className="space-y-2">
                  {packages.map((p) => {
                    const soldOut = p.sold >= p.available;
                    const active = p.id === packageId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setPackageId(p.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/50"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                          <span>
                            <span className="block text-sm font-semibold text-foreground">
                              {t(TIER_KEY[p.tier])}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {soldOut
                                ? t("onb.package.soldOut")
                                : t("pkg.remaining", { n: p.available - p.sold })}
                            </span>
                          </span>
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {fmt.money(p.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("onb.info.heading")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.info.hint")}</p>
              </div>
              <div>
                <label className={labelCls} htmlFor="onb-name">
                  {t("onb.field.name")}
                </label>
                <input
                  id="onb-name"
                  className={inputCls}
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="onb-contact">
                  {t("onb.field.contact")}
                </label>
                <input
                  id="onb-contact"
                  className={inputCls}
                  value={info.contact}
                  onChange={(e) => setInfo({ ...info, contact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="onb-email">
                    {t("onb.field.email")}
                  </label>
                  <input
                    id="onb-email"
                    type="email"
                    className={inputCls}
                    value={info.email}
                    onChange={(e) => setInfo({ ...info, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="onb-phone">
                    {t("onb.field.phone")}
                  </label>
                  <input
                    id="onb-phone"
                    className={inputCls}
                    value={info.phone}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && selected && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("onb.review.heading")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("onb.review.hint")}</p>
              </div>
              <dl className="divide-y divide-border rounded-xl border border-border bg-background">
                <Row label={t("onb.field.name")} value={info.name} />
                <Row label={t("onb.review.package")} value={t(TIER_KEY[selected.tier])} />
                <Row label={t("onb.review.value")} value={fmt.money(selected.price)} />
                {info.contact && <Row label={t("onb.field.contact")} value={info.contact} />}
                {info.email && <Row label={t("onb.field.email")} value={info.email} />}
                {info.phone && <Row label={t("onb.field.phone")} value={info.phone} />}
              </dl>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={step === 0 ? close : back}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {step === 0 ? (
              t("onb.cancel")
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> {t("onb.back")}
              </>
            )}
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("onb.next")} <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {submitting ? t("onb.submitting") : t("onb.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
