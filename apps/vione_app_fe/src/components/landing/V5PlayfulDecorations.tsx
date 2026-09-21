import React from "react";

/**
 * 3D Glassmorphic Water Droplet Component
 * Features realistic caustic glint, specular reflection, glass refraction, and 3D drop shadow.
 */
export function WaterDroplet3D({
  size = 18,
  top,
  bottom,
  left,
  right,
  delay = "0s",
  wobble = true,
  className = "",
}: {
  size?: number;
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
  delay?: string;
  wobble?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`absolute pointer-events-auto transition-transform duration-300 hover:scale-125 z-20 select-none ${
        wobble ? "anim-v5-droplet-wobble" : ""
      } ${className}`}
      style={{
        width: size,
        height: size * 1.08,
        top,
        bottom,
        left,
        right,
        animationDelay: delay,
        borderRadius: "53% 47% 62% 38% / 46% 54% 46% 54%",
        background:
          "radial-gradient(circle at 28% 25%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 20%, rgba(186,230,253,0.4) 55%, rgba(14,165,233,0.2) 80%, rgba(2,132,199,0.3) 100%)",
        boxShadow:
          "inset 2px 3px 6px rgba(255,255,255,0.95), inset -2px -2px 5px rgba(2,132,199,0.35), 0 5px 14px rgba(14,165,233,0.25), 0 2px 4px rgba(0,0,0,0.06)",
        border: "0.5px solid rgba(255,255,255,0.9)",
        backdropFilter: "blur(3px)",
      }}
      title="Giọt nước 3D ViOne V5"
    >
      {/* Specular Glint */}
      <div
        className="absolute w-1.5 h-1.5 rounded-full bg-white opacity-95 shadow-sm"
        style={{ top: "18%", left: "22%" }}
      />
      {/* Secondary micro light reflection */}
      <div
        className="absolute w-1 h-0.5 rounded-full bg-white/70"
        style={{ bottom: "22%", right: "26%" }}
      />
    </div>
  );
}

/**
 * Cluster of 3D Water Droplets Clinging to Top-Left and Top-Right Corners of Section Headers
 */
export function SectionHeaderDroplets() {
  return (
    <>
      {/* Top-Left Header Droplet Cluster */}
      <div className="absolute -top-3.5 -left-3.5 pointer-events-none z-20">
        <WaterDroplet3D size={22} top={-2} left={-2} delay="0s" wobble />
        <WaterDroplet3D size={13} top={14} left={-8} delay="0.4s" />
        <WaterDroplet3D size={10} top={-6} left={16} delay="0.8s" wobble />
      </div>

      {/* Top-Right Header Droplet Cluster */}
      <div className="absolute -top-3.5 -right-3.5 pointer-events-none z-20">
        <WaterDroplet3D size={20} top={-3} right={-2} delay="0.2s" wobble />
        <WaterDroplet3D size={14} top={12} right={-7} delay="0.6s" />
        <WaterDroplet3D size={11} top={-6} right={15} delay="1.0s" wobble />
      </div>
    </>
  );
}

/**
 * Cute Animated Sea Crab (Con cua biển cử động càng, chân & mắt chớp)
 */
