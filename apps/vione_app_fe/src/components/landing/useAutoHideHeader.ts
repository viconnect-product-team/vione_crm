import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook to automatically hide header after `timeoutMs` (default 3000ms = 3s).
 * Reappears immediately on mouse movement, touch, or window scroll.
 */
export function useAutoHideHeader(timeoutMs = 3000) {
  const [showHeader, setShowHeader] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setShowHeader(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowHeader(false);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    // Start initial countdown
    resetTimer();

    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
      resetTimer();
    };

    const handleInteraction = () => {
      resetTimer();
    };

    const handleMouseMove = () => {
      resetTimer();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [resetTimer]);

  return {
    showHeader,
    isVisible: showHeader,
    isAtTop,
    resetTimer,
    headerStyle: {
      transform: showHeader ? "translateY(0)" : "translateY(-100%)",
      opacity: showHeader ? 1 : 0,
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
    } as React.CSSProperties,
  };
}
