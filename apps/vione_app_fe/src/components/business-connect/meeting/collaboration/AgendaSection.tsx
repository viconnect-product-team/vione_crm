// BC-7.10 Turn C — Agenda section for meeting detail.
// Organizer: create/edit/status/reorder/delete. Participants: read-only.

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
  MEETING_AGENDA_STATUSES,
  MEETING_AGENDA_TITLE_MAX,
  MEETING_AGENDA_DESCRIPTION_MAX,
  type MeetingAgendaItemDTO,
  type MeetingAgendaStatus,
} from "@/lib/meeting/collaboration/types";
import { MeetingCollaborationError } from "@/lib/meeting/collaboration/errors";
import {
  useMeetingAgenda,
  useCreateAgendaItem,
  useUpdateAgendaItem,
  useSetAgendaItemStatus,
  useReorderAgenda,
  useDeleteAgendaItem,
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

const STATUS_BADGE: Record<MeetingAgendaStatus, "default" | "secondary" | "outline"> = {
  planned: "outline",
  in_discussion: "secondary",
  discussed: "default",
  skipped: "secondary",
};

export interface AgendaSectionProps {
  meetingId: string;
  canManage: boolean;
  canRead: boolean;
}

export function AgendaSection({ meetingId, canManage, canRead }: AgendaSectionProps) {
  const t = useT();
  const q = useMeetingAgenda(meetingId);
  const createMut = useCreateAgendaItem(meetingId);
  const updateMut = useUpdateAgendaItem(meetingId);
  const statusMut = useSetAgendaItemStatus(meetingId);
  const reorderMut = useReorderAgenda(meetingId);
  const deleteMut = useDeleteAgendaItem(meetingId);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  if (!canRead) {
    return null;
  }

  const items = q.data ?? [];
  const roots = items.filter((i) => i.parentId === null);

  const handleCreate = async () => {
    setErrorKey(null);
    try {
      await createMut.mutateAsync({
        meetingId,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      setNewTitle("");
      setNewDescription("");
      setCreating(false);
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const startEdit = (item: MeetingAgendaItemDTO) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setErrorKey(null);
  };

  const handleUpdate = async (item: MeetingAgendaItemDTO) => {
    setErrorKey(null);
    try {
      await updateMut.mutateAsync({
        itemId: item.id,
        expectedVersion: item.version,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        clearDescription: editDescription.trim().length === 0,
      });
      setEditingId(null);
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const handleStatus = async (item: MeetingAgendaItemDTO, next: MeetingAgendaStatus) => {
    setErrorKey(null);
    try {
      await statusMut.mutateAsync({
        itemId: item.id,
        expectedVersion: item.version,
        nextStatus: next,
      });
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const handleDelete = async (item: MeetingAgendaItemDTO) => {
    setErrorKey(null);
    try {
      await deleteMut.mutateAsync({ itemId: item.id, expectedVersion: item.version });
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= roots.length) return;
    const next = roots.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setErrorKey(null);
    try {
      await reorderMut.mutateAsync({
        meetingId,
        parentId: null,
        orderedIds: next.map((i) => i.id),
        expectedVersions: next.map((i) => i.version),
      });
    } catch (e) {
      setErrorKey(errorKeyFor(e));
    }
  };

  return (
    <section
      aria-label={t("bc.meetings.collab.agenda.title")}
      className="rounded-xl border bg-card p-4"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("bc.meetings.collab.agenda.title")}
        </h3>
        {canManage && !creating ? (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("bc.meetings.collab.agenda.action.add")}
          </Button>
        ) : null}
      </div>

      {q.isLoading ? (
        <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
          …
        </div>
      ) : null}

      {errorKey ? (
        <div role="alert" className="mb-3 text-sm text-destructive">
          {t(errorKey as never)}
        </div>
      ) : null}

      {creating ? (
        <div className="mb-3 space-y-2 rounded-lg border border-dashed p-3">
          <div className="space-y-1.5">
            <Label htmlFor="agenda-new-title">{t("bc.meetings.collab.agenda.field.title")}</Label>
            <Input
              id="agenda-new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={MEETING_AGENDA_TITLE_MAX}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agenda-new-description">
              {t("bc.meetings.collab.agenda.field.description")}
            </Label>
            <Textarea
              id="agenda-new-description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              maxLength={MEETING_AGENDA_DESCRIPTION_MAX}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createMut.isPending || newTitle.trim().length === 0}
            >
              {t("bc.meetings.collab.action.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              {t("bc.meetings.collab.action.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {roots.length === 0 && !q.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("bc.meetings.collab.agenda.empty")}</p>
      ) : (
        <ol role="list" className="space-y-2">
          {roots.map((item, idx) => {
            const isEditing = editingId === item.id;
            const canDelete = canManage && item.status === "planned";
            return (
              <li
                key={item.id}
                className="rounded-lg border bg-background p-3"
                aria-label={item.title}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={MEETING_AGENDA_TITLE_MAX}
                      aria-label={t("bc.meetings.collab.agenda.field.title")}
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      maxLength={MEETING_AGENDA_DESCRIPTION_MAX}
                      aria-label={t("bc.meetings.collab.agenda.field.description")}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(item)}
                        disabled={updateMut.isPending}
                      >
                        {t("bc.meetings.collab.action.save")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        {t("bc.meetings.collab.action.cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE[item.status]}>
                          {t(`bc.meetings.collab.agenda.status.${item.status}` as never)}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{item.title}</span>
                      </div>
                      {item.description ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0 || reorderMut.isPending}
                          aria-label={t("bc.meetings.collab.agenda.action.moveUp")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === roots.length - 1 || reorderMut.isPending}
                          aria-label={t("bc.meetings.collab.agenda.action.moveDown")}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Select
                          value={item.status}
                          onValueChange={(v) => handleStatus(item, v as MeetingAgendaStatus)}
                        >
                          <SelectTrigger
                            className="h-8 w-[140px]"
                            aria-label={t("bc.meetings.collab.agenda.field.status")}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEETING_AGENDA_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(`bc.meetings.collab.agenda.status.${s}` as never)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                          {t("bc.meetings.collab.action.edit")}
                        </Button>
                        {canDelete ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(item)}
                            aria-label={t("bc.meetings.collab.action.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
