// BC-9.1 Turn C2 — Feedback dialog (read-only stub).
//
// Backend mutation surface for RelationshipMemoryFeedback is intentionally
// NOT wired in Turn C2 (backend contracts frozen). This shell exists so the
// feedback affordance is discoverable and messaged, without giving users a
// broken submit path.

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export interface Props {
  memoryId: string | null;
  onClose: () => void;
}

export function RelationshipMemoryFeedbackDialog({ memoryId, onClose }: Props) {
  const t = useT();
  const open = memoryId !== null;
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md" data-testid="memory-feedback-dialog">
        <DialogHeader>
          <DialogTitle>{t("bc.memory.feedback.title")}</DialogTitle>
          <DialogDescription>{t("bc.memory.feedback.description")}</DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">{t("bc.memory.feedback.readonly")}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("bc.memory.feedback.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
