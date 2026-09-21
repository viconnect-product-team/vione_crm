// BC-6.4 — Introduction Outcome workspace UI.
// Requester tab: their outcomes with manual actions.
// Intermediary tab: read-only impact summary + delivered outcomes list.

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useT, useFmt, type TKey } from "@/lib/i18n";
import {
  useRequesterIntroductionOutcomes,
  useIntermediaryIntroductionOutcomes,
  useIntermediaryIntroductionImpact,
  useMarkOutcomeProgressed,
  useMarkOutcomeNoOutcome,
} from "@/hooks/use-introduction-outcomes";
import {
  INTRODUCTION_OUTCOME_MAX_NOTE,
  type IntroductionOutcomeDTO,
  type IntroductionOutcomeType,
} from "@/lib/graph/introduction/outcome";
import { toast } from "sonner";

function statusIcon(o: IntroductionOutcomeDTO) {
  if (o.status === "pending") return <Clock className="h-4 w-4" aria-hidden />;
  if (o.outcomeType === "connected")
    return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />;
  if (o.outcomeType === "progressed")
    return <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />;
  if (o.outcomeType === "not_connected")
    return <XCircle className="h-4 w-4 text-warning" aria-hidden />;
  return <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

function labelForOutcome(o: IntroductionOutcomeDTO, t: (k: TKey) => string): string {
  if (o.status === "pending") return t("bc.introOutcome.status.pending");
  const map: Record<IntroductionOutcomeType, TKey> = {
    connected: "bc.introOutcome.type.connected",
    progressed: "bc.introOutcome.type.progressed",
    not_connected: "bc.introOutcome.type.not_connected",
    closed_no_outcome: "bc.introOutcome.type.closed_no_outcome",
  };
  return t(map[o.outcomeType ?? "closed_no_outcome"]);
}

function OutcomeRow({ o, showActions }: { o: IntroductionOutcomeDTO; showActions: boolean }) {
  const t = useT();
  const { date } = useFmt();
  const [progOpen, setProgOpen] = useState(false);
  const [noOpen, setNoOpen] = useState(false);
  const [note, setNote] = useState("");
  const progressed = useMarkOutcomeProgressed();
  const noOutcome = useMarkOutcomeNoOutcome();

  const remaining = INTRODUCTION_OUTCOME_MAX_NOTE - note.length;

  return (
    <li className="rounded-lg border p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {statusIcon(o)}
        <span className="font-medium">{labelForOutcome(o, t)}</span>
        {o.outcomeSource ? (
          <span className="text-xs text-muted-foreground ml-2">
            · {t(`bc.introOutcome.source.${o.outcomeSource}` as TKey)}
          </span>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground">
        {t("bc.introOutcome.expiresIn", { when: date(o.expiresAt) } as never)}
      </div>
      {o.outcomeNote ? (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{o.outcomeNote}</p>
      ) : null}
      {showActions && o.status === "pending" ? (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={() => setProgOpen(true)}>
            {t("bc.introOutcome.action.markProgressed")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setNoOpen(true)}>
            {t("bc.introOutcome.action.markNoOutcome")}
          </Button>
        </div>
      ) : null}

      <Dialog open={progOpen} onOpenChange={setProgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bc.introOutcome.action.markProgressed")}</DialogTitle>
            <DialogDescription>{t("bc.introOutcome.subtitle")}</DialogDescription>
          </DialogHeader>
          <label className="text-sm font-medium" htmlFor={`note-${o.id}`}>
            {t("bc.introOutcome.note.label")}
          </label>
          <Textarea
            id={`note-${o.id}`}
            value={note}
            maxLength={INTRODUCTION_OUTCOME_MAX_NOTE}
            placeholder={t("bc.introOutcome.note.placeholder")}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="text-xs text-muted-foreground">
            {t("bc.introOutcome.note.counter", { n: remaining } as never)}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProgOpen(false)}>
              {t("bc.introOutcome.action.cancel")}
            </Button>
            <Button
              onClick={() => {
                progressed.mutate(
                  { outcomeId: o.id, note: note.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success(t("bc.introOutcome.success.progressed"));
                      setProgOpen(false);
                      setNote("");
                    },
                    onError: (e) => {
                      const code = (e as { code?: string }).code ?? "INTRO_OUTCOME_INTERNAL_ERROR";
                      toast.error(t(`bc.introOutcome.err.${code}` as TKey));
                    },
                  },
                );
              }}
              disabled={progressed.isPending}
            >
              {progressed.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("bc.introOutcome.action.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noOpen} onOpenChange={setNoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bc.introOutcome.action.markNoOutcome")}</DialogTitle>
            <DialogDescription>{t("bc.introOutcome.subtitle")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoOpen(false)}>
              {t("bc.introOutcome.action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                noOutcome.mutate(o.id, {
                  onSuccess: () => {
                    toast.success(t("bc.introOutcome.success.noOutcome"));
                    setNoOpen(false);
                  },
                  onError: (e) => {
                    const code = (e as { code?: string }).code ?? "INTRO_OUTCOME_INTERNAL_ERROR";
                    toast.error(t(`bc.introOutcome.err.${code}` as TKey));
                  },
                });
              }}
              disabled={noOutcome.isPending}
            >
              {t("bc.introOutcome.action.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function RequesterPanel() {
  const t = useT();
  const q = useRequesterIntroductionOutcomes();
  if (q.isLoading)
    return (
      <div role="status" aria-live="polite" className="p-4">
        …
      </div>
    );
  const items = q.data?.items ?? [];
  if (items.length === 0)
    return (
      <p className="text-sm text-muted-foreground p-4">{t("bc.introOutcome.empty.requester")}</p>
    );
  return (
    <ul role="list" className="flex flex-col gap-2 p-1">
      {items.map((o) => (
        <OutcomeRow key={o.id} o={o} showActions />
      ))}
    </ul>
  );
}

function IntermediaryPanel() {
  const t = useT();
  const impact = useIntermediaryIntroductionImpact();
  const q = useIntermediaryIntroductionOutcomes();
  const items = q.data?.items ?? [];
  const stats = impact.data;

  return (
    <div className="space-y-4 p-1">
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="impact-summary">
        {(
          [
            ["delivered", stats?.delivered ?? 0],
            ["acknowledged", stats?.acknowledged ?? 0],
            ["connected", stats?.connected ?? 0],
            ["progressed", stats?.progressed ?? 0],
            ["notConnected", stats?.notConnected ?? 0],
            ["expired", stats?.expired ?? 0],
            ["pending", stats?.pending ?? 0],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">
              {t(`bc.introOutcome.impact.${k}` as TKey)}
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("bc.introOutcome.empty.intermediary")}</p>
      ) : (
        <ul role="list" className="flex flex-col gap-2">
          {items.map((o) => (
            <OutcomeRow key={o.id} o={o} showActions={false} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function IntroductionOutcomesWorkspace() {
  const t = useT();
  return (
    <section aria-labelledby="intro-outcomes-title" className="space-y-4">
      <header>
        <h1 id="intro-outcomes-title" className="text-2xl font-semibold">
          {t("bc.introOutcome.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("bc.introOutcome.subtitle")}</p>
      </header>
      <Tabs defaultValue="requester">
        <TabsList>
          <TabsTrigger value="requester">{t("bc.introOutcome.tab.requester")}</TabsTrigger>
          <TabsTrigger value="intermediary">{t("bc.introOutcome.tab.intermediary")}</TabsTrigger>
        </TabsList>
        <TabsContent value="requester">
          <RequesterPanel />
        </TabsContent>
        <TabsContent value="intermediary">
          <IntermediaryPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}
