import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ThemeMode = "light" | "dark" | "contrast";

interface DoorThemeTransitionProps {
  isTransitioning: boolean;
  targetTheme: ThemeMode;
}

/**
 * Hiệu ứng chuyển Theme: Cánh cửa đóng mở
 * - Nền trắng (khi chuyển sang theme sáng)
 * - Nền đen (khi chuyển sang theme tối / tương phản)
 * Hai cánh cửa trượt đóng sập vào giữa rồi mở toang sang 2 bên.
 */
export function DoorThemeTransition({ isTransitioning, targetTheme }: DoorThemeTransitionProps) {
  const isLight = targetTheme === "light";
  const isContrast = targetTheme === "contrast";

  const doorBgClass = isContrast
    ? "bg-black"
    : isLight
      ? "bg-[#FAF8F5] text-slate-800"
      : "bg-[#02040A] text-[#F6E1C3]";

  const edgeBorderClass = isContrast
    ? "border-white/80"
    : isLight
      ? "border-[#C5A059]/40 shadow-[0_0_30px_rgba(0,0,0,0.15)]"
      : "border-[#D8B282]/40 shadow-[0_0_30px_rgba(0,0,0,0.8)]";

  return (
    <AnimatePresence>
      {isTransitioning && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex overflow-hidden">
          {/* Cánh cửa bên TRÁI */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`relative h-full w-1/2 border-r ${doorBgClass} ${edgeBorderClass}`}
          >
            {/* Vân viền & tay nắm cửa tối giản */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-1 rounded-full opacity-30 bg-current" />
          </motion.div>

          {/* Cánh cửa bên PHẢI */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`relative h-full w-1/2 border-l ${doorBgClass} ${edgeBorderClass}`}
          >
            {/* Vân viền & tay nắm cửa tối giản */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 h-16 w-1 rounded-full opacity-30 bg-current" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook điều khiển hiệu ứng cánh cửa đóng mở khi đổi theme
 */
export function useDoorThemeSwitch(
  currentTheme: ThemeMode,
  setThemeState: (theme: ThemeMode) => void
) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<ThemeMode>(currentTheme);

  const switchTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (newTheme === currentTheme || isTransitioning) return;
      setTargetTheme(newTheme);
      setIsTransitioning(true);

      // Khi 2 cánh cửa đã đóng kín vào giữa (320ms), thực hiện đổi state theme
      setTimeout(() => {
        setThemeState(newTheme);
      }, 320);

      // Giữ cửa đóng một tích tắc rồi mở toang ra
      setTimeout(() => {
        setIsTransitioning(false);
      }, 480);
    },
    [currentTheme, isTransitioning, setThemeState]
  );

  return {
    isTransitioning,
    targetTheme,
    switchTheme,
  };
}