export function CuteCrabAnimation({
  side = "left",
  size = 56,
}: {
  side?: "left" | "right";
  size?: number;
}) {
  return (
    <div
      className={`inline-flex flex-col items-center select-none group cursor-pointer transition-transform hover:scale-110 ${
        side === "right" ? "-scale-x-100" : ""
      }`}
      title="Chú cua thông thái Business Connect V5"
    >
      <svg
        width={size}
        height={size * 0.85}
        viewBox="0 0 100 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="anim-v5-crab-scuttle filter drop-shadow-[0_4px_8px_rgba(249,115,22,0.3)]"
      >
        {/* Legs Left */}
        <g className="anim-v5-crab-legs-left">
          <path d="M 30,52 Q 15,48 8,62" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
          <path d="M 32,56 Q 16,56 12,72" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
          <path d="M 35,60 Q 20,66 18,80" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Legs Right */}
        <g className="anim-v5-crab-legs-right">
          <path d="M 70,52 Q 85,48 92,62" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
          <path d="M 68,56 Q 84,56 88,72" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
          <path d="M 65,60 Q 80,66 82,80" stroke="#EA580C" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* Crab Main Body / Carapace */}
        <ellipse cx="50" cy="54" rx="28" ry="20" fill="url(#crabBodyGrad)" stroke="#C2410C" strokeWidth="2.5" />
        {/* Shell Highlights */}
        <ellipse cx="50" cy="46" rx="20" ry="10" fill="white" fillOpacity="0.25" />

        {/* Left Claw Arm & Claw */}
        <g className="anim-v5-crab-claw-left" style={{ transformOrigin: "28px 42px" }}>
          <path d="M 30,46 Q 18,34 16,22" stroke="#EA580C" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M 12,22 C 8,14 14,4 22,10 C 26,14 24,20 18,24 Z"
            fill="#FB923C"
            stroke="#C2410C"
            strokeWidth="2"
          />
          {/* Moving pincher */}
          <path
            d="M 16,14 C 18,8 24,6 28,12 C 24,18 20,18 16,14 Z"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth="1.5"
          />
        </g>

        {/* Right Claw Arm & Claw */}
        <g className="anim-v5-crab-claw-right" style={{ transformOrigin: "72px 42px" }}>
          <path d="M 70,46 Q 82,34 84,22" stroke="#EA580C" strokeWidth="5" strokeLinecap="round" />
          <path
            d="M 88,22 C 92,14 86,4 78,10 C 74,14 76,20 82,24 Z"
            fill="#FB923C"
            stroke="#C2410C"
            strokeWidth="2"
          />
          {/* Moving pincher */}
          <path
            d="M 84,14 C 82,8 76,6 72,12 C 76,18 80,18 84,14 Z"
            fill="#F97316"
            stroke="#C2410C"
            strokeWidth="1.5"
          />
        </g>

        {/* Eyestalks & Big Cute Eyes */}
        <path d="M 42,40 L 40,28" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 58,40 L 60,28" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />

        {/* Left Eye */}
        <circle cx="39" cy="24" r="6.5" fill="white" stroke="#C2410C" strokeWidth="1.5" />
        <circle cx="39" cy="24" r="3.5" fill="#1E293B" className="anim-v5-crab-eye" />
        <circle cx="41" cy="22" r="1.5" fill="white" />

        {/* Right Eye */}
        <circle cx="61" cy="24" r="6.5" fill="white" stroke="#C2410C" strokeWidth="1.5" />
        <circle cx="61" cy="24" r="3.5" fill="#1E293B" className="anim-v5-crab-eye" />
        <circle cx="63" cy="22" r="1.5" fill="white" />

        {/* Cute Smile & Rosy Cheeks */}
        <path d="M 44,57 Q 50,62 56,57" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="36" cy="55" rx="3" ry="2" fill="#F43F5E" fillOpacity="0.45" />
        <ellipse cx="64" cy="55" rx="3" ry="2" fill="#F43F5E" fillOpacity="0.45" />

        {/* Floating Oxygen Bubbles */}
        <circle cx="48" cy="14" r="2.5" fill="#38BDF8" fillOpacity="0.6" className="anim-v5-bubble-1" />
        <circle cx="52" cy="8" r="1.8" fill="#38BDF8" fillOpacity="0.7" className="anim-v5-bubble-2" />

        <defs>
          <linearGradient id="crabBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="50%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Blooming Flower Animation (Cây hoa sắc màu đung đưa)
 */
