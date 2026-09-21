import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";

// =========================================================================
// 1. INVERT CURSOR (CON TRỎ ÂM BẢN 40PX MIX-BLEND-DIFFERENCE)
// =========================================================================
export function InvertCursor40px() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const cursorX = useSpring(mouseX, { stiffness: 600, damping: 35 });
  const cursorY = useSpring(mouseY, { stiffness: 600, damping: 35 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="pointer-events-none fixed inset-0 z-[99999] size-10 rounded-full bg-white mix-blend-difference hidden md:block"
    />
  );
}

// =========================================================================
// 2. KINETIC TYPOGRAPHY (ĐĨA THAN XOAY TRÒN XUNG QUANH LOGO)
// =========================================================================
export function KineticTurntableTypography({
  text = "NHIỀU KẾT NỐI HƠN • NHIỀU CƠ HỘI HƠN • TĂNG TRƯỞNG BỀN VỮNG • ",
}: {
  text?: string;
}) {
  return (
    <div className="relative size-64 sm:size-72 flex items-center justify-center mx-auto my-8">
      {/* Central Business Connect Node */}
      <div className="absolute size-24 rounded-full border-2 border-amber-400 bg-slate-950 flex flex-col items-center justify-center p-2 text-center z-10 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">BUSINESS</span>
        <span className="text-xs font-black uppercase text-white tracking-wider">CONNECT</span>
      </div>

      {/* Rotating Vinyl Record SVG Path */}
      <motion.svg
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="w-full h-full"
        viewBox="0 0 300 300"
      >
        <defs>
          <path
            id="turntableCirclePath"
            d="M 150, 150 m -110, 0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0"
          />
        </defs>
        <text className="text-[11.5px] font-mono font-black uppercase tracking-[0.28em] fill-amber-300">
          <textPath href="#turntableCirclePath" startOffset="0%">
            {text}
          </textPath>
        </text>
      </motion.svg>
    </div>
  );
}

// =========================================================================
// 3. IMAGE MASK REVEAL (STAR / DROPLET CLIP-PATH ON SCROLL)
// =========================================================================
export function ImageMaskRevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Clip-path polygon morphs from a 12-point star/starburst into full 100% viewport coverage
  const clipProgress = useTransform(scrollYProgress, [0, 1], [30, 100]);

  return (
    <div ref={containerRef} className={`relative min-h-[90vh] overflow-hidden ${className}`}>
      <motion.div
        style={{
          clipPath: useTransform(
            clipProgress,
            (val) => `circle(${val}% at 50% 50%)`
          ),
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

// =========================================================================
// 4. HORIZONTAL PARALLAX SCROLL (TESTIMONIALS SLIDER)
// =========================================================================
export function HorizontalParallaxScroller({
  items,
}: {
  items: Array<{
    quote: string;
    author: string;
    role: string;
    org: string;
    metric?: string;
  }>;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-slate-950">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8 pl-12 sm:pl-20">
          {items.map((item, i) => (
            <div
              key={i}
              className="relative h-[420px] w-[340px] sm:w-[500px] shrink-0 overflow-hidden rounded-3xl border-2 border-amber-400/40 bg-[#0B0F17] p-8 shadow-2xl flex flex-col justify-between"
            >
              {item.metric && (
                <div className="inline-block self-start rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-mono font-bold text-amber-300 border border-amber-400/30">
                  {item.metric}
                </div>
              )}

              {/* Parallax inner text moving slightly offset */}
              <motion.p
                style={{
                  x: useTransform(scrollYProgress, [0, 1], [0, (i + 1) * -20]),
                }}
                className="text-lg sm:text-2xl font-bold leading-relaxed text-white"
              >
                "{item.quote}"
              </motion.p>

              <div className="border-t border-amber-500/20 pt-4">
                <div className="font-bold text-amber-300 text-base">{item.author}</div>
                <div className="text-xs text-slate-400">
                  {item.role} • <span className="text-slate-300">{item.org}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
