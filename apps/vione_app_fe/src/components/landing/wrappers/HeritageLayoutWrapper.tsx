import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ThemeMode } from "../DoorThemeTransition";
import { DoorThemeTransition } from "../DoorThemeTransition";

interface HeritageLayoutWrapperProps {
  theme: ThemeMode;
  children: React.ReactNode;
  isThemeTransitioning?: boolean;
  targetTheme?: ThemeMode;
}

/**
 * V3: HERITAGE & TRUST (Cổ Tích - Di sản & Ngân hàng Tư nhân)
 * BƯỚC 1: LAYOUT WRAPPER & 3 TẦNG BACKGROUND ĐAN XEN
 * 
 * Tầng 1 (Base - Ảnh thật): Giấy da cổ / thư viện di sản fixed inset-0 (z-index: -3).
 * Tầng 2 (Overlay Filter): Phủ overlay màu tối opacity-80 dìm ảnh thật (z-index: -2).
 * Tầng 3 (Atmosphere - Ảnh GIF): Hạt bụi sao vàng óng (Gold dust) lơ lửng với mix-blend-screen opacity 20-30% (z-index: -1).
 * Scroll Logic: Page Turn 3D (perspective 1000px, lật trang 3D rotateY(-90deg)).
 */
export function HeritageLayoutWrapper({
  theme,
  children,
  isThemeTransitioning = false,
  targetTheme = theme,
}: HeritageLayoutWrapperProps) {
  const isLight = theme === "light";
  const isContrast = theme === "contrast";

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-x-clip ${
        isContrast
          ? "bg-black text-white"
          : isLight
            ? "bg-[#FAF7EE] text-[#1C1917]"
            : "bg-[#070D1E] text-slate-100"
      }`}
    >
      {/* CÁNH CỬA ĐỔI THEME */}
      <DoorThemeTransition isTransitioning={isThemeTransitioning} targetTheme={targetTheme} />

      {/* =========================================================================
          3 TẦNG BACKGROUND ĐAN XEN (CINEMAGRAPH EFFECT)
          ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* TẦNG 1: ẢNH THẬT GIẤY DA CỔ / THƯ VIỆN HOÀNG GIA (z-index: -3) */}
        <div className="absolute inset-0 -z-30">
          <img
            src="/landing/cotich_dark_bg.jpg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2400&q=80";
            }}
            alt="Heritage Parchment & Archive"
            className={`h-full w-full object-cover ${
              isLight ? "opacity-70 filter contrast-125" : "opacity-85 filter brightness-75"
            }`}
          />
        </div>

        {/* TẦNG 2: OVERLAY FILTER TỐI DÌM ẢNH 80% (z-index: -2) */}
        <div
          className={`absolute inset-0 -z-20 transition-colors duration-500 ${
            isContrast
              ? "bg-black/95"
              : isLight
                ? "bg-[#FAF7EE]/85 backdrop-blur-[1px]"
                : "bg-[#070D1E]/85 backdrop-blur-[2px]"
          }`}
        />

        {/* TẦNG 3: GIF HẠT BỤI VÀNG LẤP LÁNH (GOLD DUST ATMOSPHERE) (z-index: -1) */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <img
            src="/landing/ceo1983-gold-aurora.gif"
            alt="Golden Dust Particles"
            className={`h-full w-full object-cover ${
              isLight
                ? "mix-blend-multiply opacity-20 filter sepia"
                : "mix-blend-screen opacity-25"
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
 * Scroll Hijacking - Page Turn 3D Section Container
 * Container có perspective: 1000px. Khi cuộn hết 1 section, dùng rotateY(-90deg) và transform-origin: left để lật như sách.
 */
export function HeritagePageTurnSection({
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

  // Lật trang 3D ngoắt sang trái
  const rotateY = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 0, 0, -28]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.8]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.98, 1, 1, 0.94]);

  return (
    <section
      ref={containerRef}
      id={id}
      className={`relative min-h-screen w-full [perspective:1200px] ${className}`}
    >
      <motion.div
        style={{
          rotateY,
          opacity,
          scale,
          transformOrigin: "left center",
        }}
        className="relative w-full h-full flex flex-col justify-center"
      >
        {children}
      </motion.div>
    </section>
  );
}
