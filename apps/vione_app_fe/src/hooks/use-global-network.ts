// BC-3.1C — Global Business Networking data + mutation hooks.
// The ONLY networking data path for UI code. Wraps GlobalNetworkSDK, resolves
// privacy-safe counterpart summaries, and centralizes optimistic list updates,
// toasts, and stable error → i18n mapping. UI never calls the SDK directly.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import { networkErrorTKey } from "@/lib/global-network/error-messages";
import { useT } from "@/lib/i18n";
import type { CounterpartSummary, GlobalConnectionDTO } from "@/lib/global-network/types";

export type NetworkSection = "connections" | "incoming" | "sent";

export type NetworkRow = GlobalConnectionDTO & {
  counterpart: CounterpartSummary | null;
};

const LOADERS: Record<NetworkSection, () => Promise<GlobalConnectionDTO[]>> = {
  connections: () => GlobalNetworkSDK.connections.listAccepted(),
  incoming: () => GlobalNetworkSDK.connections.listIncoming(),
  sent: () => GlobalNetworkSDK.connections.listOutgoing(),
};

/** Load a networking section and hydrate live counterpart summaries. */
export function useNetworkSection(section: NetworkSection) {
  const [rows, setRows] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (firstLoad.current) setLoading(true);
    else setRefreshing(true);
    let active = true;
    try {
      const list = await LOADERS[section]();
      const ids = Array.from(new Set(list.map((c: any) => c.counterpartUserId)));
      const summaries = ids.length ? await GlobalNetworkSDK.counterparts.resolvePublic(ids) : [];
      const byId = new Map(summaries.map((s) => [s.userId, s]));
      if (!active) return;
      setRows(list.map((c: any) => ({ ...c, counterpart: byId.get(c.counterpartUserId) ?? null })));
      setError(null);
    } catch (e) {
      if (active) setError(e instanceof Error ? e.message : "error");
    } finally {
      if (active) {
        setLoading(false);
        setRefreshing(false);
        firstLoad.current = false;
      }
    }
    return () => {
      active = false;
    };
  }, [section]);

  useEffect(() => {
    firstLoad.current = true;
    void load();
  }, [load]);

  const removeRow = useCallback((connectionId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== connectionId));
  }, []);

  return { rows, loading, refreshing, error, reload: load, removeRow };
}

/** Mutation helpers with optimistic removal, toasts, and i18n error mapping. */
export function useNetworkMutations(onRemoved: (connectionId: string) => void) {
  const t = useT();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = useCallback(
    async (
      connectionId: string,
      fn: () => Promise<unknown>,
      successKey: Parameters<typeof t>[0],
    ) => {
      setBusyId(connectionId);
      try {
        await fn();
        onRemoved(connectionId);
        toast.success(t(successKey));
        return true;
      } catch (e) {
        toast.error(t(networkErrorTKey(e)));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [onRemoved, t],
  );

  return {
    busyId,
    accept: (id: string) =>
      run(id, () => GlobalNetworkSDK.mutations.accept(id), "connect.network.toast.accepted"),
    decline: (id: string) =>
      run(id, () => GlobalNetworkSDK.mutations.decline(id), "connect.network.toast.declined"),
    cancel: (id: string) =>
      run(id, () => GlobalNetworkSDK.mutations.cancel(id), "connect.network.toast.cancelled"),
    disconnect: (id: string) =>
      run(
        id,
        () => GlobalNetworkSDK.mutations.disconnect(id),
        "connect.network.toast.disconnected",
      ),
    block: (id: string, targetUserId: string) =>
      run(
        id,
        () => GlobalNetworkSDK.mutations.block(targetUserId),
        "connect.network.toast.blocked",
      ),
  };
}
