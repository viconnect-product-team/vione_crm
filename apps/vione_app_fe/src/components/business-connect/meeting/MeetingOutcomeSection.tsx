// BC-7.9 Turn C — Meeting Outcome section for meeting detail.
// Organizer: create, edit draft, finalize. Participants: read-only view.

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { MEETING_OUTCOME_TYPES, MEETING_OUTCOME_SUMMARY_MAX } from "@/lib/meeting/outcome/types";
import type { MeetingOutcomeType } from "@/lib/meeting/outcome/types";
import type { MeetingOutcomeError } from "@/lib/meeting/outcome/errors";
import {
  useMeetingOutcome,
  useCreateMeetingOutcome,
  useUpdateMeetingOutcome,
  useFinalizeMeetingOutcome,
} from "@/hooks/use-meeting-outcome";

export interface MeetingOutcomeSectionProps {
  meetingId: string;
  isOrganizer: boolean;
}

function mapErrorToKey(code: string): string {
  switch (code) {
    case "MEETING_OUTCOME_VERSION_CONFLICT":
      return "bc.meetings.outcome.error.versionConflict";
    case "MEETING_OUTCOME_FINALIZED":
      return "bc.meetings.outcome.error.finalized";
    case "MEETING_OUTCOME_FORBIDDEN":
      return "bc.meetings.outcome.error.forbidden";
    case "MEETING_OUTCOME_INVALID_STATE":
      return "bc.meetings.outcome.error.invalidState";
    case "MEETING_OUTCOME_INVALID_SUMMARY":
      return "bc.meetings.outcome.error.invalidSummary";
    case "MEETING_OUTCOME_INVALID_TYPE":
      return "bc.meetings.outcome.error.invalidType";
    default:
      return "bc.meetings.outcome.error.generic";
  }
}

export function MeetingOutcomeSection({ meetingId, isOrganizer }: MeetingOutcomeSectionProps) {
  const t = useT();
  const { data: outcome, isLoading } = useMeetingOutcome(meetingId);
  const createMut = useCreateMeetingOutcome(meetingId);
  const updateMut = useUpdateMeetingOutcome(meetingId);
  const finalizeMut = useFinalizeMeetingOutcome(meetingId);

  const [editing, setEditing] = useState(false);
  const [outcomeType, setOutcomeType] = useState<MeetingOutcomeType>("positive_progress");
  const [summary, setSummary] = useState("");
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const isFinalized = outcome?.outcomeStatus === "finalized";
  const canEdit = isOrganizer && outcome && !isFinalized;
  const canCreate = isOrganizer && !outcome;

  const startCreate = () => {
    setOutcomeType("positive_progress");
    setSummary("");
    setErrorKey(null);
    setEditing(true);
  };

  const startEdit = () => {
    if (!outcome) return;
    setOutcomeType(outcome.outcomeType);
    setSummary(outcome.summary ?? "");
    setErrorKey(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrorKey(null);
  };

  const handleSave = async () => {
    setErrorKey(null);
    try {
      if (outcome) {
        await updateMut.mutateAsync({
          meetingId,
          expectedVersion: outcome.version,
          outcomeType,
          summary: summary.trim() || null,
          clearSummary: summary.trim().length === 0,
        });
      } else {
        await createMut.mutateAsync({
          meetingId,
          outcomeType,
          summary: summary.trim() || null,
        });
      }
      setEditing(false);
    } catch (e) {
      setErrorKey(mapErrorToKey((e as MeetingOutcomeError).code ?? ""));
    }
  };

  const handleFinalize = async () => {
    if (!outcome) return;
    setErrorKey(null);
    try {
      await finalizeMut.mutateAsync({ meetingId, expectedVersion: outcome.version });
      setConfirmFinalize(false);
      setEditing(false);
    } catch (e) {
      setErrorKey(mapErrorToKey((e as MeetingOutcomeError).code ?? ""));
      setConfirmFinalize(false);
    }
  };

  return (
    <section
      aria-label={t("bc.meetings.outcome.section.title")}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("bc.meetings.outcome.section.title")}
        </h3>
        {outcome ? (
          <Badge variant={isFinalized ? "default" : "secondary"}>
            {isFinalized
              ? t("bc.meetings.outcome.status.finalized")
              : t("bc.meetings.outcome.status.draft")}
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          …
        </div>
      ) : editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="outcome-type">{t("bc.meetings.outcome.field.type")}</Label>
            <Select
              value={outcomeType}
              onValueChange={(v) => setOutcomeType(v as MeetingOutcomeType)}
            >
              <SelectTrigger id="outcome-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_OUTCOME_TYPES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`bc.meetings.outcome.type.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outcome-summary">{t("bc.meetings.outcome.field.summary")}</Label>
            <Textarea
              id="outcome-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              maxLength={MEETING_OUTCOME_SUMMARY_MAX}
              aria-describedby="outcome-summary-help"
            />
            <p id="outcome-summary-help" className="text-xs text-muted-foreground">
              {t("bc.meetings.outcome.field.summary.help")} ({summary.length}/
              {MEETING_OUTCOME_SUMMARY_MAX})
            </p>
          </div>
          {errorKey ? (
            <div role="alert" className="text-sm text-destructive">
              {t(errorKey as never)}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMut.isPending || updateMut.isPending}
            >
              {t("bc.meetings.outcome.action.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              {t("bc.meetings.outcome.action.cancel")}
            </Button>
          </div>
        </div>
      ) : outcome ? (
        <div className="space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("bc.meetings.outcome.field.type")}
            </div>
            <div className="mt-0.5 text-sm font-medium text-foreground">
              {t(`bc.meetings.outcome.type.${outcome.outcomeType}` as never)}
            </div>
          </div>
          {outcome.summary ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("bc.meetings.outcome.field.summary")}
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
                {outcome.summary}
              </p>
            </div>
          ) : null}
          {isFinalized ? (
            <p className="text-xs text-muted-foreground">
              {t("bc.meetings.outcome.finalized.notice")}
            </p>
          ) : null}
          {errorKey ? (
            <div role="alert" className="text-sm text-destructive">
              {t(errorKey as never)}
            </div>
          ) : null}
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={startEdit}>
                {t("bc.meetings.outcome.action.edit")}
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmFinalize(true)}
                disabled={finalizeMut.isPending}
              >
                {t("bc.meetings.outcome.action.finalize")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">
            {t("bc.meetings.outcome.empty.title")}
          </div>
          <p className="text-sm text-muted-foreground">
            {isOrganizer
              ? t("bc.meetings.outcome.empty.organizer")
              : t("bc.meetings.outcome.empty.participant")}
          </p>
          {canCreate ? (
            <Button size="sm" onClick={startCreate}>
              {t("bc.meetings.outcome.action.record")}
            </Button>
          ) : null}
        </div>
      )}

      <AlertDialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.meetings.outcome.finalize.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.meetings.outcome.finalize.confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bc.meetings.outcome.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>
              {t("bc.meetings.outcome.finalize.confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
