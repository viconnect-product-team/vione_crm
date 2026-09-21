// Apple Wallet real-pass architecture (server-only).
//
// This is a REAL integration skeleton, not a fake one. Minting a valid .pkpass
// requires signing with an Apple Pass Type certificate + the WWDR intermediate
// certificate — private key material that must never reach the client and is not
// stored in the repo. Until the certs/config are provided via server-only env,
// every function reports the provider as unavailable and mints nothing.
//
// No fake .pkpass is ever produced.

export type AppleWalletConfig = {
  enabled: boolean;
  passTypeIdentifier: string;
  teamIdentifier: string;
  certRef: string; // path or secret reference to the pass signing cert
  certPassword: string;
  wwdrRef: string; // path or secret reference to the WWDR intermediate cert
};

export type MintResult = { ok: true; passId: string; url: string } | { ok: false; reason: string };

export function readAppleWalletConfig(): AppleWalletConfig {
  return {
    enabled: process.env.APPLE_WALLET_ENABLED === "true",
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER ?? "",
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER ?? "",
    certRef: process.env.APPLE_PASS_CERT_PATH ?? "",
    certPassword: process.env.APPLE_PASS_CERT_PASSWORD ?? "",
    wwdrRef: process.env.APPLE_WWDR_CERT_PATH ?? "",
  };
}

export function canMintApplePass(cfg: AppleWalletConfig = readAppleWalletConfig()): boolean {
  return (
    cfg.enabled &&
    cfg.passTypeIdentifier.length > 0 &&
    cfg.teamIdentifier.length > 0 &&
    cfg.certRef.length > 0 &&
    cfg.certPassword.length > 0 &&
    cfg.wwdrRef.length > 0
  );
}

const UNAVAILABLE =
  "Apple Wallet chưa được cấu hình trên máy chủ (thiếu chứng chỉ Pass Type / WWDR).";

export async function mintAppleMembershipPass(_passId: string): Promise<MintResult> {
  if (!canMintApplePass()) return { ok: false, reason: UNAVAILABLE };
  // A configured deployment wires real .pkpass generation + signing here.
  return { ok: false, reason: "Apple Wallet minting chưa được triển khai trong môi trường này." };
}

export async function updateApplePass(_passId: string): Promise<MintResult> {
  if (!canMintApplePass()) return { ok: false, reason: UNAVAILABLE };
  return { ok: false, reason: "Apple Wallet update chưa được triển khai trong môi trường này." };
}

export async function revokeApplePass(_passId: string): Promise<MintResult> {
  if (!canMintApplePass()) return { ok: false, reason: UNAVAILABLE };
  return { ok: false, reason: "Apple Wallet revoke chưa được triển khai trong môi trường này." };
}
