// BC-5.1 — Block confirmation dialog.

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
import { useBlockPerson } from "@/hooks/use-connection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPersonNodeId: string | null;
  personLabel?: string | null;
  onDone?: () => void;
}

export function BlockDialog({
  open,
  onOpenChange,
  targetPersonNodeId,
  personLabel,
  onDone,
}: Props) {
  const t = useT();
  const m = useBlockPerson();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="bc-block-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("bc.conn.block.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {personLabel
              ? t("bc.conn.block.bodyNamed", { name: personLabel })
              : t("bc.conn.block.body")}
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
            data-testid="bc-block-confirm"
          >
            {m.isPending ? t("bc.conn.working") : t("bc.conn.action.block")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
