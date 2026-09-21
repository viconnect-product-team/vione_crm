// Wallet provider abstraction. This is an integration LAYER, not a fake
// integration: when a real Apple/Google Wallet backend is configured (via
// feature flags + endpoints), we hand off to it. Until then, providers report
// themselves unavailable so the UI can gracefully hide/disable wallet actions.
//
// No fake passes are generated. Adding a real backend later only requires
// wiring the endpoints below — the UI contract does not change.

import type { MembershipPass } from "@/lib/membership-pass";

export type WalletProviderId = "apple" | "google";

export type WalletCapability = {
  id: WalletProviderId;
  label: string;
  /** Whether a real backend endpoint is configured for this provider. */
  available: boolean;
  /** Reason surfaced to the UI when unavailable. */
  reason?: string;
};

export type WalletFlags = {
  appleWalletEnabled: boolean;
  googleWalletEnabled: boolean;
  /** Backend endpoint that mints signed passes; empty ⇒ not configured. */
  passEndpoint: string;
};

export const DEFAULT_WALLET_FLAGS: WalletFlags = {
  appleWalletEnabled: false,
  googleWalletEnabled: false,
  passEndpoint: "",
};

export function readWalletFlags(): WalletFlags {
  // Client-safe public flags only (VITE_*). Real minting happens server-side.
  const env = import.meta.env as Record<string, string | undefined>;
  return {
    appleWalletEnabled: env.VITE_APPLE_WALLET_ENABLED === "true",
    googleWalletEnabled: env.VITE_GOOGLE_WALLET_ENABLED === "true",
    passEndpoint: env.VITE_WALLET_PASS_ENDPOINT ?? "",
  };
}

export function walletCapabilities(flags: WalletFlags = readWalletFlags()): WalletCapability[] {
  const configured = flags.passEndpoint.trim().length > 0;
  return [
    {
      id: "apple",
      label: "Apple Wallet",
      available: flags.appleWalletEnabled && configured,
      reason: !flags.appleWalletEnabled
        ? "Chưa bật tích hợp Apple Wallet"
        : !configured
          ? "Chưa cấu hình máy chủ tạo thẻ"
          : undefined,
    },
    {
      id: "google",
      label: "Google Wallet",
      available: flags.googleWalletEnabled && configured,
      reason: !flags.googleWalletEnabled
        ? "Chưa bật tích hợp Google Wallet"
        : !configured
          ? "Chưa cấu hình máy chủ tạo thẻ"
          : undefined,
    },
  ];
}

/** Build the deep link / add-to-wallet URL from the configured backend. */
export function walletAddUrl(
  provider: WalletProviderId,
  pass: MembershipPass,
  flags: WalletFlags = readWalletFlags(),
): string | null {
  const cap = walletCapabilities(flags).find((c) => c.id === provider);
  if (!cap?.available) return null;
  const base = flags.passEndpoint.replace(/\/$/, "");
  return `${base}/${provider}?code=${encodeURIComponent(pass.memberCode)}`;
}
