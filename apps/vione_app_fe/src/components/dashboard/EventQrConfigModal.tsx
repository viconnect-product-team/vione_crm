import { useEffect, useState } from "react";
import { X, QrCode } from "lucide-react";
import { useT } from "@/lib/i18n";
import { QR_FIELDS, type QrField } from "@/lib/events.functions";

export function EventQrConfigModal({
  open,
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial: QrField[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (fields: QrField[]) => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState<QrField[]>(initial);

  useEffect(() => {
    if (open) setSelected(initial.length ? initial : ["registration_code"]);
  }, [open, initial]);

  if (!open) return null;

  const toggle = (f: QrField) =>
    setSelected((prev) => (prev.includes(f) ? prev.filter((x: any) => x !== f) : [...prev, f]));

  const valid = selected.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("edetail.qr.modalTitle")}
      onClick={() => !submitting && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <QrCode className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("edetail.qr.modalTitle")}
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

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <p className="text-sm text-muted-foreground">{t("edetail.qr.modalHint")}</p>
          <fieldset className="space-y-2">
            {QR_FIELDS.map((f) => {
              const on = selected.includes(f);
              return (
                <label
                  key={f}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-secondary/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))] focus-visible:outline-none"
                    checked={on}
                    onChange={() => toggle(f)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {t(`ewz.qr.${f}` as never)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t(`ewz.qr.${f}.desc` as never)}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {!valid && (
            <p className="text-xs font-medium text-destructive">{t("edetail.qr.atLeastOne")}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("onb.cancel")}
          </button>
          <button
            type="button"
            onClick={() => valid && onSubmit(selected)}
            disabled={submitting || !valid}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("edetail.qr.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
