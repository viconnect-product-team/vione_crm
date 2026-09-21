import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// =========================================================================
// 1. LIQUID AURORA MESH BACKGROUND
// =========================================================================
export function LiquidAuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60">
      {/* Morphing Blob 1: Warm Amber Gold */}
      <motion.div
        animate={{
          scale: [1, 1.3, 0.9, 1.15, 1],
          x: [0, 80, -60, 40, 0],
          y: [0, -70, 50, -30, 0],
          rotate: [0, 90, 180, 270, 360],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[15%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-amber-500/35 via-amber-400/20 to-yellow-300/10 blur-[95px]"
      />

      {/* Morphing Blob 2: Royal Purple / Violet Velvet */}
      <motion.div
        animate={{
          scale: [1.1, 0.85, 1.25, 0.95, 1.1],
          x: [0, -90, 60, -40, 0],
          y: [0, 80, -40, 60, 0],
          rotate: [360, 270, 180, 90, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[35%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-purple-600/30 via-violet-500/20 to-indigo-600/15 blur-[105px]"
      />

      {/* Morphing Blob 3: Deep Cyan / Emerald Ocean */}
      <motion.div
        animate={{
          scale: [0.9, 1.2, 0.8, 1.1, 0.9],
          x: [0, 60, -80, 50, 0],
          y: [0, 60, -60, 30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[15%] left-[25%] h-[650px] w-[650px] rounded-full bg-gradient-to-r from-teal-500/25 via-emerald-400/15 to-sky-500/20 blur-[110px]"
      />
    </div>
  );
}

// =========================================================================
// 2. HOLOGRAPHIC FOIL CARD EFFECT (RAINBOW SHEEN ON TILT)
// =========================================================================
export function HolographicFoilCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, sheenX: 50, sheenY: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
    const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    const sheenX = (x / rect.width) * 100;
    const sheenY = (y / rect.height) * 100;

    setTilt({ rotX, rotY, sheenX, sheenY, opacity: 0.85 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0, sheenX: 50, sheenY: 50, opacity: 0 });
  };

  return (
    <div className="[perspective:1000px] h-full w-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg)`,
          transition: "transform 0.15s ease-out",
        }}
        className={`relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] p-6 backdrop-blur-xl shadow-2xl ${className}`}
      >
        {/* Holographic Rainbow Foil Layer */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-color-dodge transition-opacity duration-300"
          style={{
            opacity: tilt.opacity,
            background: `linear-gradient(${tilt.rotY * 8 + 125}deg, 
              rgba(255, 0, 128, 0.25) 0%, 
              rgba(255, 154, 0, 0.3) 25%, 
              rgba(208, 222, 33, 0.3) 50%, 
              rgba(0, 204, 255, 0.3) 75%, 
              rgba(155, 0, 255, 0.25) 100%)`,
            backgroundPosition: `${tilt.sheenX}% ${tilt.sheenY}%`,
          }}
        />

        {/* Diagonal Specular Reflection Line */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: tilt.opacity * 0.6,
            background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255,255,255,0.4) 0%, transparent 65%)`,
          }}
        />

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

// =========================================================================
// 3. SCROLL-TRIGGERED SVG MORPHING (GOOEY FLUID PIPES ECOSYSTEM)
// =========================================================================
export function GooeySvgMorphEcosystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  const pathLength = useTransform(scrollYProgress, [0.1, 0.85], [0, 1]);
  const centerScale = useTransform(scrollYProgress, [0, 0.5, 0.8], [0.6, 1.2, 1]);
  const burstOpacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto py-12">
      {/* SVG Liquid Filter for Gooey Effect */}
      <svg className="hidden">
        <defs>
          <filter id="gooeyFilter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* SVG Connecting Paths with Gooey Filter */}
      <div className="relative h-[340px] w-full" style={{ filter: "url(#gooeyFilter)" }}>
        <svg className="h-full w-full" viewBox="0 0 800 340" fill="none">
          {/* Path to Node Left */}
          <motion.path
            d="M 400 170 C 300 170, 250 80, 150 80"
            stroke="#F59E0B"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ pathLength }}
          />
          {/* Path to Node Right */}
          <motion.path
            d="M 400 170 C 500 170, 550 80, 650 80"
            stroke="#F59E0B"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ pathLength }}
          />
          {/* Path to Node Bottom Left */}
          <motion.path
            d="M 400 170 C 320 170, 280 260, 200 260"
            stroke="#D97706"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ pathLength }}
          />
          {/* Path to Node Bottom Right */}
          <motion.path
            d="M 400 170 C 480 170, 520 260, 600 260"
            stroke="#D97706"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ pathLength }}
          />
        </svg>

        {/* Central Bursting Liquid Droplet Node */}
        <motion.div
          style={{ scale: centerScale }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center font-black text-slate-950 text-xs text-center p-2 leading-tight uppercase"
        >
          BUSINESS CONNECT
        </motion.div>

        {/* Peripheral Nodes revealed after pipe burst */}
        <motion.div
          style={{ opacity: burstOpacity }}
          className="absolute top-[60px] left-[100px] px-4 py-2 rounded-xl border border-amber-400/40 bg-slate-900/90 text-white text-xs font-bold shadow-lg"
        >
          Hội Viên 360°
        </motion.div>
        <motion.div
          style={{ opacity: burstOpacity }}
          className="absolute top-[60px] right-[100px] px-4 py-2 rounded-xl border border-amber-400/40 bg-slate-900/90 text-white text-xs font-bold shadow-lg"
        >
          Thương Vụ B2B
        </motion.div>
        <motion.div
          style={{ opacity: burstOpacity }}
          className="absolute bottom-[60px] left-[150px] px-4 py-2 rounded-xl border border-amber-400/40 bg-slate-900/90 text-white text-xs font-bold shadow-lg"
        >
          AI Matchmaker
        </motion.div>
        <motion.div
          style={{ opacity: burstOpacity }}
          className="absolute bottom-[60px] right-[150px] px-4 py-2 rounded-xl border border-amber-400/40 bg-slate-900/90 text-white text-xs font-bold shadow-lg"
        >
          Deal Room Số
        </motion.div>
      </div>
    </div>
  );
}

// =========================================================================
// 4. THẤU KÍNH PHÓNG ĐẠI (MAGNIFYING GLASS LENS SCALE 1.5)
// =========================================================================
export function MagnifyingGlassLensStat({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setLens({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setLens((p) => ({ ...p, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl p-4 border border-amber-500/20 bg-slate-900/60 backdrop-blur-md cursor-crosshair select-none"
    >
      <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
        {number}
      </div>
      <div className="text-xs font-sans uppercase tracking-wider text-amber-300/80 mt-1">
        {label}
      </div>

      {/* Floating Magnifying Glass Circle */}
      {lens.visible && (
        <div
          className="pointer-events-none absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/10 backdrop-blur-xs shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center overflow-hidden"
          style={{
            left: lens.x,
            top: lens.y,
          }}
        >
          <div
            className="text-4xl sm:text-5xl font-black font-serif text-amber-300 scale-150 transition-transform"
            style={{
              transform: `translate(${(containerRef.current?.offsetWidth! / 2 - lens.x) * 0.4}px, ${(containerRef.current?.offsetHeight! / 2 - lens.y) * 0.4}px) scale(1.5)`,
            }}
          >
            {number}
          </div>
        </div>
      )}
    </div>
  );
}
