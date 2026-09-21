import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface GlassLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V5: EXECUTIVE GLASS DASHBOARD (Mưa & Kính Khúc Xạ)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Trung tâm tài chính đêm fixed inset-0, blur cực mạnh (blur-3xl) (z-index: -3).
 * Tầng 2 (Overlay Filter): Lớp phủ Smoked Glass bg-black/40 hoặc bg-[#0A0E1A]/60 (z-index: -2).
 * Tầng 3 (Atmosphere - Ảnh GIF): Giọt nước mưa chảy ròng ròng trên mặt kính mix-blend-screen opacity 20-28% (z-index: -1).
 * Scroll Logic: Wipe Fog (Section cũ ghim sticky, thanh gạt nước ảo Wipe Down trôi sương mù).
 */
export function GlassLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: GlassLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-clip ${
        isContrast
          ? "bg-black text-white"
          : isLight
            ? "bg-[#E2E8F0] text-slate-900"
            : "bg-[#060913] text-slate-100"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT TRUNG TÂM TÀI CHÍNH ĐÊM BLUR-3XL (z-index: -3) */}
        <div className="absolute inset-0 -z-30 overflow-hidden">
          <img
            src="/landing/bright_towers_light_city.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="Financial Center Night Skyline"
            className="h-full w-full object-cover scale-110 filter blur-3xl brightness-75 contrast-125"
          />
        </div>

        {/* TẦNG 2: OVERLAY FILTER SMOKED GLASS (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-500 ${
            isContrast
              ? "bg-black/95"
              : isLight
                ? "bg-gradient-to-b from-slate-200/80 via-slate-100/75 to-slate-200/90 backdrop-blur-md"
                : "bg-gradient-to-b from-[#060913]/85 via-[#0A0E1A]/80 to-[#060913]/90 backdrop-blur-md"
          }`}
        />

        {/* TẦNG 3: GIF MƯA CHẢY RÒNG RÒNG TRÊN KÍNH (z-index: -1) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Mưa ảo kết hợp SVG Rain Streams + Aurora Overlay */}
          <div className="absolute inset-0 opacity-25 mix-blend-screen bg-repeat">
            <img
              src="/landing/ceo1983-gold-aurora.gif"
              alt="Rain on Glass Refraction"
              className="h-full w-full object-cover mix-blend-screen opacity-20 filter hue-rotate-180"
            />
          </div>
          {/* Lớp kính mờ ngưng đọng giọt nước */}
          <div className="absolute inset-0 bg-radial from-transparent via-white/[0.02] to-black/30 pointer-events-none" />
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

/**
 * Scroll Hijacking - Wipe Fog Section Container
 * Thanh gạt nước ảo quét từ trên xuống trôi sương mù lộ thẻ nội dung kính mờ
 */
export function GlassWipeSection({
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

  // Thanh gạt nước quét trôi sương mù
  const wipeClip = useTransform(
    scrollYProgress,
    [0, 0.25, 0.8, 1],
    ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)", "inset(0% 0% 12% 0%)"]
  );
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.97, 1, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.9, 1, 1, 0.9]);

  return (
    <section ref={containerRef} id={id} className={`relative min-h-screen w-full ${className}`}>
      <motion.div
        style={{
          clipPath: wipeClip,
          scale,
          opacity,
        }}
        className="relative w-full h-full flex flex-col justify-center"
      >
        {children}
      </motion.div>
    </section>
  );
}
