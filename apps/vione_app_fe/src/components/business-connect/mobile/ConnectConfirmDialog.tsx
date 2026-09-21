// BC-Mobile — Xác nhận trước khi gửi lời mời kết nối.
// Không tự thực hiện nghiệp vụ: chỉ hỏi và gọi lại onConfirm của nơi gọi.

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

export function ConnectConfirmDialog({
  open,
  onOpenChange,
  personLabel,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personLabel?: string | null;
  busy?: boolean;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <AlertDialog open={open} onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}>
      <AlertDialogContent data-testid="bc-connect-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("bc.mobile.connection.confirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {personLabel
              ? t("bc.mobile.connection.confirm.bodyNamed", { name: personLabel })
              : t("bc.mobile.connection.confirm.body")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("bc.mobile.connection.confirm.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            data-testid="bc-connect-confirm-submit"
          >
            {busy
              ? t("bc.mobile.connection.confirm.sending")
              : t("bc.mobile.connection.confirm.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
