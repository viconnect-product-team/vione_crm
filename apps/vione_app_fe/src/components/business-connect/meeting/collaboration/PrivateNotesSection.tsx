// BC-7.10 Turn C — Private Notes section. Owner-only, save-on-blur.

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEETING_NOTE_CONTENT_MAX } from "@/lib/meeting/collaboration/types";
import { MeetingCollaborationError } from "@/lib/meeting/collaboration/errors";
import { usePrivateNote, useUpsertPrivateNote } from "@/hooks/use-meeting-collaboration";

function errorKeyFor(e: unknown): string {
  const code = e instanceof MeetingCollaborationError ? e.code : "";
  switch (code) {
    case "MEETING_COLLABORATION_VERSION_CONFLICT":
      return "bc.meetings.collab.error.versionConflict";
    case "MEETING_COLLABORATION_FORBIDDEN":
      return "bc.meetings.collab.error.forbidden";
    case "MEETING_COLLABORATION_VALIDATION":
      return "bc.meetings.collab.error.validation";
    case "MEETING_COLLABORATION_NOT_FOUND":
      return "bc.meetings.collab.error.notFound";
    default:
      return "bc.meetings.collab.error.generic";
  }
}

export interface PrivateNotesSectionProps {
  meetingId: string;
  canRead: boolean;
}

export function PrivateNotesSection({ meetingId, canRead }: PrivateNotesSectionProps) {
  const t = useT();
  const { data: note, isLoading } = usePrivateNote(meetingId);
  const upsertMut = useUpsertPrivateNote(meetingId);

  const [draft, setDraft] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(note?.content ?? "");
  }, [note?.id, note?.version]);

  if (!canRead) return null;

  const handleSave = async () => {
    setErrorKey(null);
    try {
      await upsertMut.mutateAsync({
        meetingId,
        content: draft,
        expectedVersion: note?.version ?? null,
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  return (
    <section
      aria-label={t("bc.meetings.collab.privateNotes.title")}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t("bc.meetings.collab.privateNotes.title")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("bc.meetings.collab.privateNotes.help")}</p>
      </div>

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          …
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="private-note-content">
              {t("bc.meetings.collab.privateNotes.field.content")}
            </Label>
            <Textarea
              id="private-note-content"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (draft !== (note?.content ?? "")) void handleSave();
              }}
              rows={5}
              maxLength={MEETING_NOTE_CONTENT_MAX}
            />
            <p className="text-xs text-muted-foreground">
              {draft.length}/{MEETING_NOTE_CONTENT_MAX}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={upsertMut.isPending}>
              {t("bc.meetings.collab.privateNotes.action.save")}
            </Button>
            <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
              {savedFlash ? t("bc.meetings.collab.privateNotes.saved") : ""}
            </span>
          </div>
          {errorKey ? (
            <div role="alert" className="text-sm text-destructive">
              {t(errorKey as never)}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
