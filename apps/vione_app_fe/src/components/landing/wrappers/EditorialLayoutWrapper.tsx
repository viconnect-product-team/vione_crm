import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface EditorialLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V4: PREMIUM EDITORIAL (Comic - Báo chí Đột phá)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Kiến trúc tòa nhà kính Abstract cắt xẻ, lọc Grayscale fixed inset-0 (z-index: -3).
 * Tầng 2 (Overlay Filter): Lớp màu nhám + họa tiết lưới Grid vuông cứng cáp (z-index: -2).
 * Tầng 3 (Atmosphere - Ảnh GIF): Tech Grid Motion đan xen mix-blend-screen / mix-blend-multiply opacity 12-18% (z-index: -1).
 * Scroll Logic: Snap & Slide (CSS Scroll Snap, trượt dứt khoát từ 2 bên lề).
 */
export function EditorialLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: EditorialLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-300 overflow-x-clip ${
        isContrast
          ? "bg-black text-white"
          : isLight
            ? "bg-white text-black"
            : "bg-[#0C0D0E] text-[#F3F4F6]"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT KIẾN TRÚC ABSTRACT LỌC GRAYSCALE (z-index: -3) */}
        <div className="absolute inset-0 -z-30">
          <img
            src="/landing/minimal_tower_dark.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="Abstract Architecture Glass"
            className="h-full w-full object-cover filter grayscale contrast-125 brightness-75"
          />
        </div>

        {/* TẦNG 2: OVERLAY HỌA TIẾT LƯỚI GRID VUÔNG VÀ DÌM MÀU (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-300 ${
            isContrast
              ? "bg-black/90"
              : isLight
                ? "bg-white/92"
                : "bg-[#0C0D0E]/90"
          }`}
          style={{
            backgroundImage: isLight
              ? "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)"
              : "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* TẦNG 3: GIF TECH GRID MOTION ĐAN XEN (z-index: -1) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <img
            src="/landing/tech-grid-motion.gif"
            alt="Editorial Dynamic Grid"
            className={`h-full w-full object-cover ${
              isLight
                ? "mix-blend-multiply opacity-[0.08]"
                : "mix-blend-screen opacity-[0.14]"
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
 * Scroll Hijacking - Snap & Slide Section Container
 * CSS Scroll Snap kết hợp hiệu ứng trượt vào từ bên lề với gia tốc nhanh và hãm phanh mượt
 */
export function EditorialSlideSection({
  children,
  id,
  direction = "left",
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  direction?: "left" | "right";
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const xOffset = direction === "left" ? -40 : 40;
  const x = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [xOffset, 0, 0, -xOffset]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.8, 1, 1, 0.8]);

  return (
    <section ref={containerRef} id={id} className={`relative min-h-screen w-full py-16 ${className}`}>
      <motion.div
        style={{
          x,
          opacity,
        }}
        className="relative w-full h-full flex flex-col justify-center"
      >
        {children}
      </motion.div>
    </section>
  );
}
