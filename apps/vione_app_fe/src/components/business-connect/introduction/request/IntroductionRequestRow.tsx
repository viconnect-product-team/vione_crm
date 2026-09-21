// BC-6.2 — Introduction request row (incoming or outgoing).
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { IntroductionRequestDTO } from "@/lib/graph";

interface Props {
  request: IntroductionRequestDTO;
  variant: "incoming" | "outgoing";
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  busy?: boolean;
}

function StatusBadge({ status }: { status: IntroductionRequestDTO["status"] }) {
  const t = useT();
  const tone: Record<string, string> = {
    pending: "secondary",
    accepted: "default",
    declined: "outline",
    cancelled: "outline",
    expired: "outline",
  };
  return (
    <Badge variant={tone[status] as "default" | "secondary" | "outline"}>
      {t(`bc.introReq.status.${status}` as never)}
    </Badge>
  );
}

export function IntroductionRequestRow({
  request,
  variant,
  onAccept,
  onDecline,
  onCancel,
  busy,
}: Props) {
  const t = useT();
  const isPending = request.status === "pending";
  const counterpart =
    variant === "incoming" ? request.requester.personNodeId : request.intermediary.personNodeId;

  return (
    <li
      className="rounded-lg border border-border bg-card p-4"
      data-testid="intro-request-row"
      aria-label={t(`bc.introReq.row.aria.${variant}` as never)}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {variant === "incoming"
              ? t("bc.introReq.row.from", { id: counterpart.slice(0, 8) })
              : t("bc.introReq.row.via", { id: counterpart.slice(0, 8) })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("bc.introReq.row.target", {
              id: request.target.personNodeId.slice(0, 8),
            })}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {request.requestNote && (
        <p className="mt-1 whitespace-pre-line rounded bg-muted p-2 text-sm">
          {request.requestNote}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {variant === "incoming" && isPending && (
          <>
            <Button size="sm" onClick={() => onAccept?.(request.id)} disabled={busy}>
              {t("bc.introReq.action.accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline?.(request.id)}
              disabled={busy}
            >
              {t("bc.introReq.action.decline")}
            </Button>
          </>
        )}
        {variant === "outgoing" && isPending && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel?.(request.id)}
            disabled={busy}
          >
            {t("bc.introReq.action.cancel")}
          </Button>
        )}
      </div>
    </li>
  );
}
