// BC-7.9 Turn C — Meeting Follow-up section for meeting detail.
// Uses DTO viewerPermissions to gate every action. Owner selector shows only
// participant + organizer options from the meeting detail participants list.

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  MEETING_FOLLOW_UP_PRIORITIES,
  MEETING_FOLLOW_UP_TITLE_MAX,
  MEETING_FOLLOW_UP_DESCRIPTION_MAX,
  type MeetingFollowUpDTO,
  type MeetingFollowUpPriority,
} from "@/lib/meeting/follow-up/types";
import type { MeetingFollowUpError } from "@/lib/meeting/follow-up/errors";
import type { BusinessMeetingParticipantDTO } from "@/lib/business-meetings/types";
import {
  useMeetingFollowUps,
  useCreateMeetingFollowUp,
  useUpdateMeetingFollowUp,
  useSetMeetingFollowUpStatus,
  useCancelMeetingFollowUp,
} from "@/hooks/use-meeting-outcome";

export interface MeetingFollowUpSectionProps {
  meetingId: string;
  viewerUserId: string;
  participants: BusinessMeetingParticipantDTO[];
  isViewerParticipant: boolean;
}

function mapErrorToKey(code: string): string {
  switch (code) {
    case "MEETING_FOLLOW_UP_VERSION_CONFLICT":
      return "bc.meetings.followUp.error.versionConflict";
    case "MEETING_FOLLOW_UP_TERMINAL":
      return "bc.meetings.followUp.error.terminal";
    case "MEETING_FOLLOW_UP_INVALID_OWNER":
      return "bc.meetings.followUp.error.invalidOwner";
    case "MEETING_FOLLOW_UP_INVALID_STATE":
      return "bc.meetings.followUp.error.invalidState";
    case "MEETING_FOLLOW_UP_FORBIDDEN":
      return "bc.meetings.followUp.error.forbidden";
    case "MEETING_FOLLOW_UP_INVALID_TITLE":
      return "bc.meetings.followUp.error.invalidTitle";
    default:
      return "bc.meetings.followUp.error.generic";
  }
}

