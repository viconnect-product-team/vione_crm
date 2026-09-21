// BC-3.1F — Report user dialog.
// Presentation only: collects a category + optional details and submits via the
// GlobalNetworkSDK abuse channel. Never exposes reporter identity; the reported
// user cannot see reports (enforced by RLS). Keyboard + screen-reader friendly.

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import { GN_REPORT_CATEGORIES, type GnReportCategory } from "@/lib/global-network/abuse.types";
import { networkErrorTKey } from "@/lib/global-network/error-messages";
import { useT, type TKey } from "@/lib/i18n";

export function ReportUserDialog({
  open,
  onOpenChange,
  targetUserId,
  connectionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string | null;
  connectionId?: string | null;
}) {
  const t = useT();
  const [category, setCategory] = useState<GnReportCategory>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!targetUserId) return;
    setBusy(true);
    try {
      await GlobalNetworkSDK.abuse.report({
        reportedUserId: targetUserId,
        category,
        details: details.trim() || undefined,
        connectionId: connectionId ?? undefined,
      });
      toast.success(t("connect.network.toast.reported"));
      setDetails("");
      setCategory("spam");
      onOpenChange(false);
    } catch (e) {
      toast.error(t(networkErrorTKey(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("connect.network.report.title")}</DialogTitle>
          <DialogDescription>{t("connect.network.report.desc")}</DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2" disabled={busy}>
          <legend className="sr-only">{t("connect.network.report.title")}</legend>
          {GN_REPORT_CATEGORIES.map((c: any) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm text-foreground transition hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="gn-report-category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="h-4 w-4"
              />
              {t(`connect.network.report.category.${c}` as TKey)}
            </label>
          ))}

          <label className="mt-2 text-sm font-medium text-foreground" htmlFor="gn-report-details">
            {t("connect.network.report.detailsLabel")}
          </label>
          <textarea
            id="gn-report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
            placeholder={t("connect.network.report.detailsPlaceholder")}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </fieldset>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {t("connect.network.report.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !targetUserId}
            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("connect.network.report.submit")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
