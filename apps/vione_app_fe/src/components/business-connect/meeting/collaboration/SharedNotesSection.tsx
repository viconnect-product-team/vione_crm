// BC-7.10 Turn C — Shared Notes section. Organizer edits + publishes.
// Participants view. Published is terminal (editor locks).

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MEETING_NOTE_CONTENT_MAX } from "@/lib/meeting/collaboration/types";
import { MeetingCollaborationError } from "@/lib/meeting/collaboration/errors";
import {
  useSharedNote,
  useInitSharedNote,
  useUpdateSharedNote,
  usePublishSharedNote,
} from "@/hooks/use-meeting-collaboration";

function errorKeyFor(e: unknown): string {
  const code = e instanceof MeetingCollaborationError ? e.code : "";
  switch (code) {
    case "MEETING_COLLABORATION_VERSION_CONFLICT":
      return "bc.meetings.collab.error.versionConflict";
    case "MEETING_COLLABORATION_FORBIDDEN":
      return "bc.meetings.collab.error.forbidden";
    case "MEETING_COLLABORATION_INVALID_STATE":
      return "bc.meetings.collab.error.invalidState";
    case "MEETING_COLLABORATION_INVALID_TRANSITION":
      return "bc.meetings.collab.error.invalidTransition";
    case "MEETING_COLLABORATION_VALIDATION":
      return "bc.meetings.collab.error.validation";
    case "MEETING_COLLABORATION_NOT_FOUND":
      return "bc.meetings.collab.error.notFound";
    default:
      return "bc.meetings.collab.error.generic";
  }
}

export interface SharedNotesSectionProps {
  meetingId: string;
  isOrganizer: boolean;
  canRead: boolean;
}

export function SharedNotesSection({ meetingId, isOrganizer, canRead }: SharedNotesSectionProps) {
  const t = useT();
  const { data: note, isLoading } = useSharedNote(meetingId);
  const initMut = useInitSharedNote(meetingId);
  const updateMut = useUpdateSharedNote(meetingId);
  const publishMut = usePublishSharedNote(meetingId);

  const [draft, setDraft] = useState("");
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (note) setDraft(note.content);
  }, [note?.id, note?.version, note?.content]);

  if (!canRead) return null;

  const isPublished = note?.noteStatus === "published";
  const canEdit = isOrganizer && note && !isPublished;

  const handleInit = async () => {
    setErrorKey(null);
    try {
      await initMut.mutateAsync();
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const handleSave = async () => {
    if (!note) return;
    setErrorKey(null);
    try {
      await updateMut.mutateAsync({
        meetingId,
        expectedVersion: note.version,
        content: draft,
      });
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const handlePublish = async () => {
    if (!note) return;
    setErrorKey(null);
    try {
      await publishMut.mutateAsync({ meetingId, expectedVersion: note.version });
      setConfirmPublish(false);
    } catch (e) {
      setErrorKey(errorKeyFor(e));
      setConfirmPublish(false);
    }
  };

  return (
    <section
      aria-label={t("bc.meetings.collab.sharedNotes.title")}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("bc.meetings.collab.sharedNotes.title")}
        </h3>
        {note ? (
          <Badge variant={isPublished ? "default" : "secondary"}>
            {isPublished
              ? t("bc.meetings.collab.sharedNotes.status.published")
              : t("bc.meetings.collab.sharedNotes.status.draft")}
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          …
        </div>
      ) : !note ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isOrganizer
              ? t("bc.meetings.collab.sharedNotes.empty.organizer")
              : t("bc.meetings.collab.sharedNotes.empty.participant")}
          </p>
          {isOrganizer ? (
            <Button size="sm" onClick={handleInit} disabled={initMut.isPending}>
              {t("bc.meetings.collab.sharedNotes.action.init")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="shared-note-content">
              {t("bc.meetings.collab.sharedNotes.field.content")}
            </Label>
            <Textarea
              id="shared-note-content"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              maxLength={MEETING_NOTE_CONTENT_MAX}
              readOnly={!canEdit}
              aria-readonly={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              {draft.length}/{MEETING_NOTE_CONTENT_MAX}
            </p>
          </div>
          {isPublished ? (
            <p className="text-xs text-muted-foreground">
              {t("bc.meetings.collab.sharedNotes.publishedNotice")}
            </p>
          ) : null}
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateMut.isPending}>
                {t("bc.meetings.collab.sharedNotes.action.saveDraft")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmPublish(true)}
                disabled={publishMut.isPending}
              >
                {t("bc.meetings.collab.sharedNotes.action.publish")}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {errorKey ? (
        <div role="alert" className="mt-3 text-sm text-destructive">
          {t(errorKey as never)}
        </div>
      ) : null}

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bc.meetings.collab.sharedNotes.publish.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.meetings.collab.sharedNotes.publish.confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bc.meetings.collab.action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              {t("bc.meetings.collab.sharedNotes.publish.confirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