export function MeetingFollowUpSection({
  meetingId,
  viewerUserId,
  participants,
  isViewerParticipant,
}: MeetingFollowUpSectionProps) {
  const t = useT();
  const { data: followUps = [], isLoading } = useMeetingFollowUps(meetingId);
  const [creating, setCreating] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  return (
    <section
      aria-label={t("bc.meetings.followUp.section.title")}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("bc.meetings.followUp.section.title")}
        </h3>
        {isViewerParticipant && !creating ? (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            {t("bc.meetings.followUp.action.add")}
          </Button>
        ) : null}
      </div>

      {errorKey ? (
        <div role="alert" className="mb-3 text-sm text-destructive">
          {t(errorKey as never)}
        </div>
      ) : null}

      {creating ? (
        <FollowUpForm
          meetingId={meetingId}
          viewerUserId={viewerUserId}
          participants={participants}
          onDone={() => setCreating(false)}
          onError={(k) => setErrorKey(k)}
        />
      ) : null}

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          …
        </div>
      ) : followUps.length === 0 && !creating ? (
        <p className="text-sm text-muted-foreground">{t("bc.meetings.followUp.empty")}</p>
      ) : (
        <ul role="list" className="space-y-2">
          {followUps.map((fu) => (
            <li key={fu.id}>
              <FollowUpItem
                followUp={fu}
                meetingId={meetingId}
                viewerUserId={viewerUserId}
                participants={participants}
                onError={(k) => setErrorKey(k)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------- Item ----------------

interface ItemProps {
  followUp: MeetingFollowUpDTO;
  meetingId: string;
  viewerUserId: string;
  participants: BusinessMeetingParticipantDTO[];
  onError: (k: string) => void;
}

function FollowUpItem({ followUp: fu, meetingId, viewerUserId, participants, onError }: ItemProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const setStatusMut = useSetMeetingFollowUpStatus(meetingId);
  const cancelMut = useCancelMeetingFollowUp(meetingId);

  const doStatus = async (target: "in_progress" | "completed") => {
    try {
      await setStatusMut.mutateAsync({
        followUpId: fu.id,
        expectedVersion: fu.version,
        targetStatus: target,
      });
    } catch (e) {
      onError(mapErrorToKey((e as MeetingFollowUpError).code ?? ""));
    }
  };

  const doCancel = async () => {
    try {
      await cancelMut.mutateAsync({ followUpId: fu.id, expectedVersion: fu.version });
    } catch (e) {
      onError(mapErrorToKey((e as MeetingFollowUpError).code ?? ""));
    }
  };

  if (editing) {
    return (
      <FollowUpForm
        meetingId={meetingId}
        viewerUserId={viewerUserId}
        participants={participants}
        existing={fu}
        onDone={() => setEditing(false)}
        onError={onError}
      />
    );
  }

  const p = fu.viewerPermissions;

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{fu.title}</div>
          {fu.description ? (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
              {fu.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <Badge variant="outline">
              {t(`bc.meetings.followUp.status.${fu.status}` as never)}
            </Badge>
            <Badge variant="secondary">
              {t(`bc.meetings.followUp.priority.${fu.priority}` as never)}
            </Badge>
            {fu.temporalState !== "active" ? (
              <Badge variant={fu.temporalState === "overdue" ? "destructive" : "outline"}>
                {t(`bc.meetings.followUp.temporal.${fu.temporalState}` as never)}
              </Badge>
            ) : null}
            <span className="text-muted-foreground">
              {fu.owner.isViewer
                ? t("bc.meetings.followUp.owner.self")
                : t(`bc.meetings.followUp.owner.${fu.owner.kind}` as never)}
            </span>
            {fu.dueAt ? (
              <span className="text-muted-foreground">· {new Date(fu.dueAt).toLocaleString()}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {p.canEdit ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {t("bc.meetings.followUp.action.edit")}
          </Button>
        ) : null}
        {p.canChangeStatus && fu.status === "open" ? (
          <Button size="sm" variant="outline" onClick={() => doStatus("in_progress")}>
            {t("bc.meetings.followUp.action.start")}
          </Button>
        ) : null}
        {p.canChangeStatus && (fu.status === "open" || fu.status === "in_progress") ? (
          <Button size="sm" onClick={() => doStatus("completed")}>
            {t("bc.meetings.followUp.action.complete")}
          </Button>
        ) : null}
        {p.canCancel ? (
          <Button size="sm" variant="ghost" onClick={doCancel}>
            {t("bc.meetings.followUp.action.cancel")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------- Form ----------------

interface FormProps {
  meetingId: string;
  viewerUserId: string;
  participants: BusinessMeetingParticipantDTO[];
  existing?: MeetingFollowUpDTO;
  onDone: () => void;
  onError: (k: string) => void;
}

function FollowUpForm({
  meetingId,
  viewerUserId,
  participants,
  existing,
  onDone,
  onError,
}: FormProps) {
  const t = useT();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [priority, setPriority] = useState<MeetingFollowUpPriority>(existing?.priority ?? "normal");
  const [dueAt, setDueAt] = useState<string>(existing?.dueAt ? existing.dueAt.slice(0, 16) : "");
  // For edits without ownership change we default to viewer; server ignores unchanged.
  const [ownerUserId, setOwnerUserId] = useState<string>(viewerUserId);

  const createMut = useCreateMeetingFollowUp(meetingId);
  const updateMut = useUpdateMeetingFollowUp(meetingId);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      onError("bc.meetings.followUp.error.invalidTitle");
      return;
    }
    try {
      if (existing) {
        await updateMut.mutateAsync({
          followUpId: existing.id,
          expectedVersion: existing.version,
          title: trimmed,
          description: description.trim() || null,
          clearDescription: description.trim().length === 0,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          clearDueAt: !dueAt,
        });
      } else {
        await createMut.mutateAsync({
          meetingId,
          title: trimmed,
          ownerUserId,
          description: description.trim() || null,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        });
      }
      onDone();
    } catch (e) {
      onError(mapErrorToKey((e as MeetingFollowUpError).code ?? ""));
    }
  };

  return (
    <div className="mb-3 space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label htmlFor="fu-title">{t("bc.meetings.followUp.field.title")}</Label>
        <Input
          id="fu-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MEETING_FOLLOW_UP_TITLE_MAX}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fu-desc">{t("bc.meetings.followUp.field.description")}</Label>
        <Textarea
          id="fu-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={MEETING_FOLLOW_UP_DESCRIPTION_MAX}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {!existing ? (
          <div className="space-y-1.5">
            <Label htmlFor="fu-owner">{t("bc.meetings.followUp.field.owner")}</Label>
            <Select value={ownerUserId} onValueChange={setOwnerUserId}>
              <SelectTrigger id="fu-owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.userId}>
                    {p.userId === viewerUserId
                      ? t("bc.meetings.followUp.owner.self")
                      : p.role === "organizer"
                        ? t("bc.meetings.followUp.owner.organizer")
                        : t("bc.meetings.followUp.owner.participant")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="fu-priority">{t("bc.meetings.followUp.field.priority")}</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as MeetingFollowUpPriority)}>
            <SelectTrigger id="fu-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_FOLLOW_UP_PRIORITIES.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`bc.meetings.followUp.priority.${k}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fu-due">{t("bc.meetings.followUp.field.dueAt")}</Label>
          <Input
            id="fu-due"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
          {t("bc.meetings.followUp.action.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          {t("bc.meetings.followUp.action.cancelEdit")}
        </Button>
      </div>
    </div>
  );
}
