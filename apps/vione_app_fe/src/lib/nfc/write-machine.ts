// BC-Mobile-5B — deterministic NFC write state machine (pure reducer).
//
// States: IDLE → CAPABILITY_CHECKING → READY | UNSUPPORTED
//         READY → WAITING_FOR_TAG → WRITING → SUCCESS | ERROR
//         WAITING_FOR_TAG/WRITING → CANCELLED (abort)
//         ERROR/CANCELLED/SUCCESS → READY (retry) — via RESET
//
// Invariants enforced HERE, not in components:
// - START_WRITE is ignored unless READY with SUPPORTED_WRITE → double writes
//   and duplicate CTAs are impossible by construction.
// - WRITE_OK / WRITE_FAIL are only meaningful while an operation is active.

import type { NfcCapability, NfcErrorKind, NfcWriteState } from "./types";

export type NfcWriteEvent =
  | { type: "CHECK" }
  | { type: "CAPABILITY"; capability: NfcCapability }
  | { type: "START_WRITE" }
  | { type: "TAG_WRITE_STARTED" }
  | { type: "WRITE_OK" }
  | { type: "WRITE_FAIL"; kind: Exclude<NfcErrorKind, "CANCELLED"> }
  | { type: "CANCEL" }
  | { type: "RESET" };

export const nfcWriteInitialState: NfcWriteState = { status: "IDLE" };

export function nfcWriteReducer(state: NfcWriteState, event: NfcWriteEvent): NfcWriteState {
  switch (event.type) {
    case "CHECK":
      // (Re)check capability from any non-active state.
      if (state.status === "WAITING_FOR_TAG" || state.status === "WRITING") return state;
      return { status: "CAPABILITY_CHECKING" };

    case "CAPABILITY":
      if (state.status !== "CAPABILITY_CHECKING" && state.status !== "IDLE") return state;
      if (event.capability === "SUPPORTED_WRITE" || event.capability === "READ_ONLY_OR_EXTERNAL") {
        return { status: "READY", capability: event.capability };
      }
      return { status: "UNSUPPORTED" };

    case "START_WRITE":
      // Double-write guard: only a READY state with actual write support may
      // begin an operation.
      if (state.status !== "READY" || state.capability !== "SUPPORTED_WRITE") return state;
      return { status: "WAITING_FOR_TAG" };

    case "TAG_WRITE_STARTED":
      if (state.status !== "WAITING_FOR_TAG") return state;
      return { status: "WRITING" };

    case "WRITE_OK":
      if (state.status !== "WRITING" && state.status !== "WAITING_FOR_TAG") return state;
      return { status: "SUCCESS" };

    case "WRITE_FAIL":
      if (state.status !== "WRITING" && state.status !== "WAITING_FOR_TAG") return state;
      return { status: "ERROR", kind: event.kind };

    case "CANCEL":
      if (state.status !== "WAITING_FOR_TAG" && state.status !== "WRITING") return state;
      return { status: "CANCELLED" };

    case "RESET":
      // Back to a fresh capability check; the machine never assumes the
      // environment stayed the same between attempts.
      if (state.status === "WAITING_FOR_TAG" || state.status === "WRITING") return state;
      return { status: "CAPABILITY_CHECKING" };

    default:
      return state;
  }
}

/** True while an NFC operation is in flight (CTA must be inert). */
export function isNfcWriteActive(state: NfcWriteState): boolean {
  return state.status === "WAITING_FOR_TAG" || state.status === "WRITING";
}
