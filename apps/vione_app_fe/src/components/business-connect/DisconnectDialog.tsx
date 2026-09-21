// BC-5.1 — Disconnect confirmation dialog.

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
import { useT } from "@/lib/i18n";
import { useDisconnect } from "@/hooks/use-connection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPersonNodeId: string | null;
  personLabel?: string | null;
  onDone?: () => void;
}

export function DisconnectDialog({
  open,
  onOpenChange,
  targetPersonNodeId,
  personLabel,
  onDone,
}: Props) {
  const t = useT();
  const m = useDisconnect();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="bc-disconnect-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("bc.conn.disconnect.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {personLabel
              ? t("bc.conn.disconnect.bodyNamed", { name: personLabel })
              : t("bc.conn.disconnect.body")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={m.isPending}>{t("bc.conn.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!targetPersonNodeId || m.isPending}
            onClick={async () => {
              if (!targetPersonNodeId) return;
              await m.mutateAsync({ targetPersonNodeId }).catch(() => undefined);
              onOpenChange(false);
              onDone?.();
            }}
            data-testid="bc-disconnect-confirm"
          >
            {m.isPending ? t("bc.conn.working") : t("bc.conn.action.disconnect")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
