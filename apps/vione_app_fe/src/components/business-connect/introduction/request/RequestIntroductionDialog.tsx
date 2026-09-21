// BC-6.2 — Request Introduction dialog. Presents intermediary + target,
// optional plain-text note (500-char cap), submits via SDK. Screen-reader
// friendly and focus-trapped via shadcn Dialog primitives.
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import {
  INTRODUCTION_REQUEST_MAX_NOTE,
  toIntroductionRequestError,
  type SmartIntroductionPathDTO,
} from "@/lib/graph";
import { useSendIntroductionRequest } from "@/hooks/use-introduction-requests";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: SmartIntroductionPathDTO;
  targetLabel: string;
  intermediaryLabel: string;
}

export function RequestIntroductionDialog({
  open,
  onOpenChange,
  path,
  targetLabel,
  intermediaryLabel,
}: Props) {
  const t = useT();
  const [note, setNote] = useState("");
  const [errKey, setErrKey] = useState<string | null>(null);
  const send = useSendIntroductionRequest();

  const remaining = INTRODUCTION_REQUEST_MAX_NOTE - note.length;

  const onSubmit = async () => {
    setErrKey(null);
    try {
      await send.mutateAsync({
        targetPersonNodeId: path.target.personNodeId,
        pathId: path.pathId,
        requestNote: note.trim() || undefined,
        idempotencyKey: `intro:${path.pathId}:${Date.now().toString(36)}`,
      });
      onOpenChange(false);
      setNote("");
    } catch (e) {
      const code = toIntroductionRequestError(e).code;
      setErrKey(`bc.introReq.err.${code}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="intro-req-desc">
        <DialogHeader>
          <DialogTitle>{t("bc.introReq.dialog.title")}</DialogTitle>
          <DialogDescription id="intro-req-desc">
            {t("bc.introReq.dialog.description", {
              intermediary: intermediaryLabel,
              target: targetLabel,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="intro-req-note">{t("bc.introReq.note.label")}</Label>
          <Textarea
            id="intro-req-note"
            value={note}
            maxLength={INTRODUCTION_REQUEST_MAX_NOTE}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("bc.introReq.note.placeholder")}
            aria-describedby="intro-req-note-counter"
            rows={4}
          />
          <div
            id="intro-req-note-counter"
            className="text-xs text-muted-foreground"
            aria-live="polite"
          >
            {t("bc.introReq.note.counter", { n: remaining })}
          </div>
        </div>

        {errKey && (
          <p role="alert" className="text-sm text-destructive">
            {t(errKey as never)}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("bc.introReq.dialog.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={send.isPending}>
            {send.isPending ? t("bc.introReq.dialog.sending") : t("bc.introReq.dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
