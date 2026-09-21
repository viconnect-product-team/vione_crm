import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface DeepTechLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V6: DEEP TECH DATA (Cyberpunk - AI Core)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Data Center / Macro Server Chip fixed, che 2/3, lộ ánh sáng server góc phải dưới (z-index: -3).
 * Tầng 2 (Overlay Filter): Lớp mờ 90% + bo mạch điện tử Circuit Board (z-index: -2).
 * Tầng 3 (Atmosphere - Ảnh GIF): Tech Grid / Neural pulses mix-blend-screen opacity 18-24% (z-index: -1).
 * Scroll Logic: Scanline Glitch Laser Reveal (Tia laser quét từ trên xuống).
 */
export function DeepTechLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: DeepTechLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-clip ${
        isContrast
          ? "bg-[#030708] text-[#00FF66] font-mono"
          : isLight
            ? "bg-[#E5E7EB] text-[#111827]"
            : "bg-[#030712] text-[#F9FAFB]"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT DATA CENTER / SERVER CHIP (LỘ 1/3 GÓC DƯỚI PHẢI) (z-index: -3) */}
        <div className="absolute inset-0 -z-30 overflow-hidden">
          <img
            src="/landing/cyberpunk_dark_bg.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="AI Data Center Supercomputer"
            className={`h-full w-full object-cover transition-all duration-700 ${
              isLight
                ? "filter grayscale contrast-150 brightness-110 opacity-40"
                : isContrast
                  ? "filter grayscale contrast-200 brightness-50 opacity-30"
                  : "filter contrast-125 brightness-90 opacity-70"
            }`}
          />
        </div>

        {/* TẦNG 2: OVERLAY MỜ 90% & HỌA TIẾT BO MẠCH (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-500 ${
            isContrast
              ? "bg-[#030708]/92"
              : isLight
                ? "bg-[#E5E7EB]/90 backdrop-blur-md"
                : "bg-gradient-to-br from-[#030712]/96 via-[#030712]/90 to-[#0F172A]/80 backdrop-blur-md"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 85%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
          }}
        />

        {/* TẦNG 3: GIF BO MẠCH & DÒNG ĐIỆN MATRIX XANH (z-index: -1) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <img
            src="/landing/tech-grid-motion.gif"
            alt="Neural Dataflow Motion"
            className={`h-full w-full object-cover ${
              isContrast
                ? "mix-blend-screen opacity-30 filter hue-rotate-90"
                : isLight
                  ? "mix-blend-multiply opacity-10 filter invert"
                  : "mix-blend-screen opacity-20 filter hue-rotate-190"
            }`}
          />
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

/**
 * Scroll Hijacking - Scanline Glitch Laser Reveal Section Container
 * Khi scroll tới, xuất hiện tia laser quét từ trên xuống lộ rõ component
 */
export function DeepTechScanlineSection({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const laserY = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], ["-10%", "50%", "100%", "120%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.85, 1, 1, 0.85]);

  return (
    <section ref={containerRef} id={id} className={`relative min-h-screen w-full overflow-hidden ${className}`}>
      {/* Tia laser quét ảo */}
      <motion.div
        style={{ top: laserY }}
        className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-30 opacity-70"
      />

      <motion.div style={{ opacity }} className="relative w-full h-full flex flex-col justify-center">
        {children}
      </motion.div>
    </section>
  );
}
