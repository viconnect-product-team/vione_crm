// BC-5.1 — Canonical relationship-state action surface.
//
// Renders the correct set of controls for a target person based on the
// canonical ConnectionRelationshipStateDTO. Never derives state locally —
// always sources it from useConnectionRelationshipState (which delegates
// to ConnectionSDK.resolveRelationshipState).

import { useState } from "react";
import { CheckCircle2, Clock, Loader2, ShieldOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAcceptRequest,
  useCancelRequest,
  useConnectionRelationshipState,
  useDeclineRequest,
  useSendConnectionRequest,
  useUnblockPerson,
} from "@/hooks/use-connection";
import { useT } from "@/lib/i18n";
import { DisconnectDialog } from "./DisconnectDialog";
import { BlockDialog } from "./BlockDialog";

interface Props {
  targetPersonNodeId: string;
  personLabel?: string | null;
  className?: string;
  variant?: "card" | "inline";
}

export function ConnectionStateAction({
  targetPersonNodeId,
  personLabel,
  className,
  variant = "card",
}: Props) {
  const t = useT();
  const q = useConnectionRelationshipState(targetPersonNodeId);
  const send = useSendConnectionRequest();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const cancel = useCancelRequest();
  const unblock = useUnblockPerson();

  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const busy =
    send.isPending ||
    accept.isPending ||
    decline.isPending ||
    cancel.isPending ||
    unblock.isPending;

  const size = variant === "inline" ? "sm" : "sm";

  if (q.isPending || !q.data) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        className={className}
        aria-label={t("bc.conn.loading")}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        {t("bc.conn.loading")}
      </Button>
    );
  }

  const state = q.data.state;
  const requestId = q.data.requestId ?? undefined;

  const wrapper = "flex flex-wrap items-center gap-2";

  if (state === "none") {
    return (
      <div className={`${wrapper} ${className ?? ""}`}>
        <Button
          size={size}
          disabled={busy}
          onClick={() => send.mutate({ targetPersonNodeId })}
          data-testid="bc-action-connect"
          aria-label={t("bc.conn.action.connect")}
        >
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          {send.isPending ? t("bc.conn.working") : t("bc.conn.action.connect")}
        </Button>
      </div>
    );
  }

  if (state === "outgoing_pending") {
    return (
      <div className={`${wrapper} ${className ?? ""}`}>
        <Button size={size} variant="outline" disabled data-testid="bc-state-pending">
          <Clock className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("bc.conn.state.outgoingPending")}
        </Button>
        <Button
          size={size}
          variant="ghost"
          disabled={busy || !requestId}
          onClick={() => requestId && cancel.mutate({ requestId, targetPersonNodeId })}
          data-testid="bc-action-cancel"
        >
          {cancel.isPending ? t("bc.conn.working") : t("bc.conn.action.cancel")}
        </Button>
      </div>
    );
  }

  if (state === "incoming_pending") {
    return (
      <div className={`${wrapper} ${className ?? ""}`}>
        <Button
          size={size}
          disabled={busy || !requestId}
          onClick={() => requestId && accept.mutate({ requestId, targetPersonNodeId })}
          data-testid="bc-action-accept"
        >
          {accept.isPending ? t("bc.conn.working") : t("bc.conn.action.accept")}
        </Button>
        <Button
          size={size}
          variant="outline"
          disabled={busy || !requestId}
          onClick={() => requestId && decline.mutate({ requestId, targetPersonNodeId })}
          data-testid="bc-action-decline"
        >
          {t("bc.conn.action.decline")}
        </Button>
      </div>
    );
  }

  if (state === "connected") {
    return (
      <>
        <div className={`${wrapper} ${className ?? ""}`}>
          <Button size={size} variant="outline" disabled data-testid="bc-state-connected">
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("bc.conn.state.connected")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={size}
                variant="ghost"
                aria-label={t("bc.conn.more")}
                data-testid="bc-connected-menu"
              >
                {t("bc.conn.more")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDisconnectOpen(true)}
                data-testid="bc-menu-disconnect"
              >
                {t("bc.conn.action.disconnect")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setBlockOpen(true)}
                className="text-destructive focus:text-destructive"
                data-testid="bc-menu-block"
              >
                {t("bc.conn.action.block")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DisconnectDialog
          open={disconnectOpen}
          onOpenChange={setDisconnectOpen}
          targetPersonNodeId={targetPersonNodeId}
          personLabel={personLabel}
        />
        <BlockDialog
          open={blockOpen}
          onOpenChange={setBlockOpen}
          targetPersonNodeId={targetPersonNodeId}
          personLabel={personLabel}
        />
      </>
    );
  }

  if (state === "blocked_by_me") {
    return (
      <div className={`${wrapper} ${className ?? ""}`}>
        <Button size={size} variant="outline" disabled data-testid="bc-state-blocked">
          <ShieldOff className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("bc.conn.state.blocked")}
        </Button>
        <Button
          size={size}
          variant="ghost"
          disabled={busy}
          onClick={() => unblock.mutate({ targetPersonNodeId })}
          data-testid="bc-action-unblock"
        >
          {unblock.isPending ? t("bc.conn.working") : t("bc.conn.action.unblock")}
        </Button>
      </div>
    );
  }

  // blocked_me / unavailable → privacy-safe neutral state.
  return (
    <div className={`${wrapper} ${className ?? ""}`}>
      <Button size={size} variant="outline" disabled data-testid="bc-state-unavailable">
        {t("bc.conn.state.unavailable")}
      </Button>
    </div>
  );
}
