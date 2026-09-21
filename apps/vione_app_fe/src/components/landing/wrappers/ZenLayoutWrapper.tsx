import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface ZenLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V2: EXECUTIVE ZEN (Tinh thần Tu Tiên - Resort Cao Cấp)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Phong cảnh rặng núi đá / thiền viện fixed, cắt chéo chiếm đúng 40% bên phải.
 * Tầng 2 (Overlay Filter): Lớp dìm ảnh sương mù thanh tịnh.
 * Tầng 3 (Atmosphere - Ảnh GIF): Sương mù cuộn chảy (Flowing mist) mix-blend-screen / mix-blend-multiply opacity 15-25%.
 * Scroll Logic: Zen Reveal (Ghim sticky, clip-path inset kéo màn sương từ dưới lên xóa sổ section cũ).
 */
export function ZenLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: ZenLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-clip ${
        isContrast
          ? "bg-black text-white"
          : isLight
            ? "bg-[#F3F4F6] text-[#1F2937]"
            : "bg-[#090D14] text-[#E5E7EB]"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT NÚI ĐÁ THIỀN VIỆN - CẮT CHÉO 40% BÊN PHẢI (z-index: -3) */}
        <div
          style={{
            clipPath: "polygon(35% 0%, 100% 0%, 100% 100%, 15% 100%)",
          }}
          className="absolute inset-y-0 right-0 w-[55%] sm:w-[48%] -z-30 overflow-hidden"
        >
          <img
            src="/landing/tutien_dark_bg.jpg"
            onError={(e) => {
              // Fallback Unsplash ảnh rặng núi đá thiền viện độ phân giải cao
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="Zen Mountain Sanctuary"
            className={`h-full w-full object-cover transition-opacity duration-700 ${
              isLight ? "opacity-75 filter contrast-[1.05]" : "opacity-90 filter brightness-[0.85]"
            }`}
          />
        </div>

        {/* TẦNG 2: OVERLAY FILTER DÌM ẢNH & TẠO SƯƠNG MỜ THANH TỊNH (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-500 ${
            isContrast
              ? "bg-black/95"
              : isLight
                ? "bg-gradient-to-r from-[#F3F4F6] via-[#F3F4F6]/90 to-[#E5E7EB]/40"
                : "bg-gradient-to-r from-[#090D14] via-[#090D14]/90 to-[#0F172A]/50"
          }`}
        />

        {/* TẦNG 3: GIF SƯƠNG MÙ CUỘN CHẢY (FLOWING MIST) (z-index: -1) */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="/landing/ceo1983-gold-aurora.gif"
            alt="Flowing Mist Atmosphere"
            className={`h-full w-full object-cover ${
              isLight
                ? "mix-blend-multiply opacity-[0.12] filter grayscale"
                : "mix-blend-screen opacity-[0.22]"
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
 * Scroll Hijacking - Zen Reveal Section Container
 * Ghim section cũ (sticky), section mới dùng clip-path: inset(100% 0 0 0) từ từ kéo màn sương lên
 */
export function ZenRevealSection({
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
    offset: ["start start", "end end"],
  });

  // Khi cuộn sẽ kéo trôi màn sương (clip-path reveal)
  const clipInset = useTransform(
    scrollYProgress,
    [0, 0.25, 0.85, 1],
    ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 8% 0%)"]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.95, 1, 1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [30, 0, 0, -30]);

  return (
    <section ref={containerRef} id={id} className={`relative min-h-screen w-full ${className}`}>
      <motion.div
        style={{
          clipPath: clipInset,
          opacity,
          y,
        }}
        className="relative w-full h-full flex flex-col justify-center"
      >
        {children}
      </motion.div>
    </section>
  );
}
