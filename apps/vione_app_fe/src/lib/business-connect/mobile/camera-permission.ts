// Camera permission probe for the Moment composer.
//
// Truthful states only: we never claim the camera is available when the
// browser refuses it. Callers use "granted" to open the capture input, and
// every other state to surface the library fallback instead.

export type CameraPermissionState = "granted" | "denied" | "unsupported" | "error";

export type CameraPermissionResult = {
  state: CameraPermissionState;
};

function hasMediaDevices(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/**
 * Requests camera access, then immediately releases every track: we only need
 * the permission decision, not a live stream (the capture input owns the UI).
 */
export async function requestCameraPermission(): Promise<CameraPermissionResult> {
  if (!hasMediaDevices()) {
    // Some in-app browsers still honour <input capture> without mediaDevices.
    return { state: "unsupported" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    for (const track of stream.getTracks()) track.stop();
    return { state: "granted" };
  } catch (err) {
    const name = (err as { name?: string } | null)?.name ?? "";
    if (
      name === "NotAllowedError" ||
      name === "PermissionDeniedError" ||
      name === "SecurityError"
    ) {
      return { state: "denied" };
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      return { state: "unsupported" };
    }
    return { state: "error" };
  }
}
