// BC-4.1C — Capability-gated meeting action bar. The server still revalidates
// every mutation; capabilities only drive which controls render.
import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import type { MeetingDetailDTO } from "@/lib/business-meetings/types";
import type { MeetingMutations } from "@/hooks/use-business-meetings";
import type { RescheduleInput } from "@/lib/business-meetings/client-sdk";
import { RescheduleDialog } from "./RescheduleDialog";

type Confirm = "decline" | "cancel" | null;

export function MeetingActions({
  detail,
  mutations,
}: {
  detail: MeetingDetailDTO;
  mutations: MeetingMutations;
}) {
  const t = useT();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [reason, setReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const { capabilities: c, meeting } = detail;
  const id = meeting.id;
  const version = meeting.activeProposalVersion ?? 0;
  const busy =
    mutations.accept.isPending ||
    mutations.decline.isPending ||
    mutations.tentative.isPending ||
    mutations.propose.isPending ||
    mutations.cancel.isPending ||
    mutations.complete.isPending ||
    mutations.markNoShow.isPending;

  const anyAction =
    c.canAccept ||
    c.canDecline ||
    c.canTentative ||
    c.canProposeNewTime ||
    c.canCancel ||
    c.canComplete ||
    c.canMarkNoShow;
  if (!anyAction) return null;

  const propose = (input: RescheduleInput) => {
    mutations.propose.mutate(
      { meetingId: id, baseVersion: version, input },
      { onSettled: () => setRescheduleOpen(false) },
    );
  };

  return (
    <>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("connect.meetings.action.aria")}
        aria-busy={busy}
      >
        {c.canAccept ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => mutations.accept.mutate({ meetingId: id, version })}
          >
            {mutations.accept.isPending
              ? t("connect.meetings.action.working")
              : t("connect.meetings.action.accept")}
          </Button>
        ) : null}
        {c.canProposeNewTime ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setRescheduleOpen(true)}
          >
            {t("connect.meetings.action.propose")}
          </Button>
        ) : null}
        {c.canTentative ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => mutations.tentative.mutate({ meetingId: id, version })}
          >
            {mutations.tentative.isPending
              ? t("connect.meetings.action.working")
              : t("connect.meetings.action.tentative")}
          </Button>
        ) : null}
        {c.canDecline ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("decline")}>
            {t("connect.meetings.action.decline")}
          </Button>
        ) : null}
        {c.canComplete ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => mutations.complete.mutate({ meetingId: id, expectedVersion: version })}
          >
            {t("connect.meetings.action.complete")}
          </Button>
        ) : null}
        {c.canMarkNoShow ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => mutations.markNoShow.mutate({ meetingId: id, expectedVersion: version })}
          >
            {t("connect.meetings.action.noShow")}
          </Button>
        ) : null}
        {c.canCancel ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirm("cancel")}>
            {t("connect.meetings.action.cancel")}
          </Button>
        ) : null}
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => (!o ? setConfirm(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "cancel"
                ? t("connect.meetings.confirm.cancel")
                : t("connect.meetings.confirm.decline")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="sr-only">{meeting.title}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="mtg-reason">{t("connect.meetings.confirm.reason")}</Label>
            <Textarea
              id="mtg-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReason("")}>
              {t("connect.meetings.confirm.no")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const r = reason || undefined;
                if (confirm === "cancel") {
                  mutations.cancel.mutate({ meetingId: id, reason: r, expectedVersion: version });
                } else {
                  mutations.decline.mutate({ meetingId: id, version, reason: r });
                }
                setReason("");
                setConfirm(null);
              }}
            >
              {t("connect.meetings.confirm.yes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleDialog
        open={rescheduleOpen}
        defaultTimezone={meeting.timezone}
        busy={mutations.propose.isPending}
        onSubmit={propose}
        onClose={() => setRescheduleOpen(false)}
      />
    </>
  );
}
