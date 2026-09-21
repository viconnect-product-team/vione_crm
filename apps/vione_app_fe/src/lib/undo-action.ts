import { toast } from "sonner";

/**
 * Runs a (usually destructive) action after a short undo window.
 * Shows a toast with an "Undo" action; if the user clicks it before the
 * window elapses, `commit` is never called.
 */
export function performWithUndo(opts: {
  message: string;
  undoLabel: string;
  commit: () => Promise<void> | void;
  onError?: (e: unknown) => void;
  onUndo?: () => void;
  delayMs?: number;
}): void {
  const delay = opts.delayMs ?? 5000;
  let cancelled = false;

  const timer = setTimeout(() => {
    if (cancelled) return;
    Promise.resolve()
      .then(() => opts.commit())
      .catch((e) => opts.onError?.(e));
  }, delay);

  toast(opts.message, {
    duration: delay,
    action: {
      label: opts.undoLabel,
      onClick: () => {
        cancelled = true;
        clearTimeout(timer);
        opts.onUndo?.();
      },
    },
  });
}