export function BloomingFlowerAnimation({ size = 52 }: { size?: number }) {
  return (
    <div
      className="inline-flex flex-col items-center select-none group cursor-pointer transition-transform hover:scale-125"
      title="Đóa hoa tài lộc Business Connect"
    >
      <svg
        width={size}
        height={size * 1.3}
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="anim-v5-flower-sway filter drop-shadow-[0_4px_10px_rgba(236,72,153,0.25)]"
      >
        {/* Stem */}
        <path d="M 30,35 Q 26,55 30,78" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />

        {/* Leaves */}
        <path
          d="M 28,52 Q 12,48 18,60 Q 25,58 28,54"
          fill="#4ADE80"
          stroke="#15803D"
          strokeWidth="1.5"
          className="anim-v5-leaf-left"
        />
        <path
          d="M 30,62 Q 46,58 42,70 Q 34,68 30,64"
          fill="#4ADE80"
          stroke="#15803D"
          strokeWidth="1.5"
          className="anim-v5-leaf-right"
        />

        {/* Flower Head */}
        <g className="anim-v5-flower-head" style={{ transformOrigin: "30px 30px" }}>
          {/* Petals */}
          <circle cx="30" cy="18" r="8" fill="#F472B6" />
          <circle cx="30" cy="42" r="8" fill="#F472B6" />
          <circle cx="18" cy="30" r="8" fill="#FB7185" />
          <circle cx="42" cy="30" r="8" fill="#FB7185" />
          <circle cx="21" cy="21" r="7.5" fill="#F43F5E" />
          <circle cx="39" cy="21" r="7.5" fill="#F43F5E" />
          <circle cx="21" cy="39" r="7.5" fill="#E11D48" />
          <circle cx="39" cy="39" r="7.5" fill="#E11D48" />

          {/* Core Center */}
          <circle cx="30" cy="30" r="7.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="30" cy="30" r="4.5" fill="#FEF08A" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Green Meadow Sprout / Grass Blade Animation (Mầm cỏ xanh đung đưa trong gió)
 */
export function GrassSproutAnimation({ size = 48 }: { size?: number }) {
  return (
    <div
      className="inline-flex flex-col items-center select-none group cursor-pointer transition-transform hover:scale-125"
      title="Mầm xanh tăng trưởng Business Connect"
    >
      <svg
        width={size}
        height={size * 1.2}
        viewBox="0 0 50 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="anim-v5-grass-breeze filter drop-shadow-[0_4px_8px_rgba(34,197,94,0.2)]"
      >
        {/* Left blade */}
        <path
          d="M 25,58 Q 12,40 8,18 Q 18,28 24,54"
          fill="url(#grassGrad1)"
          stroke="#15803D"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Center blade */}
        <path
          d="M 25,58 Q 24,30 26,10 Q 30,28 26,56"
          fill="url(#grassGrad2)"
          stroke="#16A34A"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Right blade */}
        <path
          d="M 26,58 Q 38,40 44,20 Q 34,30 27,54"
          fill="url(#grassGrad1)"
          stroke="#15803D"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Small morning dew droplet on the blade */}
        <circle cx="16" cy="24" r="2.2" fill="white" fillOpacity="0.9" />
        <circle cx="36" cy="26" r="2" fill="white" fillOpacity="0.8" />

        <defs>
          <linearGradient id="grassGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="grassGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BBF7D0" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Combined Nature & Wildlife Pin for Section Edges
 */
export function SectionEdgeWildlifePin({
  side = "left",
  type = "crab",
}: {
  side?: "left" | "right";
  type?: "crab" | "flower" | "grass";
}) {
  return (
    <div
      className={`absolute z-20 pointer-events-auto hidden md:flex items-center ${
        side === "left" ? "-left-6 lg:-left-12" : "-right-6 lg:-right-12"
      }`}
    >
      {type === "crab" && <CuteCrabAnimation side={side} size={76} />}
      {type === "flower" && <BloomingFlowerAnimation size={76} />}
      {type === "grass" && <GrassSproutAnimation size={72} />}
    </div>
  );
}

/**
 * Big Interactive Nature Garden for V5 Sticky Hero & Curtain Reveal
 * Featuring large animated crabs, blooming flowers, swaying meadow grass & glistening dew drops
 */
export function V5HeroNatureGarden() {
  return (
    <div className="w-full flex items-end justify-between px-2 sm:px-8 pt-4 pb-2 relative pointer-events-auto select-none">
      {/* Left Garden Cluster (Cua to, hoa nở rộ, cỏ xanh ngát) */}
      <div className="flex items-end gap-1 sm:gap-3">
        <div className="relative transform hover:-translate-y-2 transition-transform duration-300">
          <GrassSproutAnimation size={95} />
          <WaterDroplet3D size={14} top={20} left={8} wobble />
        </div>

        <div className="relative transform hover:-translate-y-3 transition-transform duration-300">
          <BloomingFlowerAnimation size={110} />
          <WaterDroplet3D size={16} top={12} right={6} delay="0.5s" wobble />
        </div>

        <div className="relative transform hover:scale-115 hover:-translate-y-2 transition-all duration-300">
          <CuteCrabAnimation side="left" size={105} />
          <div className="hidden sm:block absolute -top-4 -right-2 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-[10px] font-bold text-orange-700 shadow-xs whitespace-nowrap">
            🦀 ViOne Mascot
          </div>
        </div>

        <div className="hidden md:block relative transform hover:-translate-y-2 transition-transform duration-300">
          <GrassSproutAnimation size={80} />
        </div>
      </div>

      {/* Middle Floating Dew Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-sky-200 text-sky-800 text-xs font-serif font-bold shadow-xs backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Cuộn xuống để mở rộng hệ thống</span>
        <WaterDroplet3D size={12} top={-5} right={10} delay="0.8s" />
      </div>

      {/* Right Garden Cluster (Cây hoa lớn, mầm cỏ đung đưa, chú cua thứ hai) */}
      <div className="flex items-end gap-1 sm:gap-3">
        <div className="hidden md:block relative transform hover:-translate-y-2 transition-transform duration-300">
          <GrassSproutAnimation size={85} />
        </div>

        <div className="relative transform hover:scale-115 hover:-translate-y-2 transition-all duration-300">
          <CuteCrabAnimation side="right" size={96} />
        </div>

        <div className="relative transform hover:-translate-y-3 transition-transform duration-300">
          <BloomingFlowerAnimation size={115} />
          <WaterDroplet3D size={15} top={18} left={10} delay="0.3s" wobble />
        </div>

        <div className="relative transform hover:-translate-y-2 transition-transform duration-300">
          <GrassSproutAnimation size={100} />
          <WaterDroplet3D size={13} top={15} right={8} wobble />
        </div>
      </div>
    </div>
  );
}
