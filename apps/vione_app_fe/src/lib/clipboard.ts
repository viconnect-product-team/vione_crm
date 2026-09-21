import { toast } from "sonner";

/**
 * Universal cross-platform copy to clipboard helper.
 * Works seamlessly across iOS Safari, WKWebView, Android Chrome, and desktop browsers.
 */
export async function copyToClipboard(
  text: string,
  showToastOrMessage: boolean | string = true,
  customToastMessage?: string,
): Promise<boolean> {
  if (!text) return false;

  const showToast = typeof showToastOrMessage === "boolean" ? showToastOrMessage : true;
  const toastMessage =
    typeof showToastOrMessage === "string"
      ? showToastOrMessage
      : customToastMessage || "Đã sao chép vào bộ nhớ tạm";

  let success = false;

  // 1. Try modern navigator.clipboard API if available and in secure context
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      // Fallback to legacy execCommand below
    }
  }

  // 2. Fallback: document.execCommand('copy') with temporary textarea
  if (!success && typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Ensure it stays off-screen and invisible without triggering zoom or keyboard
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");

      document.body.appendChild(textArea);
      textArea.focus({ preventScroll: true });
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      success = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (err) {
      console.warn("Fallback execCommand copy failed:", err);
      success = false;
    }
  }

  if (success && showToast) {
    toast.success(toastMessage);
  } else if (!success && showToast) {
    toast.error("Không thể sao chép. Vui lòng thử lại!");
  }

  return success;
}
