// BC-6.0 — Deterministic cursor bound to version + normalized query.
import { graphErr } from "../errors";
import { SMART_INTRODUCTION_VERSION } from "./types";

export interface IntroductionCursor {
  v: typeof SMART_INTRODUCTION_VERSION;
  t: string; // targetPersonNodeId
  d: 2 | 3; // maxDepth
  k: string; // last ranking key: score.pathId
}

export function encodeCursor(c: IntroductionCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(
  raw: string | null | undefined,
  targetPersonNodeId: string,
  maxDepth: 2 | 3,
): IntroductionCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as IntroductionCursor;
    if (parsed.v !== SMART_INTRODUCTION_VERSION) {
      throw graphErr("INTRODUCTION_VERSION_UNSUPPORTED");
    }
    if (parsed.t !== targetPersonNodeId || parsed.d !== maxDepth) {
      throw graphErr("INTRODUCTION_CURSOR_INVALID");
    }
    return parsed;
  } catch (e) {
    if ((e as { code?: string })?.code) throw e;
    throw graphErr("INTRODUCTION_CURSOR_INVALID");
  }
}
