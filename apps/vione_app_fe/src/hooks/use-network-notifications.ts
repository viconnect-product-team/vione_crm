// BC-3.1F — Networking notification center hook.
// Wraps GlobalNetworkSDK.notifications. UI never calls the SDK/server fns directly.

import { useCallback, useEffect, useRef, useState } from "react";
import { GlobalNetworkSDK } from "@/lib/global-network/network.sdk";
import type { GnNotificationDTO } from "@/lib/global-network/abuse.types";

export function useNetworkNotifications() {
  const [items, setItems] = useState<GnNotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);

  const load = useCallback(async () => {
    if (first.current) setLoading(true);
    try {
      const list = await GlobalNetworkSDK.notifications.list(50);
      setItems(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
      first.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    // optimistic
    setItems((prev) => prev.map((n: any) => ({ ...n, read: true })));
    try {
      await GlobalNetworkSDK.notifications.markRead();
    } catch {
      void load();
    }
  }, [load]);

  const unread = items.filter((n) => !n.read).length;
  return { items, loading, error, unread, reload: load, markAllRead };
}
