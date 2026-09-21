import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";

// =========================================================================
// 1. SMOOTH SCROLL (LENIS)
// =========================================================================
export function useLenisSmoothScroll() {
  useEffect(() => {
    // Disable on reduced motion or mobile touch to avoid jitter
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
}

// =========================================================================
// 2. CUSTOM CURSOR & MAGNETIC BUTTONS (APPLE SPATIAL)
// =========================================================================
export function SpatialCustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const cursorX = useSpring(mouseX, { stiffness: 450, damping: 30 });
  const cursorY = useSpring(mouseY, { stiffness: 450, damping: 30 });

  const [hoveredRect, setHoveredRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
    isHovering: boolean;
  }>({
    width: 20,
    height: 20,
    left: 0,
    top: 0,
    isHovering: false,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = (e.target as HTMLElement)?.closest("[data-magnetic]");
      if (target) {
        const rect = target.getBoundingClientRect();
        setHoveredRect({
          width: rect.width + 16,
          height: rect.height + 14,
          left: rect.left - 8,
          top: rect.top - 7,
          isHovering: true,
        });
      } else {
        setHoveredRect((prev) => (prev.isHovering ? { ...prev, isHovering: false } : prev));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block">
      {/* Regular Following Dot */}
      {!hoveredRect.isHovering ? (
        <motion.div
          style={{
            x: cursorX,
            y: cursorY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          className="size-4 rounded-full border border-amber-400 bg-amber-400/30 backdrop-blur-xs shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-opacity"
        />
      ) : (
        /* Enveloping Magnetic Glow Shell */
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: hoveredRect.left,
            y: hoveredRect.top,
            width: hoveredRect.width,
            height: hoveredRect.height,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute rounded-2xl border-2 border-amber-400/80 bg-amber-400/10 backdrop-blur-xs shadow-[0_0_25px_rgba(245,158,11,0.35)]"
        />
      )}
    </div>
  );
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.35,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 350, damping: 25 });
  const springY = useSpring(y, { stiffness: 350, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      data-magnetic="true"
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`inline-block cursor-pointer ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

// =========================================================================
// 3. APPLE TV CARD PARALLAX (CHO BENTO GRID)
// =========================================================================
export function AppleTVParallaxCard({
  children,
  icon,
  title,
  desc,
  badge,
  className = "",
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  badge?: string;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 25 });

  // Parallax layer depths
  const iconX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), { stiffness: 350, damping: 25 });
  const iconY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-18, 18]), { stiffness: 350, damping: 25 });

  const textX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 350, damping: 25 });
  const textY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-8, 8]), { stiffness: 350, damping: 25 });

  const bgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), { stiffness: 350, damping: 25 });
  const bgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 350, damping: 25 });

  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
    setGlarePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setGlarePos((p) => ({ ...p, opacity: 0 }));
  };

  return (
    <div className="[perspective:1200px] h-full w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#121A2A]/90 via-[#0B0F19]/90 to-[#070A12]/95 p-6 shadow-2xl transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)] ${className}`}
      >
        {/* Parallax Background Ambient Layer */}
        <motion.div
          style={{ x: bgX, y: bgY }}
          className="absolute -inset-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(216,178,130,0.12)_0%,transparent_70%)]"
        />

        {/* Apple Dynamic Specular Glare */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            opacity: glarePos.opacity,
          }}
        />

        {/* Parallax Layer 1: Floating Icon / Badge */}
        <motion.div
          style={{ x: iconX, y: iconY, translateZ: 35 }}
          className="relative z-10 flex items-center justify-between mb-4"
        >
          {icon && (
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 text-amber-300 shadow-md">
              {icon}
            </div>
          )}
          {badge && (
            <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              {badge}
            </span>
          )}
        </motion.div>

        {/* Parallax Layer 2: Title & Description */}
        <motion.div style={{ x: textX, y: textY, translateZ: 20 }} className="relative z-10 space-y-2">
          <h3 className="text-lg font-black tracking-tight text-white">{title}</h3>
          {desc && <p className="text-xs sm:text-sm leading-relaxed text-slate-300/90">{desc}</p>}
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

// =========================================================================
// 4. TEXT REVEAL (SPLITTYPE CHARACTER MASK SLIDE)
// =========================================================================
export function SplitTypeReveal({
  text,
  className = "",
  charClassName = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  charClassName?: string;
  delay?: number;
}) {
  const characters = Array.from(text);

  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {characters.map((char, index) => (
        <span key={index} className="inline-block overflow-hidden align-top">
          <motion.span
            initial={{ y: "130%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 140,
              delay: delay + index * 0.025,
            }}
            className={`inline-block ${char === " " ? "w-2.5 sm:w-3.5" : ""} ${charClassName}`}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
