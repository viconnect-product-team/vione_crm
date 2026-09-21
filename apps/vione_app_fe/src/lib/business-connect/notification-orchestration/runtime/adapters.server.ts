// BC-8.1 §M §N §O §P — Channel adapters + provider registry.
//
// Only the in-app adapter is active. Email/push adapters ship as unavailable
// stubs — activation is DEFERRED until real infrastructure exists (§37/§38).

import type { NotificationChannel } from "../types";
import type { AdapterResult } from "./types";

export interface NotificationChannelAdapter {
  readonly channel: NotificationChannel;
  readonly provider: string;
  readonly enabled: boolean;
  send(input: {
    notificationId: string;
    recipientUserId: string;
    titleKey: string;
    bodyKey: string;
  }): Promise<AdapterResult>;
}

/** In-app: canonical row insert already counts as delivery; adapter simply
 *  marks the dispatch row delivered so the recipient inbox stays consistent. */
export const InAppNotificationAdapter: NotificationChannelAdapter = Object.freeze({
  channel: "in_app" as const,
  provider: "internal",
  enabled: true,
  async send(): Promise<AdapterResult> {
    return { kind: "delivered", externalReference: null };
  },
});

/** Email: no provider wired. Return `unsupported` — dispatcher records
 *  `unsupported_channel` and never fakes delivery (§N). */
export const UnsupportedEmailAdapter: NotificationChannelAdapter = Object.freeze({
  channel: "email" as const,
  provider: "unavailable",
  enabled: false,
  async send(): Promise<AdapterResult> {
    return { kind: "unsupported", errorCode: "unsupported_channel" };
  },
});

/** Push: same posture as email until a device-token registry ships (§O). */
export const UnsupportedPushAdapter: NotificationChannelAdapter = Object.freeze({
  channel: "push" as const,
  provider: "unavailable",
  enabled: false,
  async send(): Promise<AdapterResult> {
    return { kind: "unsupported", errorCode: "unsupported_channel" };
  },
});

export class NotificationProviderRegistry {
  private readonly byChannel: ReadonlyMap<NotificationChannel, NotificationChannelAdapter>;
  constructor(
    adapters: readonly NotificationChannelAdapter[] = [
      InAppNotificationAdapter,
      UnsupportedEmailAdapter,
      UnsupportedPushAdapter,
    ],
  ) {
    const map = new Map<NotificationChannel, NotificationChannelAdapter>();
    for (const a of adapters) {
      if (map.has(a.channel)) throw new Error(`Duplicate adapter for channel ${a.channel}`);
      map.set(a.channel, a);
    }
    this.byChannel = map;
  }
  resolve(channel: NotificationChannel): NotificationChannelAdapter | null {
    return this.byChannel.get(channel) ?? null;
  }
  /** For observability only. */
  activationStatus(): Record<NotificationChannel, { provider: string; enabled: boolean }> {
    const out: Record<string, { provider: string; enabled: boolean }> = {};
    for (const [ch, a] of this.byChannel.entries())
      out[ch] = { provider: a.provider, enabled: a.enabled };
    return out as Record<NotificationChannel, { provider: string; enabled: boolean }>;
  }
}

export const defaultProviderRegistry = new NotificationProviderRegistry();
