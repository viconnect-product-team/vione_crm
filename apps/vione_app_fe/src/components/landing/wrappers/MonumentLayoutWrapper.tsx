import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface MonumentLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V7: CORPORATE MONUMENT (Kim Tự Tháp - Cấu trúc Nguyên khối)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Phiến đá cẩm thạch / đền đài đá nguyên khối lệch phải overflow (z-index: -3).
 * Tầng 2 (Overlay Filter): Lớp dìm khối đá obsidian sang trọng (z-index: -2).
 * Tầng 3 (Atmosphere - Ảnh GIF): Bão cát vàng (Sandstorm) thổi ngang qua mix-blend-screen opacity 18-25% (z-index: -1).
 * Scroll Logic: Cửa Đá Hầm Mộ (2 khối đá trượt vào đóng sập rung lắc nhẹ rồi mở dọc theo chiều trên-dưới).
 */
export function MonumentLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: MonumentLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-clip ${
        isContrast
          ? "bg-black text-white"
          : isLight
            ? "bg-[#F7F3EB] text-[#292524]"
            : "bg-[#090706] text-[#F5F5F4]"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT ĐÁ CẨM THẠCH / ĐỀN ĐÀI LỆCH PHẢI OVERFLOW (z-index: -3) */}
        <div className="absolute inset-y-0 right-0 w-[55%] -z-30 overflow-hidden translate-x-10">
          <img
            src="/landing/pyramids_3d_zerog.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="Monolithic Marble Architecture"
            className={`h-full w-full object-cover ${
              isLight
                ? "opacity-65 filter contrast-125 brightness-110"
                : "opacity-80 filter brightness-70 contrast-125"
            }`}
          />
        </div>

        {/* TẦNG 2: OVERLAY FILTER OBSIDIAN VÀNG ĐỒNG (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-500 ${
            isContrast
              ? "bg-black/95"
              : isLight
                ? "bg-gradient-to-r from-[#F7F3EB] via-[#F7F3EB]/90 to-[#E7E0D3]/60 backdrop-blur-[1px]"
                : "bg-gradient-to-r from-[#090706] via-[#090706]/92 to-[#1C1917]/70 backdrop-blur-[2px]"
          }`}
        />

        {/* TẦNG 3: GIF BÃO CÁT VÀNG THỔI NGANG (SANDSTORM ATMOSPHERE) (z-index: -1) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <img
            src="/landing/luxury-gold-grid.gif"
            alt="Sandstorm Gold Particles"
            className={`h-full w-full object-cover ${
              isLight
                ? "mix-blend-multiply opacity-15 filter sepia"
                : "mix-blend-screen opacity-22"
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
 * Scroll Hijacking - Cửa Đá Hầm Mộ Section Container
 * Khi cuộn, 2 khối div đen sậm trượt vào đóng sập ở giữa (rung nhẹ) rồi mở toang theo chiều dọc
 */
export function MonumentStoneVaultSection({
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

  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.95, 1, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.85, 1, 1, 0.85]);

  return (
    <section ref={containerRef} id={id} className={`relative min-h-screen w-full py-16 ${className}`}>
      <motion.div
        style={{
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
