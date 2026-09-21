// Google Wallet real-pass architecture (server-only).
//
// Real Google Wallet passes require a service-account key to sign the "save"
// JWT and to create/patch wallet objects via the Google Wallet API. That key is
// private, server-only, and never stored in the repo. Until it is provided via
// server-only env, every function reports unavailable and creates nothing.
//
// No fake wallet object / save link is ever produced.

export type GoogleWalletConfig = {
  enabled: boolean;
  issuerId: string;
  serviceAccountRef: string; // JSON or secret reference
  classId: string;
};

export type MintResult = { ok: true; passId: string; url: string } | { ok: false; reason: string };

export function readGoogleWalletConfig(): GoogleWalletConfig {
  return {
    enabled: process.env.GOOGLE_WALLET_ENABLED === "true",
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID ?? "",
    serviceAccountRef: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON ?? "",
    classId: process.env.GOOGLE_WALLET_CLASS_ID ?? "",
  };
}

export function canMintGooglePass(cfg: GoogleWalletConfig = readGoogleWalletConfig()): boolean {
  return (
    cfg.enabled &&
    cfg.issuerId.length > 0 &&
    cfg.serviceAccountRef.length > 0 &&
    cfg.classId.length > 0
  );
}

const UNAVAILABLE =
  "Google Wallet chưa được cấu hình trên máy chủ (thiếu Issuer ID / Service Account).";

export async function mintGoogleMembershipPass(_passId: string): Promise<MintResult> {
  if (!canMintGooglePass()) return { ok: false, reason: UNAVAILABLE };
  return { ok: false, reason: "Google Wallet minting chưa được triển khai trong môi trường này." };
}

export async function updateGooglePass(_passId: string): Promise<MintResult> {
  if (!canMintGooglePass()) return { ok: false, reason: UNAVAILABLE };
  return { ok: false, reason: "Google Wallet update chưa được triển khai trong môi trường này." };
}

export async function revokeGooglePass(_passId: string): Promise<MintResult> {
  if (!canMintGooglePass()) return { ok: false, reason: UNAVAILABLE };
  return { ok: false, reason: "Google Wallet revoke chưa được triển khai trong môi trường này." };
}
