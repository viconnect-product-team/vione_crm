import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bell, FileText, LogIn, Package, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, Pill } from "@/components/dashboard/PageKit";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFmt, useT, type TKey } from "@/lib/i18n";
import type { QuoteStatus } from "@/lib/marketplace-data";
import { cancelQuoteFn, listMyQuotesFn } from "@/lib/marketplace.functions";
import { useSessionStatus } from "@/hooks/use-session-status";

const STATUS_COLOR: Record<QuoteStatus, "primary" | "success" | "neutral" | "warning" | "danger"> =
  {
    sent: "neutral",
    viewing: "warning",
    confirmed: "success",
    rejected: "danger",
    cancelled: "danger",
  };
const STATUS_KEY: Record<QuoteStatus, TKey> = {
  sent: "mk.qs.sent",
  viewing: "mk.qs.viewing",
  confirmed: "mk.qs.confirmed",
  rejected: "mk.qs.rejected",
  cancelled: "mk.qs.cancelled",
};

export const Route = createFileRoute("/marketplace/my-quotes")({
  component: MyQuotesPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <Card className="p-6 text-sm text-destructive">{error.message}</Card>
    </AppShell>
  ),
});

type MyQuote = Awaited<ReturnType<typeof listMyQuotesFn>>[number];

function MyQuotesPage() {
  const t = useT();
  const fmt = useFmt();
  const cancelQuote = useServerFn(cancelQuoteFn);
  const listMyQuotes = useServerFn(listMyQuotesFn);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [quotes, setQuotes] = useState<MyQuote[]>([]);
  const sessionStatus = useSessionStatus();

  const refresh = useCallback(async () => {
    try {
      const rows = await listMyQuotes();
      setQuotes(rows);
    } catch {
      /* ignore – user may not be signed in */
    }
  }, [listMyQuotes]);

  // Auth gate: server functions require requireSupabaseAuth, so render a proper
  // signed-out state instead of an empty list when there is no session. Driven
  // by the unified session status to avoid flashing before the session is known.
  useEffect(() => {
    if (sessionStatus === "authenticated") void refresh();
    else if (sessionStatus === "anonymous") setQuotes([]);
  }, [sessionStatus, refresh]);

  // Polling: refresh my quotes every 15 s (replaces Supabase realtime channel)
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    const id = setInterval(() => void refresh(), 15_000);
    return () => clearInterval(id);
  }, [sessionStatus, refresh]);


  const cancel = async (id: string) => {
    setBusyId(id);
    setConfirmId(null);
    try {
      await cancelQuote({ data: { id, reason: reason.trim() } });
      await refresh();
      setReason("");
      toast.success(t("mk.qs.cancelled.toast"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <Link
        to="/marketplace"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("mk.detail.back")}
      </Link>

      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("mk.myq.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("mk.myq.subtitle")}</p>
      </div>

      {sessionStatus === "checking" ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{t("acct.loading")}</Card>
      ) : sessionStatus === "anonymous" ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <LogIn className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-base font-semibold text-foreground">{t("mk.myq.authTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("mk.myq.authDesc")}</p>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            {t("mk.myq.authCta")}
          </Link>
        </Card>
      ) : quotes.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">{t("mk.myq.empty")}</Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{q.productEmoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {q.productTitle}
                    </div>
                    <Pill color={STATUS_COLOR[q.status]}>{t(STATUS_KEY[q.status])}</Pill>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{q.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {q.quantity} ×
                    </span>
                    <span>
                      {t("mk.myq.sentAt")}: {fmt.date(q.createdAt)}
                    </span>
                    <span>
                      {t("mk.myq.updatedAt")}: {fmt.date(q.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to="/marketplace/$productId"
                      params={{ productId: q.productId }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("mk.myq.viewProduct")}
                    </Link>
                    {q.reminderCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                        <Bell className="h-3 w-3" />
                        {q.reminderCount} {t("mk.qs.reminders")}
                      </span>
                    )}
                    {(q.status === "sent" || q.status === "viewing") && (
                      <button
                        onClick={() => setConfirmId(q.id)}
                        disabled={busyId === q.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        {t("mk.qs.cancel")}
                      </button>
                    )}
                  </div>
                  {q.status === "cancelled" && q.cancelReason && (
                    <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {t("mk.qs.cancel.reason.shown")}:
                      </span>{" "}
                      {q.cancelReason}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmId(null);
            setReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mk.qs.cancel.confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("mk.qs.cancel.confirm.desc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("mk.qs.cancel.reason.label")}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("mk.qs.cancel.reason.ph")}
              maxLength={500}
              rows={3}
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-destructive">
                {reason.trim().length < 10 ? t("mk.qs.cancel.reason.min") : ""}
              </span>
              <span className="text-muted-foreground">
                {t("mk.qs.cancel.reason.count").replace("{n}", String(reason.length))}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("mk.qs.cancel.confirm.keep")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={reason.trim().length < 10}
              onClick={(e) => {
                if (reason.trim().length < 10) {
                  e.preventDefault();
                  return;
                }
                if (confirmId) cancel(confirmId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {t("mk.qs.cancel.confirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
