// BC-6.3 — Deliver introduction dialog (intermediary side).
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
import { useDeliverIntroduction } from "@/hooks/use-introduction-deliveries";
import {
  INTRODUCTION_DELIVERY_MAX_NOTE,
  toIntroductionDeliveryError,
  type PendingDeliveryItemDTO,
} from "@/lib/graph";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: PendingDeliveryItemDTO | null;
}

export function DeliverIntroductionDialog({ open, onOpenChange, item }: Props) {
  const t = useT();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const deliver = useDeliverIntroduction();

  const remaining = INTRODUCTION_DELIVERY_MAX_NOTE - note.trim().length;

  async function onSubmit() {
    if (!item) return;
    setError(null);
    try {
      await deliver.mutateAsync({
        introductionRequestId: item.introductionRequestId,
        deliveryNote: note.trim() || undefined,
        idempotencyKey: `deliver-${item.introductionRequestId}`,
      });
      setNote("");
      onOpenChange(false);
    } catch (e) {
      const err = toIntroductionDeliveryError(e);
      setError(t(`bc.introDelivery.err.${err.code}` as never));
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("bc.introDelivery.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("bc.introDelivery.dialog.description", {
              requester: item.requester.personNodeId.slice(0, 8),
              target: item.target.personNodeId.slice(0, 8),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="intro-delivery-note">{t("bc.introDelivery.note.label")}</Label>
          <Textarea
            id="intro-delivery-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, INTRODUCTION_DELIVERY_MAX_NOTE))}
            placeholder={t("bc.introDelivery.note.placeholder")}
            rows={4}
            aria-describedby="intro-delivery-note-counter"
          />
          <p
            id="intro-delivery-note-counter"
            className="text-xs text-muted-foreground"
            aria-live="polite"
          >
            {t("bc.introDelivery.note.counter", { n: remaining })}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("bc.introDelivery.dialog.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={deliver.isPending}>
            {deliver.isPending
              ? t("bc.introDelivery.dialog.sending")
              : t("bc.introDelivery.dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
