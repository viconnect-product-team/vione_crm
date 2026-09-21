import React from "react";
import { motion } from "framer-motion";

/**
 * Kinetic Word Reveal Component
 * Staggers each word upward with spring physics, blur wipe, and high contrast.
 */
export function KineticWords({
  text,
  className = "",
  highlightIndices = [],
  highlightClass = "text-rose-600 underline decoration-rose-300 decoration-wavy",
  delay = 0,
}: {
  text: string;
  className?: string;
  highlightIndices?: number[];
  highlightClass?: string;
  delay?: number;
}) {
  const words = text.split(" ");

  return (
    <span className={`inline-flex flex-wrap gap-x-[0.3em] overflow-hidden ${className}`}>
      {words.map((word, idx) => {
        const isHighlight = highlightIndices.includes(idx);
        return (
          <motion.span
            key={idx}
            initial={{ y: 40, opacity: 0, filter: "blur(6px)" }}
            whileInView={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{
              duration: 0.55,
              delay: delay + idx * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`inline-block ${isHighlight ? highlightClass : ""}`}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}

/**
 * Kinetic Title Box with Slide-up & Underline Glow
 */
export function KineticTitleBox({
  badge,
  title,
  subtitle,
  className = "",
}: {
  badge: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 text-center ${className}`}>
      {/* Animated Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase bg-rose-50 border border-rose-200 text-rose-700 shadow-sm"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <span>{badge}</span>
      </motion.div>

      {/* Kinetic Title */}
      <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 font-serif">
        <KineticWords text={title} />
      </h2>

      {/* Kinetic Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-sans"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
