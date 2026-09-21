// BC-3.1D — Business Profile relationship hook.
// The ONLY relationship data/mutation path for the public Business Profile UI.
// Wraps ProfileConnectSDK: detects the viewer's session, loads the viewer-safe
// relationship state, and centralizes mutation keys (idempotency), busy state,
// toasts, and stable error → i18n mapping. UI never calls the SDK directly.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileConnectSDK } from "@/lib/business-card/profile-connect.sdk";
import type { BusinessProfileRelationshipState } from "@/lib/business-card/profile-connect.types";
import { networkErrorTKey } from "@/lib/global-network/error-messages";
import { toNetworkErrorCode } from "@/lib/global-network/error-messages";
import { useT } from "@/lib/i18n";

import { safeRandomUUID } from "@/lib/utils";

const ANON_STATE: BusinessProfileRelationshipState = {
  viewer: "anonymous",
  savedCard: false,
  effectiveState: "anonymous",
};

function newMutationKey(): string {
  return safeRandomUUID();
}

export type ProfileConnectAction = "connect" | "accept" | "decline" | "cancel" | "disconnect";

export function useBusinessProfileRelationship(cardSlug: string) {
  const t = useT();
  const [state, setState] = useState<BusinessProfileRelationshipState>(ANON_STATE);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ProfileConnectAction | null>(null);
  const authed = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      authed.current = Boolean(data.user);
      if (!authed.current) {
        setState(ANON_STATE);
        return;
      }
      setState(await ProfileConnectSDK.getState(cardSlug));
    } catch {
      setState(
        authed.current
          ? { viewer: "authenticated", savedCard: false, effectiveState: "unavailable" }
          : ANON_STATE,
      );
    } finally {
      setLoading(false);
    }
  }, [cardSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (
      action: ProfileConnectAction,
      op: (mutationKey: string) => Promise<unknown>,
      successKey: Parameters<typeof t>[0],
    ) => {
      if (pending) return;
      setPending(action);
      try {
        await op(newMutationKey());
        toast.success(t(successKey));
        await load();
      } catch (e) {
        toast.error(t(networkErrorTKey(e)));
        // A conflicting/stale connection means our view is out of date — refetch.
        const code = toNetworkErrorCode(e);
        if (code === "NETWORK_MUTATION_CONFLICT" || code === "NETWORK_INVALID_TRANSITION") {
          await load();
        }
      } finally {
        setPending(null);
      }
    },
    [pending, t, load],
  );

  const connectionId = state.connection?.id;

  const actions = {
    connect: () =>
      run(
        "connect",
        (mk) => ProfileConnectSDK.connect(cardSlug, mk),
        "connect.profile.toast.requested",
      ),
    accept: () =>
      connectionId &&
      run(
        "accept",
        (mk) => ProfileConnectSDK.accept(cardSlug, connectionId, mk),
        "connect.network.toast.accepted",
      ),
    decline: (reason?: string) =>
      connectionId &&
      run(
        "decline",
        (mk) => ProfileConnectSDK.decline(cardSlug, connectionId, reason, mk),
        "connect.network.toast.declined",
      ),
    cancel: () =>
      connectionId &&
      run(
        "cancel",
        (mk) => ProfileConnectSDK.cancel(cardSlug, connectionId, mk),
        "connect.network.toast.cancelled",
      ),
    disconnect: (reason?: string) =>
      connectionId &&
      run(
        "disconnect",
        (mk) => ProfileConnectSDK.disconnect(cardSlug, connectionId, reason, mk),
        "connect.network.toast.disconnected",
      ),
  };

  return { state, loading, pending, actions, reload: load };
}
