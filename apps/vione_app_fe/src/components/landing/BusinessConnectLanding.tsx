import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { LangSwitcher } from "@/components/LangSwitcher";
import { CyberSecurityShieldHub } from "./CyberSecurityShieldHub";
import { BusinessConnectPartnersSection } from "./BusinessConnectPartnersSection";
import { KineticWords } from "./KineticTypography";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { useAutoHideHeader } from "./useAutoHideHeader";
import { DoorThemeTransition } from "./DoorThemeTransition";
import {
  useLenisSmoothScroll,
  SpatialCustomCursor,
  MagneticButton,
  AppleTVParallaxCard,
  SplitTypeReveal,
} from "./animations/SpatialAppleEffects";
import {
  Sparkles,
  Users2,
  Briefcase,
  Layers,
  CalendarCheck,
  MessagesSquare,
  BookOpen,
  BarChart3,
  Bot,
  PlugZap,
  Building2,
  Users,
  Coins,
  Globe2,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Menu,
  X,
  Moon,
  Sun,
  Contrast,
  Search,
  Clock,
  HeartHandshake,
  Landmark,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Hexagon,
  Crown,
  Smartphone,
  Lock,
  Server,
  Activity,
  Award,
  Disc,
  Target,
  CheckCircle2,
  Handshake,
  UserCheck,
  Radio,
  Send,
  Check,
  Wallet,
  Film,
  Lightbulb,
} from "lucide-react";

export type ThemeMode = "dark" | "light" | "contrast";

/** 3D Page Turn / Theatrical Curtain Unveil Scroll Transition Wrapper from CEO1983 */
/** Cosmic Quantum Portal Section 3D (Đột phá cuộn trang 3D Lật Trang Page-Flip & Origami Dimensional Rift) */
function CosmicQuantumPortalSection({
  children,
  id,
  className = "",
  transitionVariant = "default",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  hudCode?: string;
  hudTitle?: string;
  shape?: "default" | "diagonal" | "chamfer" | "arch" | "vault";
  transitionVariant?: "default" | "slide-left" | "vortex-spiral" | "slide-right" | "quantum-warp" | "curtain-overlap";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Silky Smooth 4D Luxury Interpolation (Ranges widened to prevent sudden twists or jerky jumps)
  // 1. Variant "slide-left": Trượt nhẹ nhàng từ trái với góc nghiêng 4D và chiều sâu thanh lịch
  const slideLeftX = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [-100, 0, 0, 60]);
  const slideLeftRotateY = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [-8, 0, 0, 5]);
  const slideLeftScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.96, 1, 1, 0.97]);
  const slideLeftOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.45, 1, 1, 0.5]);

  // 2. Variant "vortex-spiral": Xoáy 4D bung tỏa mượt mà từ trung tâm vũ trụ B2B
  const vortexScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.88, 1, 1, 0.93]);
  const vortexRotateZ = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [-6, 0, 0, 4]);
  const vortexRotateX = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [8, 0, 0, -5]);
  const vortexOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.45]);

  // 3. Variant "slide-right": Trượt uyển chuyển từ bên phải vào trung tâm
  const slideRightX = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [100, 0, 0, -60]);
  const slideRightRotateY = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [8, 0, 0, -5]);
  const slideRightScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.96, 1, 1, 0.97]);
  const slideRightOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.45, 1, 1, 0.5]);

  // 4. Variant "curtain-overlap": Section đi từ dưới lên đè phủ mượt mà lên section trước đó (Stacking Deck effect)
  const curtainY = useTransform(scrollYProgress, [0, 0.4, 1], [130, 0, 0]);
  const curtainScale = useTransform(scrollYProgress, [0, 0.4, 1], [0.96, 1, 1]);
  const curtainOpacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.6, 1, 1, 0.95]);

  // 5. Variant "quantum-warp": Mở rộng không gian 4D từ chiều sâu lượng tử
  const warpScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.9, 1, 1, 0.94]);
  const warpRotateX = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [10, 0, 0, -6]);
  const warpY = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [60, 0, 0, -40]);
  const warpOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.45, 1, 1, 0.5]);

  // Default: Soft 4D Floating Depth
  const defRotateX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [8, 0, 0, -6]);
  const defRotateY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-5, 0, 0, 3]);
  const defScale = useTransform(scrollYProgress, [0, 0.28, 0.72, 1], [0.95, 1, 1, 0.96]);
  const defY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [60, 0, 0, -40]);
  const defOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.55]);

  // 4D Parallax Background Shift (Tạo chiều sâu đa tầng 4D chân thực)
  const bgParallaxY = useTransform(scrollYProgress, [0, 1], [-35, 35]);
  const horizonLaserOpacity = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 0.8, 1, 0.5, 0]);

  const dynamicMotionStyle =
    transitionVariant === "slide-left"
      ? { x: slideLeftX, rotateY: slideLeftRotateY, scale: slideLeftScale, opacity: slideLeftOpacity }
      : transitionVariant === "vortex-spiral"
      ? { scale: vortexScale, rotateZ: vortexRotateZ, rotateX: vortexRotateX, opacity: vortexOpacity }
      : transitionVariant === "slide-right"
      ? { x: slideRightX, rotateY: slideRightRotateY, scale: slideRightScale, opacity: slideRightOpacity }
      : transitionVariant === "curtain-overlap"
      ? { y: curtainY, scale: curtainScale, opacity: curtainOpacity }
      : transitionVariant === "quantum-warp"
      ? { scale: warpScale, rotateX: warpRotateX, y: warpY, opacity: warpOpacity }
      : { rotateX: defRotateX, rotateY: defRotateY, scale: defScale, y: defY, opacity: defOpacity };

  const isCurtain = transitionVariant === "curtain-overlap";

  return (
    <div
      ref={ref}
      id={id}
      style={{ perspective: "2200px", perspectiveOrigin: "50% 50%" }}
      className={`relative w-full transform-gpu ${isCurtain ? "z-30 shadow-[0_-25px_60px_rgba(0,0,0,0.65)]" : "z-10"} ${className}`}
    >
      {/* 4D Floating Parallax Aura */}
      <motion.div
        style={{ y: bgParallaxY }}
        className="absolute inset-0 pointer-events-none z-0"
      />

      <motion.div
        style={{
          ...dynamicMotionStyle,
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
        }}
        className="w-full h-full will-change-transform relative transition-shadow duration-500"
      >
        {/* Subtle Specular Ambient Laser Line */}
        <motion.div
          style={{ opacity: horizonLaserOpacity }}
          className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F6E1C3] to-transparent pointer-events-none z-40 shadow-[0_0_20px_rgba(246,225,195,0.7)]"
        />

        {children}
      </motion.div>
    </div>
  );
}

// Backward-compatible alias
const SectionFlip3D = CosmicQuantumPortalSection;

const SECTION_SCENERY_MAP: Record<
  "hero" | "challenges" | "solutions" | "ecosystem" | "security" | "testimonials" | "cta",
  { dark: string; light: string; contrast: string }
> = {
  hero: {
    dark: "/landing/smart_city_40_skyline.jpg", // Đô thị đại hội ngắm đêm lung linh
    light: "/landing/ceo1983-hero-light.jpg", // Tòa nhà chọc trời và bầu trời sáng rực rỡ ở trên (Background nguyên bản)
    contrast: "/landing/robot_cosmic_reach.jpg", // Robot vươn tới thiên văn vũ trụ
  },
  challenges: {
    dark: "/landing/smart_city_towers_growth.jpg", // Tháp đô thị tài chính về đêm
    light: "/landing/business_connect_light_hq.jpg",
    contrast: "/landing/robot_pyramid_cosmic.jpg", // Robot & kim tự tháp vũ trụ
  },
  solutions: {
    dark: "/landing/smart_city_40_skyline.jpg", // Mạng lưới đại đô thị về đêm
    light: "/landing/sunny_breeze_innovation_hub.jpg", // Khu đổi mới sinh thái đài phun nước, cây xanh, trời trong nắng vàng mát mẻ
    contrast: "/landing/robot_pyramid_3d_cyber.jpg", // Hub robot công nghệ không gian
  },
  ecosystem: {
    dark: "/landing/minimal_tower_dark.jpg", // Đô thị tháp đêm huyền ảo
    light: "/landing/sunny_green_campus_lake.jpg", // Khuôn viên sinh thái công nghệ bên hồ xanh biếc, đảo cây xanh, trời xanh mây trắng nắng vàng
    contrast: "/landing/cosmic_b2b_neural_space.jpg", // Không gian thiên văn vũ trụ robot neural
  },
  security: {
    dark: "/landing/smart_city_towers_growth.jpg",
    light: "/landing/business_connect_light_hq.jpg",
    contrast: "/landing/robot_pyramid_3d_cyber.jpg",
  },
  testimonials: {
    dark: "/landing/skyline_united_hands.jpg", // Đường chân trời thành phố về đêm
    light: "/landing/sunny_skyline_penthouse.jpg", // Penthouse cao cấp nhìn toàn cảnh đại đô thị trời xanh mây trắng
    contrast: "/landing/robot_cosmic_reach.jpg",
  },
  cta: {
    dark: "/landing/smart_city_40_skyline.jpg",
    light: "/landing/sunny_panoramic_horizon_dawn.jpg", // Toàn cảnh đường chân trời đại đô thị ngập tràn nắng vàng ban mai bên vịnh biển xanh mát
    contrast: "/landing/robot_pyramid_cosmic.jpg",
  },
};

/** High-Resolution Scenery Atmosphere Engine with 4K Landscape Imagery for Each Theme */
function SectionAtmosphereBackground({
  themeMode,
  sectionId,
  splitSide,
  splitRatio,
}: {
  themeMode: "dark" | "light" | "contrast";
  sectionId: "hero" | "challenges" | "solutions" | "ecosystem" | "security" | "testimonials" | "cta";
  splitSide?: "left" | "right";
  splitRatio?: "1/2" | "2/3";
}) {
  const scenery = SECTION_SCENERY_MAP[sectionId] || SECTION_SCENERY_MAP.solutions;
  const currentScenerySrc =
    themeMode === "light"
      ? scenery.light
      : themeMode === "contrast"
      ? scenery.contrast
      : scenery.dark;

  const isDarkNightCity = themeMode === "dark";
  const isContrastRobot = themeMode === "contrast";

  // Alternating 1/2 or 2/3 split cut configuration per section
  // In Dark theme ("thành phố về đêm"): layout & aspect ratio are flipped/altered compared to Light theme
  const effectiveSide: "left" | "right" =
    splitSide ??
    (isDarkNightCity
      ? (sectionId === "hero" || sectionId === "ecosystem" ? "right" : "left")
      : (sectionId === "hero" || sectionId === "ecosystem" ? "left" : "right"));

  const effectiveRatio: "1/2" | "2/3" =
    splitRatio ??
    (isDarkNightCity
      ? (sectionId === "hero" || sectionId === "testimonials" ? "2/3" : "1/2")
      : (sectionId === "hero" || sectionId === "testimonials" ? "1/2" : "2/3"));

  const clipId = `v1SectionClip_${sectionId}`;
  const gradId = `v1SectionGoldGrad_${sectionId}`;

  // SVG clip path coordinates
  const clipPathD =
    effectiveSide === "right"
      ? effectiveRatio === "2/3"
        ? "M 0.35,0 C 0.48,0.25 0.52,0.50 0.38,0.75 C 0.30,0.88 0.25,0.95 0.20,1.0 L 1,1 L 1,0 Z"
        : "M 0.50,0 C 0.62,0.25 0.65,0.50 0.52,0.75 C 0.45,0.88 0.42,0.95 0.38,1.0 L 1,1 L 1,0 Z"
      : effectiveRatio === "2/3"
      ? "M 0,0 L 0.65,0 C 0.52,0.25 0.48,0.50 0.62,0.75 C 0.70,0.88 0.75,0.95 0.80,1.0 L 0,1 Z"
      : "M 0,0 L 0.50,0 C 0.38,0.25 0.35,0.50 0.48,0.75 C 0.55,0.88 0.58,0.95 0.62,1.0 L 0,1 Z";

  // Corresponding boundary wave line path (viewBox: 0 0 1440 1000)
  const waveLineD =
    effectiveSide === "right"
      ? effectiveRatio === "2/3"
        ? "M 504,0 C 691,250 748,500 547,750 C 432,880 360,950 288,1000"
        : "M 720,0 C 892,250 936,500 748,750 C 648,880 604,950 547,1000"
      : effectiveRatio === "2/3"
      ? "M 936,0 C 748,250 691,500 892,750 C 1008,880 1080,950 1152,1000"
      : "M 720,0 C 547,250 504,500 691,750 C 792,880 835,950 892,1000";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* ClipPath Definition */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clipPathD} />
          </clipPath>
        </defs>
      </svg>

      {/* 1. Crystal-Clear Scenery Image clipped to 1/2 or 2/3 */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <img
          src={currentScenerySrc}
          alt={`ViOne ${sectionId} scenery background`}
          className={`w-full h-full object-cover transition-all duration-700 transform-gpu ${
            isDarkNightCity
              ? "object-bottom scale-110 opacity-85 filter brightness-100 contrast-120 drop-shadow-[0_0_35px_rgba(216,178,130,0.25)]"
              : isContrastRobot
              ? "object-center scale-105 opacity-90 filter brightness-110 contrast-125"
              : `${effectiveSide === "right" ? "object-right-top" : "object-left-top"} scale-105 opacity-90 filter brightness-105 contrast-105`
          }`}
        />

        {/* Soft Vignette Overlay along the cut edge to seamlessly transition into clean background */}
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            effectiveSide === "right"
              ? themeMode === "light"
                ? "bg-gradient-to-l from-transparent via-[#FAF8F5]/30 to-[#FAF8F5]/85"
                : themeMode === "contrast"
                ? "bg-gradient-to-l from-transparent via-black/40 to-black/90"
                : "bg-gradient-to-l from-transparent via-[#02040A]/40 to-[#02040A]/95"
              : themeMode === "light"
              ? "bg-gradient-to-r from-transparent via-[#FAF8F5]/30 to-[#FAF8F5]/85"
              : themeMode === "contrast"
              ? "bg-gradient-to-r from-transparent via-black/40 to-black/90"
              : "bg-gradient-to-r from-transparent via-[#02040A]/40 to-[#02040A]/95"
          }`}
        />
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            themeMode === "light"
              ? "bg-gradient-to-b from-[#FAF8F5]/50 via-transparent to-[#FAF8F5]/75"
              : themeMode === "contrast"
              ? "bg-gradient-to-b from-black/50 via-transparent to-black/75"
              : "bg-gradient-to-b from-[#02040A]/50 via-transparent to-[#02040A]/75"
          }`}
        />
        {isDarkNightCity && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-transparent to-amber-500/10 pointer-events-none mix-blend-screen" />
        )}
        {isContrastRobot && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
        )}
      </div>

      {/* Decorative Champagne Gold Wave Boundary Stroke */}
      <svg
        viewBox="0 0 1440 1000"
        fill="none"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <path
          d={waveLineD}
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="opacity-75 drop-shadow-[0_0_10px_rgba(216,178,130,0.6)]"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#D8B282" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#C29B69" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8C653B" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* 2. 3D Perspective Hologram Floor Grid (Không gian chiều sâu AI Vector) */}
      <div
        className="absolute inset-x-0 bottom-0 h-[50%] opacity-20 pointer-events-none"
        style={{
          perspective: "600px",
          transformOrigin: "center bottom",
        }}
      >
        <div
          className="w-full h-full"
          style={{
            transform: "rotateX(65deg) translateZ(0)",
            backgroundImage:
              themeMode === "light"
                ? "linear-gradient(to right, rgba(216,178,130,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,178,130,0.35) 1px, transparent 1px)"
                : "linear-gradient(to right, rgba(216,178,130,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,178,130,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 85%)",
          }}
        />
      </div>

      {/* 3. Section-Specific Procedural AI Synapse & Matrix Graphics */}
      {sectionId === "challenges" ? (
        /* CHALLENGES: ANOMALY DETECTION MATRIX & HOLOGRAPHIC DIAGNOSTIC GRID */
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="anomalyGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#D97706" stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#anomalyGlow)" />
          {/* Cyber Anomaly Circuit Lines */}
          <path d="M 100,120 L 350,120 L 450,220 L 900,220 L 1050,140 L 1400,140" stroke="#D8B282" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
          <path d="M 0,280 L 250,280 L 380,380 L 800,380 L 950,280 L 1440,280" stroke="#F6E1C3" strokeWidth="1" strokeOpacity="0.25" fill="none" />
          {/* Diagnostic Sensor Crosshairs */}
          {[
            { x: 350, y: 120 },
            { x: 450, y: 220 },
            { x: 900, y: 220 },
            { x: 1050, y: 140 },
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r="3" fill="#F6E1C3" className="animate-ping" style={{ animationDuration: `${2 + i * 0.5}s` }} />
              <circle cx={pt.x} cy={pt.y} r="6" stroke="#D8B282" strokeWidth="1" fill="none" />
            </g>
          ))}
        </svg>
      ) : sectionId === "solutions" ? (
        /* SOLUTIONS: 3D CYBER REACTOR SINGULARITY & ORBITAL ACCELERATOR */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Pulsing Quantum Singularity Aura */}
          <div className="w-[850px] h-[500px] rounded-full bg-gradient-to-r from-amber-500/10 via-[#F6E1C3]/15 to-transparent blur-3xl animate-pulse" />
          {/* Holographic Radar Concentric Laser Rings */}
          <div className="absolute w-[600px] h-[600px] rounded-full border border-[#D8B282]/20 animate-spin" style={{ animationDuration: "60s" }} />
          <div className="absolute w-[800px] h-[800px] rounded-full border border-[#D8B282]/15 animate-spin" style={{ animationDuration: "90s", animationDirection: "reverse" }} />
        </div>
      ) : sectionId === "ecosystem" ? (
        /* ECOSYSTEM: NEURAL CONSTELLATION MESH */
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          {/* Synaptic Arcs */}
          <path d="M 200,150 Q 500,80 720,200 T 1250,180" stroke="#D8B282" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
          <path d="M 150,350 Q 420,420 720,300 T 1300,380" stroke="#F6E1C3" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
          <path d="M 400,200 L 720,250 L 1050,220" stroke="#D8B282" strokeWidth="1" strokeOpacity="0.25" fill="none" />
          {/* Constellation Nodes */}
          {[
            { cx: 200, cy: 150 },
            { cx: 500, cy: 80 },
            { cx: 720, cy: 200 },
            { cx: 1250, cy: 180 },
            { cx: 420, cy: 420 },
            { cx: 1050, cy: 220 },
          ].map((pt, i) => (
            <circle key={i} cx={pt.cx} cy={pt.cy} r="3" fill="#F6E1C3" className="animate-pulse" style={{ animationDuration: `${2.5 + i * 0.4}s` }} />
          ))}
        </svg>
      ) : sectionId === "security" ? (
        /* SECURITY: QUANTUM CIPHER AEGIS GRID */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/5 via-amber-500/10 to-blue-500/5 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(216,178,130,0.18)_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-45" />
        </div>
      ) : sectionId === "testimonials" ? (
        /* TESTIMONIALS: PRISMATIC REFRACTION CAUSTIC FIELD */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[450px] bg-gradient-to-r from-[#D8B282]/10 via-[#F6E1C3]/15 to-[#8C653B]/10 blur-3xl opacity-60" />
        </div>
      ) : (
        /* CTA: KINETIC ENERGY REACTOR */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[900px] h-[550px] rounded-full bg-gradient-to-b from-amber-400/15 via-[#F6E1C3]/20 to-transparent blur-3xl animate-pulse" />
        </div>
      )}

      {/* 4. Fine-grain Cyber Matrix Micro-Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(216,178,130,0.14)_1px,transparent_1px)] [background-size:36px_36px] opacity-50 pointer-events-none" />

      {/* 5. Top Specular Ambient Lighting Flare */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#F6E1C3]/20 via-[#D8B282]/5 to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}

/** Dynamic Organic Volumetric Liquid Curved Divider (Tuyệt đối không dùng nét đứt, dòng chảy lỏng liên tục chuẩn cao cấp) */
function OrganicCurvedDivider({
  reverse = false,
  variant = "wave",
}: {
  reverse?: boolean;
  variant?: "wave" | "flow" | "crest";
}) {
  return (
    <div className={`w-full overflow-hidden leading-none relative z-20 pointer-events-none -my-6 sm:-my-10 ${reverse ? "rotate-180" : ""}`}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-16 sm:h-24 md:h-28 transform-gpu"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`organicLaser-${reverse ? "rev" : "fwd"}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#004b91" stopOpacity="0.2" />
            <stop offset="25%" stopColor="#D8B282" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F6E1C3" stopOpacity="1" />
            <stop offset="75%" stopColor="#D8B282" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#004b91" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`organicSecondary-${reverse ? "rev" : "fwd"}`} x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8C653B" stopOpacity="0.3" />
            <stop offset="35%" stopColor="#D8B282" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#FFF5E6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#004b91" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`organicFill-${reverse ? "rev" : "fwd"}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#D8B282" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#004b91" stopOpacity="0.05" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dynamic Curved Volumetric Liquid Caustic Fill */}
        <path
          d={
            variant === "flow"
              ? "M0,35 C320,105 640,-10 960,65 C1200,115 1360,25 1440,45 L1440,120 L0,120 Z"
              : variant === "crest"
              ? "M0,20 C360,95 720,-5 1080,75 C1260,115 1380,35 1440,50 L1440,120 L0,120 Z"
              : "M0,45 C280,115 560,10 840,75 C1120,125 1320,35 1440,55 L1440,120 L0,120 Z"
          }
          fill={`url(#organicFill-${reverse ? "rev" : "fwd"})`}
        />

        {/* Primary Glowing Continuous Volumetric Wave Stream (Solid, No Dash) */}
        <path
          d={
            variant === "flow"
              ? "M0,35 C320,105 640,-10 960,65 C1200,115 1360,25 1440,45"
              : variant === "crest"
              ? "M0,20 C360,95 720,-5 1080,75 C1260,115 1380,35 1440,50"
              : "M0,45 C280,115 560,10 840,75 C1120,125 1320,35 1440,55"
          }
          stroke={`url(#organicLaser-${reverse ? "rev" : "fwd"})`}
          strokeWidth="3.5"
          strokeLinecap="round"
          className="animate-laser-flow"
          style={{ filter: "drop-shadow(0 0 12px rgba(246,225,195,0.9))" }}
        />

        {/* Secondary Continuous Liquid Stream (Solid, No Dash!) */}
        <path
          d={
            variant === "flow"
              ? "M0,50 C360,-5 720,115 1080,45 C1260,5 1380,55 1440,40"
              : variant === "crest"
              ? "M0,38 C380,110 740,10 1100,85 C1280,125 1400,45 1440,60"
              : "M0,60 C360,5 720,125 1080,55 C1260,15 1380,65 1440,50"
          }
          stroke={`url(#organicSecondary-${reverse ? "rev" : "fwd"})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.85"
          className="animate-laser-flow-reverse"
          style={{ filter: "drop-shadow(0 0 8px rgba(216,178,130,0.6))" }}
        />

        {/* Radiant Liquid Droplets */}
        <circle cx="360" cy="55" r="3.5" fill="#F6E1C3" className="animate-ping" style={{ animationDuration: "3s" }} />
        <circle cx="960" cy="65" r="4" fill="#FFFFFF" className="animate-pulse" />
        <circle cx="1200" cy="100" r="3" fill="#D8B282" className="animate-ping" style={{ animationDuration: "2.5s" }} />
      </svg>
    </div>
  );
}

function LaserStreamDivider() {
  return <OrganicCurvedDivider variant="wave" />;
}

// 9 Enterprise SaaS Solutions Data (Không dùng từ hành tinh, phân bổ đều 40 độ tuyệt đối, không dồn node)
const ENTERPRISE_MODULES = [
  {
    id: "m1",
    num: "01",
    name: "Quản Lý Hội Viên & Tổ Chức",
    moduleName: "PHÂN HỆ HỘI VIÊN & TỔ CHỨC",
    tagline: "HỒ SƠ 360° • PHÂN NHÓM TỰ ĐỘNG",
    desc: "Số hóa 100% hồ sơ hội viên và doanh nghiệp thành viên, phân quyền đa cấp bậc, tự động hóa kỳ gia hạn và cấp thẻ định danh.",
    metric: "100% SỐ HÓA",
    highlight: "#A5F3FC",
    base: "#0284C7",
    shadow: "#0C4A6E",
    glow: "rgba(14, 165, 233, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 0,
    speedMultiplier: 1.0,
    icon: Users2,
    features: ["Định danh số hội viên & ban lãnh đạo", "Tự động phân nhóm ngành nghề & quy mô", "Nhắc nhở gia hạn & cấp chứng nhận số"],
  },
  {
    id: "m2",
    num: "02",
    name: "CRM & Quản Trị Mối Quan Hệ",
    moduleName: "PHÂN HỆ CRM & QUAN HỆ B2B",
    tagline: "LỊCH SỬ GIAO THƯƠNG • ĐIỂM GẮN KẾT",
    desc: "Theo dõi toàn diện lịch sử gặp gỡ, ghi chú cuộc họp, chấm điểm gắn kết đối tác và gợi ý thời điểm vàng tiếp cận thương vụ.",
    metric: "x3 HIỆU SUẤT",
    highlight: "#FED7AA",
    base: "#EA580C",
    shadow: "#7C2D12",
    glow: "rgba(234, 88, 12, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 40,
    speedMultiplier: 1.0,
    icon: HeartHandshake,
    features: ["Nhật ký tương tác đa kênh thời gian thực", "Chấm điểm mức độ tin cậy và gắn kết", "Gợi ý thời điểm vàng tiếp cận hợp tác"],
  },
  {
    id: "m3",
    num: "03",
    name: "Sàn Giao Thương & Deal Flow",
    moduleName: "PHÂN HỆ GIAO THƯƠNG & DEAL ROOM",
    tagline: "SÀN DEAL FLOW B2B • GHÉP CUNG CẦU",
    desc: "Sàn giao thương nội khối bảo mật cao, thuật toán AI khớp nhu cầu cung - cầu tự động theo chuỗi giá trị khép kín nghìn tỷ.",
    metric: "98% MATCH FIT",
    highlight: "#BAE6FD",
    base: "#0284C7",
    shadow: "#0369A1",
    glow: "rgba(2, 132, 199, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 80,
    speedMultiplier: 1.0,
    icon: Target,
    features: ["Sàn giao thương nội khối bảo mật", "Thuật toán AI ghép đôi cung - cầu chuẩn xác", "Theo dõi tiến độ chốt deal & đẩy về CRM"],
  },
  {
    id: "m4",
    num: "04",
    name: "Quản Trị Sự Kiện & Check-in NFC",
    moduleName: "PHÂN HỆ SỰ KIỆN & CHECK-IN NFC",
    tagline: "CHECK-IN 1 GIÂY • XẾP BÀN VIP",
    desc: "Quản lý sự kiện quy mô lớn, check-in NFC/QR siêu tốc dưới 1 giây, điều phối chỗ ngồi bàn VIP và đo lường ROI tương tác.",
    metric: "<1s CHECK-IN",
    highlight: "#FECDD3",
    base: "#E11D48",
    shadow: "#881337",
    glow: "rgba(225, 29, 72, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 120,
    speedMultiplier: 1.0,
    icon: CalendarCheck,
    features: ["Check-in QR & NFC siêu tốc dưới 1s", "Điều phối bàn VIP & đón tiếp lễ tân số", "Báo cáo tương tác và chuyển đổi B2B"],
  },
  {
    id: "m5",
    num: "05",
    name: "Cộng Đồng Liên Minh & CLB",
    moduleName: "PHÂN HỆ CỘNG ĐỒNG LIÊN MINH",
    tagline: "KẾT NỐI ĐA TẦNG • ĐIỀU HÀNH BẢO MẬT",
    desc: "Không gian kết nối khép kín cho hơn 300 câu lạc bộ và hiệp hội, chia sẻ cơ hội độc quyền, trao đổi bảo mật đa tầng.",
    metric: "300+ TỔ CHỨC",
    highlight: "#FEF08A",
    base: "#CA8A04",
    shadow: "#713F12",
    glow: "rgba(202, 138, 4, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 160,
    speedMultiplier: 1.0,
    icon: Users,
    features: ["CLB chuyên ngành & địa phương đa cấp", "Kênh thảo luận kín bảo mật chuẩn Enterprise", "Phân quyền quản trị ban chấp hành"],
  },
  {
    id: "m6",
    num: "06",
    name: "Tri Thức & Cố Vấn Chuyên Gia",
    moduleName: "PHÂN HỆ TRI THỨC & CỐ VẤN",
    tagline: "CẨM NĂNG THỰC CHIẾN • CASE STUDY",
    desc: "Thư viện tri thức quản trị doanh nghiệp độc quyền, ngân hàng biểu mẫu chuẩn mực và kết nối hội đồng cố vấn C-Level.",
    metric: "1.000+ TÀI LIỆU",
    highlight: "#FDE68A",
    base: "#D97706",
    shadow: "#78350F",
    glow: "rgba(217, 119, 6, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 200,
    speedMultiplier: 1.0,
    icon: BookOpen,
    features: ["Thư viện tri thức điều hành độc quyền", "Khóa đào tạo chuyên sâu & hội thảo số", "Case study giải quyết khủng hoảng SME"],
  },
  {
    id: "m7",
    num: "07",
    name: "Báo Cáo Dashboard & ROI",
    moduleName: "PHÂN HỆ DASHBOARD & PHÂN TÍCH ROI",
    tagline: "ĐO LƯỜNG THỰC CHẤT • ĐỊNH LƯỢNG GIÁ TRỊ",
    desc: "Hệ thống Dashboard thời gian thực đo lường hiệu quả kết nối, thống kê chính xác giá trị thương vụ giao dịch phát sinh.",
    metric: "REAL-TIME ROI",
    highlight: "#A7F3D0",
    base: "#059669",
    shadow: "#064E3B",
    glow: "rgba(5, 150, 105, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 240,
    speedMultiplier: 1.0,
    icon: BarChart3,
    features: ["Dashboard thời gian thực trực quan", "Thống kê tổng giá trị giao dịch B2B", "Báo cáo phân tích dòng tiền và hội viên"],
  },
  {
    id: "m8",
    num: "08",
    name: "AI Copilot & Matchmaking",
    moduleName: "PHÂN HỆ TRÍ TUỆ NHÂN TẠO COPILOT",
    tagline: "TRUY VẤN TỰ NHIÊN • GỢI Ý DEAL",
    desc: "Trợ lý AI phân tích năng lực đối tác bằng ngôn ngữ tự nhiên, gợi ý mở lời tiếp cận và tự động phát hiện cơ hội giao thương vàng.",
    metric: "<0.5s PHẢN HỒI",
    highlight: "#DDD6FE",
    base: "#7C3AED",
    shadow: "#4C1D95",
    glow: "rgba(124, 58, 237, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 280,
    speedMultiplier: 1.0,
    icon: Bot,
    features: ["Hỏi đáp hồ sơ bằng ngôn ngữ tự nhiên", "Phân tích phần trăm độ tương thích đối tác", "Tự động soạn kịch bản mở lời tiếp cận"],
  },
  {
    id: "m9",
    num: "09",
    name: "Tài Chính & Thu Chi Hiệp Hội",
    moduleName: "PHÂN HỆ TÀI CHÍNH & SỔ QUỸ MINH BẠCH",
    tagline: "THU CHI TỰ ĐỘNG • TẠM ỨNG & HOÀN ỨNG",
    desc: "Quản lý nguồn quỹ minh bạch, phân tách rành mạch tiền mặt và chuyển khoản, hỗ trợ tạm ứng hoàn ứng và tải phiếu thu chi tức thì.",
    metric: "100% MINH BẠCH",
    highlight: "#FBCFE8",
    base: "#DB2777",
    shadow: "#831843",
    glow: "rgba(219, 39, 119, 0.7)",
    rx: 340,
    ry: 155,
    baseAngle: 320,
    speedMultiplier: 1.0,
    icon: Coins,
    features: ["Quản lý phân hệ Thu - Chi tách bạch", "Kiểm soát tạm ứng & hoàn ứng chuẩn xác", "Xuất phiếu thu/chi và hóa đơn chuẩn in ấn"],
  },
];

const PLANET_SOLUTIONS = ENTERPRISE_MODULES; // Alias for full backward compatibility

// 5 Challenges for AI Quantum Diagnostic Probes / Bottleneck Scanners
const HANGING_CHALLENGES = [
  {
    id: "c1",
    num: "01",
    title: "Dữ liệu phân tán, thiếu tập trung",
    desc: "Dữ liệu hội viên lưu rời rạc trên nhiều file excel, khó tra cứu đúng người khi phát sinh nhu cầu giao thương.",
    badge: "PHÂN MẢNH",
    icon: Search,
    swayDuration: "4.8s",
    swayDelay: "0s",
    sensorCode: "SENSOR_01",
    metricName: "FRICTION_RATE",
    metricValue: "84%",
    diagnosticStatus: "CRITICAL_SILO",
  },
  {
    id: "c2",
    num: "02",
    title: "Tương tác nhạt nhòa sau sự kiện",
    desc: "Thiếu công cụ nhắc nhở và nhật ký theo dõi tương tác, khiến mối quan hệ với đối tác tiềm năng dần phai nhạt.",
    badge: "LÃNG PHÍ",
    icon: Clock,
    swayDuration: "5.4s",
    swayDelay: "0.4s",
    sensorCode: "SENSOR_02",
    metricName: "CHURN_RISK",
    metricValue: "76%",
    diagnosticStatus: "ENGAGEMENT_LOSS",
  },
  {
    id: "c3",
    num: "03",
    title: "Khó nắm bắt nhu cầu mua bán B2B",
    desc: "Không kịp thời nắm bắt nhu cầu mua - bán từ hội viên khác do thiếu cơ chế ghép nối cơ hội tự động.",
    badge: "CHẬM TRỄ",
    icon: HeartHandshake,
    swayDuration: "5.1s",
    swayDelay: "0.8s",
    sensorCode: "SENSOR_03",
    metricName: "MATCH_LATENCY",
    metricValue: "92%",
    diagnosticStatus: "OPPORTUNITY_MISSED",
  },
  {
    id: "c4",
    num: "04",
    title: "Hiệu quả kết nối chưa thành hợp đồng",
    desc: "Nhiều sự kiện gặp mặt giao lưu nhưng khó chuyển hóa thành hợp đồng kinh tế và doanh thu cụ thể sau sự kiện.",
    badge: "HÌNH THỨC",
    icon: Landmark,
    swayDuration: "4.6s",
    swayDelay: "1.2s",
    sensorCode: "SENSOR_04",
    metricName: "CONVERSION_DROP",
    metricValue: "88%",
    diagnosticStatus: "DEAL_STAGNATION",
  },
  {
    id: "c5",
    num: "05",
    title: "Thiếu số liệu đo lường ROI mạng lưới",
    desc: "Ban điều hành không có số liệu chứng minh giá trị và lợi nhuận thực tế mà hoạt động hiệp hội mang lại cho hội viên.",
    badge: "MƠ HỒ",
    icon: EyeOff,
    swayDuration: "5.7s",
    swayDelay: "0.2s",
    sensorCode: "SENSOR_05",
    metricName: "TELEMETRY_GAP",
    metricValue: "95%",
    diagnosticStatus: "ROI_BLINDSPOT",
  },
];

// Video KYC Demo Chapters
const KYC_CHAPTERS = [
  {
    id: "ch1",
    num: "01",
    title: "Tổng quan kiến trúc & Profile 360°",
    time: "02:30",
    desc: "Khám phá cách Business Connect chuẩn hóa hồ sơ doanh nghiệp, phân quyền nhiều lớp và tích hợp danh bạ.",
  },
  {
    id: "ch2",
    num: "02",
    title: "AI Matchmaking & Sàn Giao Thương B2B",
    time: "03:15",
    desc: "Demo thuật toán AI tự động quét nhu cầu cung - cầu, ghép đôi cơ hội và gửi thông báo deal nóng.",
  },
  {
    id: "ch3",
    num: "03",
    title: "Check-in NFC & Quản lý Sự kiện 1 chạm",
    time: "04:10",
    desc: "Trải nghiệm thẻ Titanium NFC, quét QR động và đo lường báo cáo ROI tương tác tức thì.",
  },
];

// 8 Orbiting Satellites for Section 4 (Matching CEO1983)
const CONSTELLATION_SATELLITES = [
  { id: "hiep-hoi", name: "Hiệp hội", icon: Users, desc: "Hợp tác sâu rộng với hơn 300+ Hiệp hội Doanh nghiệp toàn quốc", angle: 160 },
  { id: "doanh-nhan", name: "Doanh nhân", icon: UserCheck, desc: "Mạng lưới hơn 10.000+ Chủ tịch & CEO điều hành thực chiến", angle: 195 },
  { id: "doanh-nghiep", name: "Doanh nghiệp", icon: Building2, desc: "Liên kết chuỗi cung ứng khép kín, tối ưu hóa dòng tiền và doanh thu", angle: 230 },
  { id: "chuyen-gia", name: "Chuyên gia", icon: Award, desc: "Hội đồng cố vấn chiến lược tài chính, pháp lý và chuyển đổi số", angle: 265 },
  { id: "nha-dau-tu", name: "Nhà đầu tư", icon: Coins, desc: "Quỹ đầu tư mạo hiểm, quỹ thiên thần và cơ hội đầu tư B2B giá trị", angle: 20 },
  { id: "co-quan-quan-ly", name: "Cơ quan quản lý", icon: ShieldCheck, desc: "Cập nhật chính sách kinh tế và hỗ trợ pháp lý doanh nghiệp chuẩn mực", angle: 335 },
  { id: "to-chuc-quoc-te", name: "Tổ chức quốc tế", icon: Globe2, desc: "Xúc tiến thương mại song phương và xuất khẩu ra thị trường toàn cầu", angle: 300 },
  { id: "doi-tac-chien-luoc", name: "Đối tác chiến lược", icon: Handshake, desc: "Tập đoàn công nghệ, ngân hàng và đơn vị cung cấp hạ tầng tiên tiến", angle: 270 },
];

// Success stories & testimonials (3 Avatars like CEO 1983)
const TESTIMONIALS = [
  {
    id: "t1",
    author: "Ông Trần Nam Long",
    title: "Chủ tịch Hiệp hội Doanh nghiệp Trẻ",
    role: "Chủ tịch Hiệp hội Doanh nghiệp Trẻ",
    company: "Tập Đoàn Đầu Tư & Công Nghệ Việt An",
    badge: "HANOIBA BẢO CHỨNG • 1.200 HỘI VIÊN",
    quote: "Business Connect đã giúp hiệp hội chúng tôi quản lý hơn 1.200 hội viên hoàn toàn tự động, tăng 45% tỷ lệ giao thương nội bộ ngay trong quý đầu tiên.",
    stats: "+45% Doanh số B2B nội khối",
    metric: ">120 TỶ GIAO THƯƠNG",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    highlight: "Đầu tàu xúc tiến giao thương B2B",
  },
  {
    id: "t2",
    author: "Bà Nguyễn Mai Phương",
    title: "Phó Tổng Giám Đốc Tập Đoàn AIC",
    role: "Phó Tổng Giám Đốc Tập Đoàn AIC",
    company: "Tập Đoàn Công Nghiệp AIC Group (Top 500 VNR)",
    badge: "DOANH NHÂN TIÊN PHONG • C-LEVEL VERIFIED",
    quote: "Thẻ Titanium NFC kết hợp sàn giao thương AI giúp đội ngũ mở rộng đối tác chiến lược chỉ sau một lần chạm tại các hội nghị xúc tiến quốc tế.",
    stats: "300+ Đối tác kết nối mới",
    metric: "300+ HỢP ĐỒNG B2B",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    highlight: "Mạng lưới cung ứng đa quốc gia",
  },
  {
    id: "t3",
    author: "Ông Lê Hoàng Vũ",
    title: "Sáng Lập & CEO Chuỗi Công Nghệ VTech",
    role: "Sáng Lập & CEO Chuỗi Công Nghệ VTech",
    company: "Tập Đoàn Tài Chính & Công Nghệ Số FTG",
    badge: "CHUYỂN ĐỔI SỐ XUẤT SẮC • ALLIANCE 1983",
    quote: "Tính năng AI Copilot hỗ trợ tìm kiếm nhà cung cấp chuẩn xác tới từng nhu cầu kỹ thuật. Một giải pháp không thể thiếu cho các hiệp hội thời kỳ số hóa.",
    stats: "Tiết kiệm 85% chi phí vận hành",
    metric: "85% TỐI ƯU VẬN HÀNH",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    highlight: "Số hóa điều hành ban bệ toàn diện",
  },
];


export function BusinessConnectLanding() {
  useLenisSmoothScroll();
  const { lang } = useLang();
  // Full 3-Theme Switcher Support (Light / Dark Night-City / High-Contrast Cosmic Robot)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vione_bc_theme");
      if (saved === "dark" || saved === "contrast" || saved === "light") {
        return saved;
      }
    }
    return "light";
  });

  const [isDoorOpen, setIsDoorOpen] = useState(true);

  const handleSetTheme = (mode: ThemeMode) => {
    if (mode === themeMode) return;
    setIsDoorOpen(false);
    setTimeout(() => {
      setThemeMode(mode);
      if (typeof window !== "undefined") {
        localStorage.setItem("vione_bc_theme", mode);
      }
    }, 600);
    setTimeout(() => {
      setIsDoorOpen(true);
    }, 1200);
  };
  const { showHeader, headerStyle, resetTimer } = useAutoHideHeader(3000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // EXACTLY 2 SLIDES IN HERO SECTION
  const [heroSlide, setHeroSlide] = useState(0); // 0: Titanium NFC Card Showcase, 1: Video KYC Demo
  const [slideDirection, setSlideDirection] = useState(1);
  const [isSlidePaused, setIsSlidePaused] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  // Video KYC Player State & Refs
  const [selectedKycChapter, setSelectedKycChapter] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const kycVideoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const toggleVideoPlay = () => {
    if (kycVideoRef.current) {
      if (kycVideoRef.current.paused) {
        kycVideoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      } else {
        kycVideoRef.current.pause();
        setIsVideoPlaying(false);
      }
    } else {
      setIsVideoPlaying((prev) => !prev);
    }
  };

  const toggleVideoMute = () => {
    if (kycVideoRef.current) {
      kycVideoRef.current.muted = !kycVideoRef.current.muted;
      setIsVideoMuted(kycVideoRef.current.muted);
    } else {
      setIsVideoMuted((prev) => !prev);
    }
  };

  const handleChapterChange = (cIdx: number) => {
    setSelectedKycChapter(cIdx);
    if (kycVideoRef.current) {
      const timeStamps = [0, 25, 55];
      kycVideoRef.current.currentTime = timeStamps[cIdx] || 0;
      kycVideoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  // Section 3: 4D Interactive 9-Module System State
  const [activePlanetIdx, setActivePlanetIdx] = useState(2); // Default to planet 03 (Sàn Giao Thương & Deal Flow)
  const [planetsPaused, setPlanetsPaused] = useState(false);
  const [solarAngle, setSolarAngle] = useState(0);
  const [orbitTilt, setOrbitTilt] = useState({ x: 0, y: 0 });

  const handleOrbitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setOrbitTilt({ x: -ny * 22, y: nx * 22 });
  };

  const handleOrbitMouseLeave = () => {
    setOrbitTilt({ x: 0, y: 0 });
    setPlanetsPaused(false);
  };

  // Section 4: 8-Satellite Ecosystem State (From CEO1983)
  const [activeSatellite, setActiveSatellite] = useState<number | null>(2); // Default to Doanh nghiệp
  const [orbitPaused, setOrbitPaused] = useState(false);

  // Testimonial State
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);

  // Form states
  const [demoForm, setDemoForm] = useState({ name: "", phone: "", email: "", org: "" });
  const [submitting, setSubmitting] = useState(false);

  const isDark = themeMode === "dark";
  const isContrast = themeMode === "contrast";

  const themeClass = (darkClass: string, lightClass: string, contrastClass?: string) => {
    if (isContrast && contrastClass) return contrastClass;
    if (isDark || isContrast) return darkClass;
    return lightClass;
  };

  const changeSlide = (newIndex: number) => {
    setSlideDirection(newIndex > heroSlide ? 1 : -1);
    setHeroSlide(newIndex);
  };

  // Hero slide auto-play every 8 seconds
  useEffect(() => {
    if (isSlidePaused) return;
    const timer = setInterval(() => {
      setSlideDirection(1);
      setHeroSlide((prev) => (prev + 1) % 2); // Strictly 2 slides
    }, 8000);
    return () => clearInterval(timer);
  }, [isSlidePaused]);

  // Real-time smooth planetary orbital motion loop
  useEffect(() => {
    if (planetsPaused) return;
    let animId: number;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      // Increment 12 degrees per second for a smooth, majestic planetary ballet
      setSolarAngle((prev) => (prev + dt * 12) % 360);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [planetsPaused]);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 16;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setCardTilt({ rotateX, rotateY, glareX, glareY });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setDemoModalOpen(false);
      setDemoForm({ name: "", phone: "", email: "", org: "" });
      toast.success("Đã ghi nhận yêu cầu Demo! Đội ngũ Business Connect sẽ liên hệ bạn trong 15 phút.");
    }, 800);
  };

  const activePlanet = PLANET_SOLUTIONS[activePlanetIdx];

  return (
    <div
      data-theme={themeMode}
      className={`min-h-screen relative selection:bg-[#D8B282] selection:text-slate-950 transition-colors duration-500 overflow-x-hidden ${
        themeClass("bg-[#02040A] text-[#FAF6F0]", "bg-[#FAF8F5] text-[#0F172A]", "bg-black text-[#FFE57F]")
      }`}
      style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      <SpatialCustomCursor />
      {/* Cánh cửa trắng / đen đóng mở khi chuyển theme */}
      <DoorThemeTransition isTransitioning={!isDoorOpen} targetTheme={themeMode} />

      {/* CSS KEYFRAMES: PENDULUM HANGING LAMPS, 3D INCLINED PLANETS, CEO1983 ORBIT & GEARS */}
      <style>{`
        /* Hanging Lamp Pendulum Sway */
        @keyframes pendulumSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2.4deg); }
          75% { transform: rotate(-2.4deg); }
        }
        .animate-pendulum-lamp {
          transform-origin: top center;
          animation: pendulumSway ease-in-out infinite;
        }

        /* CEO1983 Gem Shockwave */
        @keyframes gemShockwavePulse {
          0% { transform: scale(0.7); opacity: 0.95; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .animate-gem-shockwave {
          animation: gemShockwavePulse 2.8s cubic-bezier(0.1, 0.7, 0.1, 1) infinite;
        }

        /* Radar Sweeps */
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-radar-sweep {
          animation: radarSweep 6s linear infinite;
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 35s linear infinite;
        }

        /* Water Waves & Ripples */
        @keyframes waterWaveFlow1 {
          0%, 100% { transform: scale(1) rotate(-15deg); }
          50% { transform: scale(1.06) rotate(-12deg); }
        }
        @keyframes waterWaveFlow2 {
          0%, 100% { transform: scale(1) rotate(10deg); }
          50% { transform: scale(1.08) rotate(14deg); }
        }
        .animate-wave-1 {
          animation: waterWaveFlow1 9s ease-in-out infinite;
          will-change: transform;
        }
        .animate-wave-2 {
          animation: waterWaveFlow2 12s ease-in-out infinite;
          will-change: transform;
        }

        /* 3D Card Plasma Aura & Corner Sparks */
        @keyframes cardPlasmaAura {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-plasma-aura {
          animation: cardPlasmaAura 10s linear infinite;
        }
        @keyframes electricSparkJump {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.85; filter: drop-shadow(0 0 10px #D8B282); }
          25% { transform: translate(-6px, -8px) scale(1.4); opacity: 1; filter: drop-shadow(0 0 16px #FFF); }
          50% { transform: translate(5px, -5px) scale(0.85); opacity: 0.6; filter: drop-shadow(0 0 8px #C29B69); }
          75% { transform: translate(-3px, 4px) scale(1.2); opacity: 0.95; filter: drop-shadow(0 0 14px #D8B282); }
        }
        .animate-electric-spark {
          animation: electricSparkJump 1.4s ease-in-out infinite;
        }

        /* NFC Radiating Wave */
        @keyframes nfcPulseRing {
          0% { transform: scale(0.6); opacity: 0.95; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .animate-nfc-pulse {
          animation: nfcPulseRing 2.2s cubic-bezier(0.1, 0.7, 0.1, 1) infinite;
        }

        /* Mechanical Gears */
        @keyframes gearRotateCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gearRotateCCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-gear-cw {
          animation: gearRotateCW 22s linear infinite;
          transform-origin: center center;
        }
        .animate-gear-ccw {
          animation: gearRotateCCW 22s linear infinite;
          transform-origin: center center;
        }

        /* CEO 1983 Laser Energy Streams */
        @keyframes laserStreamFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -160; }
        }
        @keyframes laserStreamFlowReverse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 160; }
        }
        .animate-laser-flow {
          animation: laserStreamFlow 4.5s linear infinite;
        }
        .animate-laser-flow-reverse {
          animation: laserStreamFlowReverse 5.5s linear infinite;
        }

        /* Section 4 CEO1983 8-Satellite Orbit Keyframes */
        @keyframes orbitSatellitesSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitSatellitesReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-orbit-spin {
          animation: orbitSatellitesSpin 45s linear infinite;
          transform-origin: center center;
        }
        .animate-orbit-reverse {
          animation: orbitSatellitesReverse 45s linear infinite;
          transform-origin: center center;
        }
        .paused-spin {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* =========================================================================
          HERO LUXURY BACKGROUND: DEDICATED THEME ATMOSPHERES (CITY SKYLINE DARK & LIGHT)
          ========================================================================= */}
      <div className="absolute inset-0 top-0 left-0 w-full h-[1400px] pointer-events-none z-0 overflow-hidden">
        {/* Restored Original Hero Background: B2B Matrix & Luxury Gold Grid in Dark, HQ Daylight Architecture in Light */}
        {/* =========================================================================
            RESTORED V1 HERO: ORGANIC CURVED SPLIT LAYOUT
            - Trái: Khoảng trống trắng tinh khôi thông thoáng (Clean spacious text zone)
            - Phải: Ảnh nền tòa nhà hiện đại gốc (/landing/ceo1983-hero-light.jpg)
            - Ranh giới: Đường cong uốn lượn tự nhiên mềm mại (Organic Wave Boundary)
            ========================================================================= */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <clipPath id="v1HeroBuildingClip" clipPathUnits="objectBoundingBox">
              <path d="M 0.32,0 C 0.46,0.20 0.54,0.45 0.38,0.70 C 0.28,0.85 0.22,0.94 0.16,1.0 L 1,1 L 1,0 Z" />
            </clipPath>
          </defs>
        </svg>

        <div className="absolute inset-0">
          {themeMode === "light" ? (
            <>
              {/* Vùng ảnh nền tòa nhà ở nửa phải cắt theo đường cong uốn lượn */}
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ clipPath: "url(#v1HeroBuildingClip)" }}
              >
                <img
                  src="/landing/ceo1983-hero-light.jpg"
                  alt="ViOne Business Connect Landmark Tower Skyline"
                  className="w-full h-full object-cover object-right-top filter brightness-105 saturate-105 transition-all duration-700"
                />
                {/* Lớp gradient phủ nhẹ giữ độ êm mắt cho ảnh tòa nhà */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FAF8F5]/30 to-[#FAF8F5]/85" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/60 via-transparent to-[#FAF8F5]/90" />
              </div>

              {/* Đường viền uốn lượn sóng vàng champagne phân tách không gian */}
              <svg
                viewBox="0 0 1440 1100"
                fill="none"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <path
                  d="M 460,0 C 662,220 778,495 547,770 C 403,935 317,1034 230,1100"
                  stroke="url(#v1WaveGoldBoundary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="opacity-75"
                />
                <path
                  d="M 470,0 C 672,220 788,495 557,770 C 413,935 327,1034 240,1100"
                  stroke="#F6E1C3"
                  strokeWidth="1.2"
                  strokeDasharray="6 8"
                  className="opacity-60"
                />
                <defs>
                  <linearGradient id="v1WaveGoldBoundary" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.4" />
                    <stop offset="35%" stopColor="#D8B282" stopOpacity="0.95" />
                    <stop offset="70%" stopColor="#C29B69" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#8C653B" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </>
          ) : (
            <>
              {/* Dark Theme: Thành phố đêm sao ở nửa phải cắt uốn lượn */}
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ clipPath: "url(#v1HeroBuildingClip)" }}
              >
                <img
                  src="/ceo1983_hero_cosmos_skyline.jpg"
                  alt="ViOne Business Connect Cosmos City"
                  className="w-full h-full object-cover object-right-top opacity-85 filter brightness-105 contrast-115 transition-all duration-700"
                />
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen pointer-events-none"
                  style={{ backgroundImage: "url('/landing/luxury-gold-grid.gif')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#02040A]/40 to-[#02040A]/95" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#02040A]/60 via-transparent to-[#02040A]/95" />
              </div>

              {/* Đường viền uốn lượn vàng neon trong đêm tối */}
              <svg
                viewBox="0 0 1440 1100"
                fill="none"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <path
                  d="M 460,0 C 662,220 778,495 547,770 C 403,935 317,1034 230,1100"
                  stroke="url(#v1WaveGoldDarkBoundary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="opacity-80 drop-shadow-[0_0_12px_rgba(216,178,130,0.6)]"
                />
                <defs>
                  <linearGradient id="v1WaveGoldDarkBoundary" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.2" />
                    <stop offset="40%" stopColor="#FACC15" stopOpacity="1" />
                    <stop offset="70%" stopColor="#D8B282" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#8C653B" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </>
          )}
        </div>

        {themeMode === "light" ? (
          <>
            {/* Light Theme: Perspective Floor Grid & Ambient Corona */}
            <div
              className="absolute inset-x-0 bottom-0 h-[65%] opacity-25 pointer-events-none"
              style={{ perspective: "700px", transformOrigin: "center bottom" }}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: "rotateX(65deg) translateZ(0)",
                  backgroundImage: "linear-gradient(to right, rgba(216,178,130,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(216,178,130,0.4) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                  maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 80%)",
                }}
              />
            </div>
            {/* Golden Sunbeams & Radial Corona */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 15%, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.08) 45%, transparent 75%)",
              }}
            />
          </>
        ) : themeMode === "contrast" ? (
          <>
            {/* Contrast Theme: Cyber Obsidian & Electric Gold Grid */}
            <div className="absolute inset-0 w-full h-full opacity-95 bg-[radial-gradient(ellipse_at_top,#121826_0%,#040710_60%,#000000_100%)]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "linear-gradient(to right, #FACC15 1px, transparent 1px), linear-gradient(to bottom, #D8B282 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            </div>
          </>
        ) : (
          <>
            {/* Dark Theme: 3D Perspective Vector Grid Floor */}
            <div
              className="absolute inset-x-0 bottom-0 h-[70%] opacity-35 pointer-events-none"
              style={{ perspective: "800px", transformOrigin: "center bottom" }}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: "rotateX(68deg) translateZ(0)",
                  backgroundImage: "linear-gradient(to right, rgba(216,178,130,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(246,225,195,0.4) 1px, transparent 1px)",
                  backgroundSize: "70px 70px",
                  maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 85%)",
                }}
              />
            </div>
            {/* Procedural AI Synapse Constellation Web */}
            <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 120,200 L 380,140 L 680,240 L 980,160 L 1320,220" stroke="#D8B282" strokeWidth="1.2" strokeOpacity="0.4" fill="none" />
              <path d="M 80,380 L 340,320 L 720,400 L 1100,340 L 1400,380" stroke="#F6E1C3" strokeWidth="1" strokeOpacity="0.3" fill="none" />
              {[
                { x: 120, y: 200 },
                { x: 380, y: 140 },
                { x: 680, y: 240 },
                { x: 980, y: 160 },
                { x: 1320, y: 220 },
                { x: 340, y: 320 },
                { x: 720, y: 400 },
                { x: 1100, y: 340 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="2.5" fill="#F6E1C3" className="animate-pulse" style={{ animationDuration: `${2 + i * 0.4}s` }} />
              ))}
            </svg>
            {/* Holographic Radar Concentric Laser Rings & Active 360° Radar Sweep Beam */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-[#D8B282]/15 pointer-events-none animate-spin-slow" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border border-[#F6E1C3]/20 pointer-events-none flex items-center justify-center">
              {/* 360° City Radar Sweep Beam */}
              <div
                className="absolute w-full h-full rounded-full pointer-events-none animate-spin"
                style={{
                  animationDuration: "14s",
                  background: "conic-gradient(from 0deg, rgba(216,178,130,0.2) 0deg, rgba(246,225,195,0.03) 60deg, transparent 65deg)",
                }}
              />
            </div>
          </>
        )}

        {/* =========================================================================
            DYNAMIC 3D VECTOR STREAMS FROM CEO1983:
            - THEME TỐI: SÓNG NƯỚC 3D CUỒN CUỘN CHẢY LIÊN TỤC KHÔNG ĐỨT ĐOẠN
            - THEME SÁNG: LUỒNG GIÓ KHÍ ĐỘNG HỌC MỀM MẠI UỐN LƯỢN (AERODYNAMIC SILK WIND)
            - THEME TƯƠNG PHẢN: MA TRẬN NĂNG LƯỢNG CYBER OBSIDIAN & ELECTRIC GOLD
            ========================================================================= */}
        <svg
          className="absolute top-0 inset-x-0 w-full h-[1200px] pointer-events-none"
          viewBox="0 0 1440 1100"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="bcFluidGlow3D" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bcSpecularGleam" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <defs>
            {/* 1. Dark Theme: Surging 3D Liquid Crystal Water Stream */}
            <linearGradient id="bcLiquidWaterStream" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.5" />
              <stop offset="25%" stopColor="#D8B282" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#C29B69" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#D8B282" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFF5E6" stopOpacity="0.5" />
            </linearGradient>

            <linearGradient id="bcLiquidSpecularSpine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <stop offset="20%" stopColor="#FFFFFF" stopOpacity="0.98" />
              <stop offset="50%" stopColor="#F6E1C3" stopOpacity="1" />
              <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#D8B282" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="bcLiquidWaterBranch" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#D8B282" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8C653B" stopOpacity="0.25" />
            </linearGradient>

            {/* 2. Light Theme: Aerodynamic Silk Wind Streamlines (Luồng Gió Khí Động Học Mềm Mại) */}
            <linearGradient id="bcSilkWindGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D8B282" stopOpacity="0" />
              <stop offset="20%" stopColor="#D8B282" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#8C653B" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#F6E1C3" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D8B282" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="bcSilkWindGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="0" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#F6E1C3" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="bcSilkWindGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A8824B" stopOpacity="0" />
              <stop offset="40%" stopColor="#D8B282" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#8C653B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#D8B282" stopOpacity="0" />
            </linearGradient>

            {/* 3. High Contrast Theme: Electric Neon Gold Stream */}
            <linearGradient id="bcContrastElectricStream" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FACC15" stopOpacity="1" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0.8" />
            </linearGradient>

            {/* 3D Spherical Droplet Radial Gradient */}
            <radialGradient id="bcWaterBubble3D" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="22%" stopColor="#FFF5E6" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#D8B282" stopOpacity="0.75" />
              <stop offset="90%" stopColor="#8C653B" stopOpacity="0.9" />
            </radialGradient>
          </defs>

          {/* RENDER THEME-SPECIFIC FLOWS */}
          {themeMode === "light" ? (
            /* THEME SÁNG: LUỒNG GIÓ KHÍ ĐỘNG HỌC MỀM MẠI, DẢI LỤA THANH THOÁT */
            <g className="animate-wave-1">
              <path
                d="M -120,810 C 220,770 480,740 780,775 C 1080,810 1320,770 1560,790"
                stroke="url(#bcSilkWindGrad1)"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M -80,808 C 240,768 500,738 800,773 C 1100,808 1340,768 1560,788"
                stroke="url(#bcSilkWindGrad2)"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 60,750 C 380,710 680,725 980,755 C 1240,780 1420,745 1560,760"
                stroke="url(#bcSilkWindGrad3)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M -100,860 C 260,820 600,830 920,800 C 1200,775 1400,825 1560,835"
                stroke="url(#bcSilkWindGrad1)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.45"
              />
              {/* Floating Golden Breeze Particles in Wind Flow */}
              {[
                { cx: 280, cy: 780, r: 2 },
                { cx: 480, cy: 750, r: 2.5 },
                { cx: 720, cy: 765, r: 3 },
                { cx: 960, cy: 785, r: 2.5 },
                { cx: 1220, cy: 770, r: 3 },
              ].map((dot, dIdx) => (
                <g key={dIdx} className="animate-pulse" style={{ animationDuration: `${1.8 + dIdx * 0.3}s` }}>
                  <circle cx={dot.cx} cy={dot.cy} r={dot.r} fill="#D8B282" opacity="0.7" />
                  <circle cx={dot.cx} cy={dot.cy} r={dot.r * 0.4} fill="#FFFFFF" />
                </g>
              ))}
            </g>
          ) : themeMode === "contrast" ? (
            /* THEME TƯƠNG PHẢN: CYBER ELECTRIC VEINS */
            <g className="animate-wave-1">
              <path
                d="M -100,790 C 260,740 580,720 860,760 C 1140,790 1360,750 1560,780"
                stroke="url(#bcContrastElectricStream)"
                strokeWidth="7"
                strokeLinecap="round"
                filter="url(#bcFluidGlow3D)"
              />
              <path
                d="M -100,788 C 260,738 580,718 860,758 C 1140,788 1360,748 1560,778"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* THEME TỐI: SÓNG NƯỚC 3D CUỒN CUỘN CHẢY LIÊN TỤC KHÔNG ĐỨT ĐOẠN */
            <g>
              <g className="animate-wave-1">
                {/* Volumetric Refraction Aura */}
                <path
                  d="M -120,800 C 250,755 590,735 890,775 C 1170,815 1390,775 1560,795"
                  stroke="#8C653B"
                  strokeWidth="16"
                  strokeLinecap="round"
                  opacity="0.2"
                  filter="url(#bcFluidGlow3D)"
                />
                {/* Main 3D Liquid Tube */}
                <path
                  d="M -120,800 C 250,755 590,735 890,775 C 1170,815 1390,775 1560,795"
                  stroke="url(#bcLiquidWaterStream)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  filter="url(#bcFluidGlow3D)"
                />
                {/* Inner Clear Liquid Channel */}
                <path
                  d="M -120,800 C 250,755 590,735 890,775 C 1170,815 1390,775 1560,795"
                  stroke="#F6E1C3"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                {/* High-Gloss Specular White Core Spine */}
                <path
                  d="M -120,798 C 250,753 590,733 890,773 C 1170,813 1390,773 1560,793"
                  stroke="url(#bcLiquidSpecularSpine)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  filter="url(#bcSpecularGleam)"
                />
              </g>

              {/* Secondary Branching Tendril at Base */}
              <g className="animate-wave-2">
                <path
                  d="M 480,750 C 720,785 960,825 1240,800 C 1380,785 1480,800 1560,810"
                  stroke="url(#bcLiquidWaterBranch)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.5"
                  filter="url(#bcFluidGlow3D)"
                />
                <path
                  d="M 480,750 C 720,785 960,825 1240,800 C 1380,785 1480,800 1560,810"
                  stroke="#FFFFFF"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>

              {/* 3D Spherical Water Bubbles & Droplets */}
              <g>
                <g transform="translate(380, 765)">
                  <circle cx="0" cy="0" r="6" fill="url(#bcWaterBubble3D)" stroke="#F6E1C3" strokeWidth="0.8" filter="url(#bcSpecularGleam)" />
                  <ellipse cx="-1.8" cy="-1.8" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.95" />
                </g>
                <g transform="translate(620, 745)">
                  <circle cx="0" cy="0" r="7" fill="url(#bcWaterBubble3D)" stroke="#F6E1C3" strokeWidth="0.9" filter="url(#bcSpecularGleam)" />
                  <ellipse cx="-2.2" cy="-2.2" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.95" />
                </g>
                <g transform="translate(880, 780)">
                  <circle cx="0" cy="0" r="7.5" fill="url(#bcWaterBubble3D)" stroke="#FFF5E6" strokeWidth="0.9" filter="url(#bcSpecularGleam)" />
                  <ellipse cx="-2.5" cy="-2.5" rx="3" ry="1.6" fill="#FFFFFF" opacity="0.95" />
                </g>
                <g transform="translate(1180, 815)">
                  <circle cx="0" cy="0" r="6.5" fill="url(#bcWaterBubble3D)" stroke="#FFF5E6" strokeWidth="0.8" filter="url(#bcSpecularGleam)" />
                  <ellipse cx="-2" cy="-2" rx="2.4" ry="1.4" fill="#FFFFFF" opacity="0.95" />
                </g>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Auto-Hiding Top Navigation & Header Container */}
      <div
        style={headerStyle}
        onMouseEnter={resetTimer}
        className="fixed top-0 inset-x-0 z-50 flex flex-col"
      >

      {/* =========================================================================
          1. HEADER (BUSINESS CONNECT - HIGH CONTRAST & ADAPTIVE)
          ========================================================================= */}
      <header
        className={`sticky top-0 inset-x-0 z-50 backdrop-blur-2xl border-b transition-all duration-300 ${themeClass(
          "bg-[#02040A]/90 border-[#D8B282]/35 text-white shadow-[0_4px_30px_rgba(0,0,0,0.8)]",
          "bg-[#FAF8F5]/95 border-[#D8B282]/40 text-[#0F172A] shadow-[0_4px_25px_rgba(245,158,11,0.12)]",
          "bg-black/95 border-amber-400 text-white"
        )}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo: BUSINESS CONNECT (Match Ảnh 2) */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <Hexagon className="w-10 h-10 text-[#D8B282] stroke-[1.8]" />
                <div className="absolute w-2 h-2 rounded-full bg-[#D8B282]" />
              </div>
              <div className="text-left flex flex-col justify-center">
                <div className={`text-base font-black tracking-wider uppercase font-sans leading-none ${themeClass("text-white", "text-[#0F172A]", "text-white")}`}>
                  BUSINESS
                </div>
                <div className={`text-base font-black tracking-wider uppercase font-sans leading-none mt-0.5 ${themeClass("text-white", "text-[#0F172A]", "text-white")}`}>
                  CONNECT
                </div>
                <p className={`text-[8.5px] font-bold tracking-[0.2em] uppercase mt-1 ${themeClass("text-[#D8B282]", "text-[#8C653B]", "text-yellow-300")}`}>
                  PEOPLE · OPPORTUNITIES · GROWTH
                </p>
              </div>
            </div>

            {/* Menu & Controls Grouped to Center & Far Right (Match Ảnh 2) */}
            <div className="ml-auto flex items-center gap-6 lg:gap-8">
              {/* Desktop Navigation Links (Match Ảnh 2: Giải pháp, Khách hàng, Câu chuyện, Bảng giá, Tài nguyên, Về chúng tôi) */}
              <nav className={`hidden lg:flex items-center gap-7 text-[13.5px] font-medium tracking-normal ${themeClass("text-slate-200", "text-slate-800 font-semibold", "text-yellow-100")}`}>
                <a href="#solutions" className="hover:text-[#D8B282] transition-colors">
                  Giải pháp
                </a>
                <a href="#customers" className="hover:text-[#D8B282] transition-colors">
                  Khách hàng
                </a>
                <a href="#stories" className="hover:text-[#D8B282] transition-colors">
                  Câu chuyện
                </a>
                <a href="#pricing" className="hover:text-[#D8B282] transition-colors">
                  Bảng giá
                </a>
                <a href="#resources" className="hover:text-[#D8B282] transition-colors">
                  Tài nguyên
                </a>
                <a href="#about" className="hover:text-[#D8B282] transition-colors">
                  Về chúng tôi
                </a>
              </nav>

              {/* Right Controls */}
              <div className="hidden sm:flex items-center gap-3">

                {/* Minimalist Language Selector 🌐 VI ⌄ (Match Ảnh 2) */}
                <div className="flex items-center">
                  <LangSwitcher />
                </div>

                {/* Nút Đăng nhập Pill Outline (Match Ảnh 2) */}
                <Link
                  to="/auth"
                  className={`px-5 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all shadow-sm ${themeClass(
                    "border-neutral-500 hover:border-[#D8B282] text-white hover:text-[#D8B282] bg-white/[0.03]",
                    "border-slate-400 hover:border-[#8C653B] text-slate-900 hover:text-[#8C653B] bg-slate-100/50",
                    "border-yellow-400 text-yellow-200 hover:bg-yellow-400/10"
                  )}`}
                >
                  Đăng nhập
                </Link>

                {/* Button Đặt Demo */}
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] hover:brightness-105 shadow-[0_0_15px_rgba(216,178,130,0.3)]"
                >
                  <span>Đặt demo</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl border ${themeClass("text-slate-200 border-white/10 hover:bg-white/10", "text-slate-800 border-slate-300 hover:bg-slate-100", "text-white")}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`lg:hidden border-t px-4 py-4 space-y-2 text-left ${themeClass("border-[#D8B282]/30 bg-[#02040A]/98", "border-[#D8B282]/30 bg-[#FAF8F5]", "border-yellow-400 bg-black")}`}
            >
              <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold hover:text-[#C29B69]">Trang chủ</a>
              <a href="#challenges" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold hover:text-[#C29B69]">Thách thức</a>
              <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold hover:text-[#C29B69]">Khách hàng</a>
              <a href="#ecosystem" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold hover:text-[#C29B69]">Hệ sinh thái</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold hover:text-[#C29B69]">Tiếng nói</a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>

    {/* =========================================================================
        2. HERO SECTION: STRICTLY 2 SLIDES WITH RICH LUXURY ANIMATIONS
        ========================================================================= */}
    <section id="hero" className="relative z-10 pt-20 pb-12 sm:pt-24 sm:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Slide Indicator Tabs (2 Slides) */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className={`inline-flex items-center p-1.5 rounded-full border backdrop-blur-xl shadow-lg gap-2 ${themeClass(
            "bg-[#040814]/85 border-[#D8B282]/40 shadow-[0_0_20px_rgba(216,178,130,0.2)]",
            "bg-white/95 border-[#D8B282]/50 shadow-md",
            "bg-black border-yellow-400"
          )}`}>
            <button
              type="button"
              onClick={() => changeSlide(0)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                heroSlide === 0
                  ? "bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-md font-black"
                  : themeClass(
                      "text-slate-400 hover:text-white",
                      "text-slate-600 hover:text-slate-900 font-bold",
                      "text-yellow-200"
                    )
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Thẻ VIP Titanium 3D</span>
            </button>

            <button
              type="button"
              onClick={() => changeSlide(1)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                heroSlide === 1
                  ? "bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-md font-black"
                  : themeClass(
                      "text-slate-400 hover:text-white",
                      "text-slate-600 hover:text-slate-900 font-bold",
                      "text-yellow-200"
                    )
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video AI Presenter 4K</span>
            </button>
          </div>
        </div>

        {/* Animate Hero Slide Content */}
        <AnimatePresence mode="wait" custom={slideDirection}>
          {heroSlide === 0 && (
            /* SLIDE 1: TITANIUM VIP NFC CARD SHOWCASE MATCHING CEO1983 */
            <motion.div
              key="slide-titanium-card"
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -50 : 50 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              onMouseEnter={() => setIsSlidePaused(true)}
              onMouseLeave={() => setIsSlidePaused(false)}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            >
              {/* Left Column (7 cols): Bold Typography & Measurable Metrics */}
              <div className="lg:col-span-7 text-left space-y-4 sm:space-y-4.5">
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase font-mono border backdrop-blur-md shadow-sm ${themeClass(
                    "border-[#D8B282]/50 text-[#F6E1C3] bg-[#D8B282]/15",
                    "border-[#D8B282]/60 text-amber-900 bg-amber-100 font-extrabold",
                    "border-yellow-400 text-yellow-300 bg-yellow-400/20"
                  )}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-[#C29B69]" />
                  <span>NỀN TẢNG KẾT NỐI KINH DOANH B2B</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[1.1]">
                  <span className={`block font-black ${themeClass("text-white", "text-[#0F172A]", "text-white")}`}>
                    <SplitTypeReveal text="HIỂU ĐÚNG NGƯỜI." delay={0.1} />
                  </span>
                  <span
                    className={`block mt-1 font-black ${themeClass(
                      "text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282]",
                      "text-transparent bg-clip-text bg-gradient-to-r from-[#0F172A] via-[#8C653B] to-[#D8B282]",
                      "text-yellow-300"
                    )}`}
                  >
                    <SplitTypeReveal text="MỞ RA CƠ HỘI THẬT." delay={0.25} />
                  </span>
                  <span
                    className={`block mt-1 font-black ${themeClass(
                      "text-transparent bg-clip-text bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B]",
                      "text-transparent bg-clip-text bg-gradient-to-r from-[#78350F] via-[#B45309] to-[#D97706]",
                      "text-yellow-400"
                    )}`}
                  >
                    <SplitTypeReveal text="TĂNG TRƯỞNG THỰC CHẤT." delay={0.4} />
                  </span>
                </h1>

                <p className={`text-sm sm:text-base leading-relaxed max-w-2xl font-medium ${themeClass("text-[#D4C3A3]/90", "text-slate-800", "text-yellow-100")}`}>
                  Business Connect giúp các hiệp hội, tổ chức và doanh nghiệp quản lý mạng lưới hội viên, kết nối đúng đối tác tiềm năng, chốt thương vụ B2B và đo lường ROI mạng lưới tức thì với trí tuệ nhân tạo AI.
                </p>

                {/* 3 Luxury Highlight Feature Badges */}
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {[
                    "Hồ Sơ Doanh Nghiệp 360° & AI Match",
                    "Định Danh Số Thẻ Titanium NFC 1-Chạm",
                    "Sàn Giao Thương B2B & Deal Room",
                  ].map((badge, bIdx) => (
                    <div
                      key={bIdx}
                      className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-sm ${themeClass(
                        "bg-[#0D162B]/80 border-[#D8B282]/30 text-[#F6E1C3]",
                        "bg-white/95 border-[#D8B282]/50 text-slate-900 font-extrabold shadow-sm",
                        "bg-black border-yellow-400 text-yellow-200"
                      )}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C29B69] shrink-0" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>

                {/* 4 Strategic Metrics as Styled Apple TV Parallax Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
                  {[
                    { num: "10.000+", label: "Doanh nhân & Hội viên" },
                    { num: "300+", label: "Hiệp hội & Tổ chức" },
                    { num: "50.000+", label: "Kết nối thành công" },
                    { num: "20+", label: "Quốc gia & vùng lãnh thổ" },
                  ].map((stat, sIdx) => (
                    <AppleTVParallaxCard
                      key={sIdx}
                      title={stat.num}
                      desc={stat.label}
                      className={`p-3 rounded-2xl border transition-all duration-300 backdrop-blur-md text-left ${themeClass(
                        "bg-gradient-to-br from-[#0B152B]/90 via-[#070D1E]/90 to-[#02050E]/90 border-[#D8B282]/35 shadow-lg",
                        "bg-gradient-to-br from-white/95 via-[#FFFDF9]/95 to-[#F6EDE0]/95 border-[#D8B282]/50 shadow-md",
                        "bg-black border-yellow-400 text-yellow-300"
                      )}`}
                    />
                  ))}
                </div>

                {/* Primary CTA Buttons with Apple Magnetic Effect */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <MagneticButton strength={0.3}>
                    <button
                      type="button"
                      onClick={() => setDemoModalOpen(true)}
                      className="px-6 py-3 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-xl hover:scale-105 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>Đặt Demo Nền Tảng</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </MagneticButton>

                  <MagneticButton strength={0.25}>
                    <button
                      type="button"
                      onClick={() => changeSlide(1)}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm border transition-all cursor-pointer ${themeClass(
                        "border-[#D8B282]/50 text-[#F6E1C3] bg-[#0A1224]/80 hover:bg-[#0E1A33] hover:border-[#D8B282]",
                        "border-2 border-[#D8B282]/60 text-slate-900 bg-white hover:bg-amber-50 font-extrabold shadow-sm",
                        "border-yellow-400 text-yellow-300 bg-black"
                      )}`}
                    >
                      <Play className="w-4 h-4 text-[#C29B69]" />
                      <span>Xem Video AI Nói (Full Screen)</span>
                    </button>
                  </MagneticButton>
                </div>
              </div>

              {/* Right Column (5 cols): 3D Card on Fluid Animated Water Ripples matching CEO1983 */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[460px] group perspective-[1200px] flex items-center justify-center">
                  {/* Floating Halo Under Card */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-80 h-16 bg-[#D8B282]/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Concentric Animated Aquatic Water Ripples under the Card */}
                  <div className="absolute inset-[-75px] sm:inset-[-110px] pointer-events-none z-0 flex items-center justify-center animate-wave-1">
                    <svg viewBox="0 0 500 380" fill="none" className="w-full h-full">
                      {/* Water Wave Ripple 1 (Gold Specular Glow) */}
                      <ellipse
                        cx="250"
                        cy="190"
                        rx="235"
                        ry="115"
                        transform="rotate(-15 250 190)"
                        stroke="url(#heroWaterRipple1)"
                        strokeWidth="2.8"
                        strokeOpacity="0.8"
                      />
                      {/* Water Wave Ripple 2 (Warm Golden Hue) */}
                      <ellipse
                        cx="250"
                        cy="190"
                        rx="175"
                        ry="85"
                        transform="rotate(10 250 190)"
                        stroke="url(#heroWaterRipple2)"
                        strokeWidth="2"
                        strokeOpacity="0.85"
                      />
                      <ellipse
                        cx="250"
                        cy="190"
                        rx="280"
                        ry="140"
                        stroke="#FFFFFF"
                        strokeWidth="1.6"
                        strokeOpacity="0.5"
                        className="filter drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                      />

                      <defs>
                        <linearGradient id="heroWaterRipple1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FFF5E6" stopOpacity="1" />
                          <stop offset="35%" stopColor="#F6E1C3" stopOpacity="0.95" />
                          <stop offset="70%" stopColor="#D8B282" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#8C653B" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="heroWaterRipple2" x1="1" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#FFF5E6" stopOpacity="1" />
                          <stop offset="40%" stopColor="#F6E1C3" stopOpacity="0.95" />
                          <stop offset="75%" stopColor="#D8B282" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#8C653B" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Orbiting Water Droplets / Beacons */}
                    <div className="absolute top-6 right-10 w-4 h-4 rounded-full bg-[#F6E1C3] blur-[0.5px] shadow-[0_0_20px_#D8B282] animate-ping" />
                    <div className="absolute bottom-8 left-8 w-4 h-4 rounded-full bg-amber-200 blur-[0.5px] shadow-[0_0_20px_#F6E1C3] animate-pulse" />
                    <div className="absolute top-1/2 left-0 w-3 h-3 rounded-full bg-white blur-[0.5px] shadow-[0_0_15px_#FFFFFF] animate-ping" style={{ animationDuration: "1.8s" }} />
                    <div className="absolute bottom-1/4 right-2 w-3.5 h-3.5 rounded-full bg-white blur-[0.5px] shadow-[0_0_18px_#FFFFFF] animate-pulse" />
                  </div>

                  {/* 3D Interactive Magnetic Parallax Tilt & Flip Card */}
                  <div
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="relative z-10 w-full aspect-[1.58/1] rounded-3xl cursor-pointer perspective-[1200px]"
                  >
                    {/* Rotating Dual Plasma Energy Aura behind the Titanium Card */}
                    <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-r from-[#F6E1C3]/30 via-[#D8B282]/40 to-white/20 blur-xl animate-plasma-aura pointer-events-none" />
                    <div className="absolute -inset-1 rounded-[32px] border-2 border-[#F6E1C3]/70 shadow-[0_0_20px_rgba(246,225,195,0.6)] animate-plasma-aura pointer-events-none" style={{ animationDirection: "reverse", animationDuration: "16s" }} />

                    {/* Corner Electric Sparks */}
                    <span className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-white animate-electric-spark shadow-[0_0_12px_#FFFFFF] pointer-events-none z-20" />
                    <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-[#F6E1C3] animate-electric-spark shadow-[0_0_12px_#F6E1C3] pointer-events-none z-20" style={{ animationDelay: "0.5s" }} />
                    <span className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-amber-300 animate-electric-spark shadow-[0_0_12px_#F59E0B] pointer-events-none z-20" style={{ animationDelay: "1s" }} />
                    <span className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-[#D8B282] animate-electric-spark shadow-[0_0_12px_#D8B282] pointer-events-none z-20" style={{ animationDelay: "1.5s" }} />

                    <motion.div
                      onClick={() => setCardFlipped((p) => !p)}
                      animate={{
                        rotateX: cardTilt.rotateX,
                        rotateY: cardFlipped ? 180 + cardTilt.rotateY : cardTilt.rotateY,
                        scale: cardTilt.rotateX !== 0 ? 1.04 : 1,
                      }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="relative w-full h-full rounded-3xl preserve-3d shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(216,178,130,0.5)] border border-[#F6E1C3]/90 transition-shadow duration-300"
                    >
                      {/* Front Face — Radial Brushed Champagne Gold Metal Finish with Holographic Specular Glare */}
                      <div
                        className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 backface-hidden flex flex-col justify-between overflow-hidden border border-[#D8B282] shadow-inner"
                        style={{
                          background:
                            "radial-gradient(circle at 45% 45%, #FFF0DC 0%, #F5D7A9 28%, #D4A767 60%, #9C6F35 100%)",
                        }}
                      >
                        {/* Dynamic Holographic Foil Specular Sheen moving with cursor */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-50 mix-blend-color-dodge transition-all duration-150"
                          style={{
                            background: `radial-gradient(circle at ${cardTilt.glareX}% ${cardTilt.glareY}%, rgba(255,255,255,0.9) 0%, rgba(246,225,195,0.4) 30%, transparent 65%)`,
                          }}
                        />

                        {/* Metallic Conic Brushed Texture */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
                          style={{
                            background:
                              "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.7) 0deg, rgba(0,0,0,0.3) 45deg, rgba(255,255,255,0.8) 90deg, rgba(0,0,0,0.4) 135deg, rgba(255,255,255,0.7) 180deg, rgba(0,0,0,0.3) 225deg, rgba(255,255,255,0.8) 270deg, rgba(0,0,0,0.4) 315deg, rgba(255,255,255,0.7) 360deg)",
                          }}
                        />

                        {/* Giant Watermark Embossed VIONE Globe */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-44 h-44 rounded-full opacity-35 pointer-events-none flex items-center justify-center border-2 border-slate-950/40">
                          <div className="absolute inset-2 rounded-full border border-slate-950/30" />
                          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-950/40" />
                          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-950/40" />
                          <div className="absolute inset-y-0 left-1/4 w-[1px] rounded-full border-l border-slate-950/30" />
                          <div className="absolute inset-y-0 right-1/4 w-[1px] rounded-full border-r border-slate-950/30" />
                          <span className="font-sans font-black text-3xl text-slate-950/60 tracking-wider">
                            VIONE
                          </span>
                        </div>

                        {/* Card Top Row */}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full border border-slate-950/70 bg-gradient-to-br from-white/40 to-black/10 flex items-center justify-center font-sans font-black text-slate-950 text-xs shadow-xs">
                              V1
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-mono font-black tracking-widest text-slate-950 uppercase">
                                BUSINESS CONNECT VIP
                              </p>
                              <p className="text-[8px] text-slate-900 uppercase font-bold tracking-wider">
                                VIONE ALLIANCE NETWORK
                              </p>
                            </div>
                          </div>

                          <span className="text-[9px] font-mono font-bold text-slate-900/80 tracking-wider">
                            BC-2026-NFC
                          </span>
                        </div>

                        {/* Card Middle: Gold Smart Chip with Contactless NFC Pulsing Waves */}
                        <div className="my-auto py-1 relative z-10 text-left">
                          <div className="relative inline-block">
                            {/* Contactless Radiating Solid NFC Waves */}
                            <span className="absolute -inset-2 rounded-xl border border-[#8C653B]/60 shadow-[0_0_10px_rgba(216,178,130,0.4)] animate-nfc-pulse pointer-events-none" />
                            <span className="absolute -inset-4 rounded-2xl border border-[#F6E1C3]/50 shadow-[0_0_15px_rgba(246,225,195,0.5)] animate-ping pointer-events-none" style={{ animationDuration: "2.4s" }} />

                            <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-[#FFF7EA] via-[#E9C38E] to-[#976A30] border border-slate-950/50 shadow-sm relative overflow-hidden flex items-center justify-center">
                              <div className="w-7 h-5 rounded-md border border-slate-950/40 grid grid-cols-3 grid-rows-2 divide-x divide-y divide-slate-950/40" />
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Row */}
                        <div className="flex items-end justify-between relative z-10 pt-2 border-t border-slate-950/20 text-left">
                          <div>
                            <p className="text-[8.5px] font-mono text-slate-950 font-black tracking-widest uppercase">
                              TITANIUM VIP PASS
                            </p>
                            <p className="text-sm sm:text-base font-black text-slate-950 tracking-wider">
                              DOANH NHÂN HỘI NHẬP
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9.5px] font-mono font-black text-slate-950">ID: BC-8888-VIP</span>
                            <p className="text-[7.5px] font-mono font-bold text-slate-900/75 uppercase mt-0.5">
                              CHẠM ĐỂ KẾT NỐI SAU 1S
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Back Face */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0B1020] via-[#050814] to-[#02050E] rotate-y-180 backface-hidden flex flex-col justify-between overflow-hidden border border-[#D8B282]/50 text-left">
                        <div className="flex items-center justify-between border-b border-[#D8B282]/20 pb-2.5">
                          <span className="text-[10px] font-mono text-[#F6E1C3] font-bold uppercase">
                            DIGITAL VIP IDENTITY
                          </span>
                          <Wallet className="w-4 h-4 text-[#D8B282]" />
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-white">Xác thực hồ sơ doanh nghiệp chuẩn mực</p>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            Chạm 1-lần vào điện thoại thông minh để trao đổi hồ sơ doanh nghiệp 360° đã được xác thực qua ViOne Business Connect. Tự động lưu danh bạ và mở cơ hội đàm phán hợp đồng.
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#D8B282]/20 flex items-center justify-between text-[9px] font-mono text-[#D8B282]">
                          <span>ENCRYPTED ID: 8888</span>
                          <span>BUSINESS CONNECT VN</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Hint under card */}
                  <div className="absolute -bottom-8 inset-x-0 text-center pointer-events-none">
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${themeClass("text-[#D8B282]/70", "text-slate-600 font-bold", "text-yellow-300")}`}>
                      CHẠM VÀO THẺ ĐỂ LẬT MẶT SAU (3D FLIP) • DI CHUỘT ĐỂ XOAY GÓC NHÌN
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {heroSlide === 1 && (
            /* SLIDE 2: FULL-WIDTH FULL-HEIGHT CINEMATIC AI PRESENTER VIDEO (ZERO EXTRA TEXT) */
            <motion.div
              key="slide-kyc-video-terminal"
              custom={slideDirection}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              onMouseEnter={() => setIsSlidePaused(true)}
              onMouseLeave={() => setIsSlidePaused(false)}
              className="w-full relative"
            >
              {/* Full-width, Full-height Cinematic Video Stage */}
              <div
                className={`w-full rounded-3xl border-2 overflow-hidden shadow-2xl relative group ${themeClass(
                  "border-[#D8B282]/50 bg-black shadow-[0_25px_80px_rgba(0,0,0,0.95)]",
                  "border-[#D8B282]/60 bg-black shadow-[0_25px_70px_rgba(180,130,60,0.25)]",
                  "border-yellow-400 bg-black"
                )}`}
                style={{ minHeight: "520px", height: "clamp(520px, 70vh, 680px)" }}
              >
                <video
                  ref={kycVideoRef}
                  src="/landing/video_vione_kyc.mp4"
                  playsInline
                  loop
                  autoPlay
                  muted={isVideoMuted}
                  className="w-full h-full object-cover sm:object-contain bg-black"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />

                {/* Sleek Minimalist Floating Controls Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/85 via-transparent to-black/50">
                  {/* Top Floating Badge & Return Button */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-[#D8B282]/40 text-[#F6E1C3] text-xs font-mono font-bold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>AI PRESENTER • 4K ULTRA HD</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeSlide(0)}
                      className="px-4 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md border border-[#D8B282]/50 text-[#F6E1C3] hover:text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>← Quay lại Thẻ VIP Titanium</span>
                    </button>
                  </div>

                  {/* Center Hover Play/Pause Button */}
                  <div className="pointer-events-auto self-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={toggleVideoPlay}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-[#F6E1C3] to-amber-500 p-1 shadow-[0_0_40px_rgba(245,158,11,0.8)] hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      title={isVideoPlaying ? "Tạm dừng" : "Phát video"}
                    >
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[#F6E1C3]">
                        {isVideoPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                      </div>
                    </button>
                  </div>

                  {/* Bottom Minimalist Floating Control Bar */}
                  <div className="flex items-center justify-between pointer-events-auto bg-black/75 backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl border border-white/10 max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleVideoPlay}
                        className="p-1.5 rounded-lg text-[#F6E1C3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title={isVideoPlaying ? "Tạm dừng" : "Phát"}
                      >
                        {isVideoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={toggleVideoMute}
                        className="p-1.5 rounded-lg text-[#F6E1C3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title={isVideoMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                      >
                        {isVideoMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDemoModalOpen(true)}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-105 transition-all shadow-md cursor-pointer"
                      >
                        Đặt Demo Thẩm Định
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoModalOpen(true)}
                        className="p-2 rounded-lg text-[#F6E1C3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Toàn màn hình"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <OrganicCurvedDivider variant="flow" />

      {/* =========================================================================
          NEW SECTION (MATCHING ẢNH 1 SPEC):
          QUẢN LÝ QUAN HỆ KINH DOANH VẪN CÒN NHIỀU THÁCH THỨC
          TINH GIẢN 1-2 TÒA NHÀ CAO TẦNG TRỜI XANH / TỐI TƯƠNG PHẢN CAO,
          VIỀN SÓNG LƯỢN ĐÈ NỔI, FONT RÕ RÀNG & HIỆU ỨNG CHỮ HIỆN LẦN LƯỢT (STAGGERED SCROLL)
          ========================================================================= */}
      <section
        id="executive-challenges-overview"
        className={`py-20 lg:py-24 relative z-20 border-y transition-colors duration-500 overflow-hidden ${themeClass(
          "border-[#D8B282]/30 bg-[#02040A]/85",
          "border-[#D8B282]/40 bg-[#FAF8F5]/90",
          "border-yellow-400/40 bg-black/95"
        )}`}
      >
        {/* Dedicated Scenery Atmosphere Background with Minimalist High-Rise Glass Tower (1-2 toà nhà tinh giản) */}
        <SectionAtmosphereBackground themeMode={themeMode} sectionId="hero" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.05,
                },
              },
            }}
            className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-10 lg:gap-8"
          >
            {/* Left Column: Eyebrow + Main Title (Exact wording & typography from Ảnh 1) */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="w-full lg:w-[38%] text-left shrink-0 space-y-3"
            >
              <div
                className={`text-[11px] sm:text-xs font-black tracking-[0.22em] uppercase ${themeClass(
                  "text-[#D8B282]",
                  "text-[#8C653B]",
                  "text-yellow-300"
                )}`}
              >
                NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
              </div>
              <h2
                className={`text-2xl sm:text-3xl lg:text-[38px] font-black tracking-tight leading-[1.2] font-sans ${themeClass(
                  "text-white",
                  "text-[#0F172A]",
                  "text-white"
                )}`}
                style={{ fontFamily: "'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, sans-serif" }}
              >
                <KineticWords text="Quản lý quan hệ kinh doanh" delay={0.05} /> <br />
                <span className={themeClass("text-[#F6E1C3]", "text-[#78350F]", "text-yellow-300")}>
                  <KineticWords text="vẫn còn nhiều thách thức" delay={0.25} />
                </span>
              </h2>
            </motion.div>

            {/* Right Column: 5 Challenge Points with Circular Gold Icons and Vertical Dividers (Exact match Ảnh 1) */}
            <div className="w-full lg:w-[62%]">
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x rounded-2xl p-2 lg:p-0 ${themeClass(
                  "divide-[#D8B282]/25",
                  "divide-[#D8B282]/35",
                  "divide-yellow-400/30"
                )}`}
              >
                {[
                  {
                    icon: Users2,
                    title: "Thông tin phân tán",
                    desc: "Khó tìm đúng người",
                  },
                  {
                    icon: Clock,
                    title: "Khó duy trì quan hệ",
                    desc: "Thiếu công cụ nhắc nhở và theo dõi tương tác",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Bỏ lỡ cơ hội",
                    desc: "Không kịp nắm bắt cơ hội phù hợp",
                  },
                  {
                    icon: Landmark,
                    title: "Thiếu kết nối thực chất",
                    desc: "Nhiều sự kiện nhưng khó tạo giá trị sau sự kiện",
                  },
                  {
                    icon: BarChart3,
                    title: "Khó đo lường hiệu quả",
                    desc: "Không biết mối quan hệ mang lại giá trị gì",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, y: 22 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                      }}
                      className="px-3 sm:px-4 py-4 sm:py-2 text-center flex flex-col items-center justify-start group"
                    >
                      {/* Circular Gold Icon Frame */}
                      <div
                        className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 shadow-sm ${themeClass(
                          "border-[#D8B282]/60 bg-[#D8B282]/10 text-[#F6E1C3] shadow-[0_0_12px_rgba(216,178,130,0.15)]",
                          "border-[#8C653B]/60 bg-amber-50 text-[#78350F] shadow-[0_0_10px_rgba(180,130,60,0.1)]",
                          "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                        )}`}
                      >
                        <Icon className="w-5 h-5 stroke-[1.8]" />
                      </div>

                      {/* Main Title (Tên vấn đề) */}
                      <h3
                        className={`text-sm sm:text-[14px] font-bold leading-snug mb-1.5 transition-colors ${themeClass(
                          "text-white group-hover:text-[#F6E1C3]",
                          "text-[#0F172A] group-hover:text-[#78350F]",
                          "text-white"
                        )}`}
                      >
                        {item.title}
                      </h3>

                      {/* Subtitle (Mô tả chi tiết) */}
                      <p
                        className={`text-[12px] leading-relaxed font-normal ${themeClass(
                          "text-[#D4C3A3]/80",
                          "text-slate-600",
                          "text-yellow-100/90"
                        )}`}
                      >
                        {item.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <OrganicCurvedDivider reverse variant="wave" />

      {/* =========================================================================
          3. SECTION 2: THÁCH THỨC — ANIMATION ĐÈN TREO (HANGING PENDANT LAMPS)
             DEDICATED LIGHT THEME BACKGROUND & HIGH CONTRAST TYPOGRAPHY
          ========================================================================= */}
      <CosmicQuantumPortalSection
        id="challenges"
        hudCode="SEC_02 // SYSTEM_DIAGNOSTICS"
        hudTitle="CHALLENGES_MATRIX"
        shape="diagonal"
        transitionVariant="slide-left"
      >
      <section
        className={`py-28 relative z-10 border-t transition-colors duration-500 overflow-hidden ${themeClass(
          "border-[#D8B282]/30",
          "border-[#D8B282]/30",
          "border-yellow-400/30"
        )}`}
      >
        {/* Dedicated 3-Theme Multi-Layer Atmosphere Background with Smart City Towers */}
        <SectionAtmosphereBackground themeMode={themeMode} sectionId="challenges" />

        {/* Futuristic Industrial Steel Truss Suspension Beam with Riveted Nodes */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-r from-transparent via-[#D8B282]/25 to-transparent pointer-events-none z-20 flex items-center justify-around px-8 border-b border-[#D8B282]/30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5 opacity-70">
              <span className="w-2 h-2 rounded-xs bg-[#F6E1C3] rotate-45 shadow-[0_0_8px_#F6E1C3]" />
              <span className="w-12 h-[1px] bg-[#D8B282]/40" />
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`inline-block text-xs font-black tracking-[0.2em] uppercase ${themeClass("text-[#D8B282]", "text-[#78350F]", "text-yellow-300")}`}
            >
              NHIỀU TỔ CHỨC VẪN ĐANG GẶP NHỮNG VẤN ĐỀ NÀY
            </motion.div>
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-sans font-black tracking-tight leading-tight ${themeClass("text-slate-100", "text-[#0F172A]", "text-white")}`}
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              <KineticWords text="Quản lý quan hệ kinh doanh" delay={0.1} /> <br />
              <span className={`font-black ${themeClass(
                "bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282] bg-clip-text text-transparent",
                "bg-gradient-to-r from-[#78350F] via-[#B45309] to-[#D97706] bg-clip-text text-transparent",
                "text-yellow-300"
              )}`}>
                <KineticWords text="vẫn còn nhiều thách thức" delay={0.3} />
              </span>
            </h2>
            <motion.p
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
              className={`text-sm sm:text-base leading-relaxed font-medium ${themeClass("text-[#D4C3A3]/85", "text-slate-700", "text-yellow-100")}`}
            >
              Các hiệp hội và doanh nghiệp SME đang đối mặt với những rào cản lớn trong việc số hóa mạng lưới, gắn kết hội viên và chuyển hóa giao lưu thành hợp đồng giá trị.
            </motion.p>
          </div>

          {/* 5 AI Quantum Diagnostic Probes / Bottleneck Scanners (Nâng cấp x10: Dẹp bỏ đèn treo quê mùa) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-0 items-start">
            {HANGING_CHALLENGES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="animate-pendulum-lamp flex flex-col items-center group cursor-pointer"
                  style={{
                    animationDuration: item.swayDuration,
                    animationDelay: item.swayDelay,
                  }}
                >
                  {/* Maglev Quantum Rail Anchor */}
                  <div className="flex items-center gap-1 -mt-2 z-20">
                    <div className="w-10 h-3 rounded-full bg-gradient-to-r from-[#0B132B] via-[#D8B282] to-[#0B132B] border border-[#F6E1C3] shadow-[0_0_12px_#D8B282] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>

                  {/* Fiber-Optic Diagnostic Conduit */}
                  <div className="w-[2px] h-14 sm:h-16 bg-gradient-to-b from-[#F6E1C3] via-amber-400 to-[#D8B282] relative z-10">
                    <span className="absolute top-1/2 -left-1 w-2.5 h-2.5 rounded-full bg-white blur-[0.5px] shadow-[0_0_10px_#FFFFFF] animate-ping" />
                  </div>

                  {/* High-Tech AI Optical Scanner Drone Head */}
                  <div className="relative z-20 flex flex-col items-center -mt-0.5">
                    <div className="w-10 h-3.5 rounded-t-lg bg-gradient-to-b from-[#FFF5E6] via-[#D8B282] to-[#8C653B] border border-white/60 shadow-md flex items-center justify-center">
                      <span className="text-[7px] font-mono font-black text-slate-950 uppercase">{item.sensorCode}</span>
                    </div>
                    <div className="w-16 h-6 rounded-b-2xl bg-gradient-to-b from-[#0F1B36] via-[#1A2C54] to-[#080E1C] border border-[#F6E1C3]/80 shadow-[0_0_20px_rgba(216,178,130,0.6)] relative flex items-center justify-around px-2">
                      {/* Active AI Optical Sensor Eye */}
                      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-white shadow-[0_0_15px_#FFFFFF,0_0_25px_#F6E1C3] animate-pulse flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>

                  {/* Active Conical Holographic Laser Scanner Projection */}
                  <div className="w-full h-14 -mt-1 pointer-events-none relative overflow-hidden flex justify-center">
                    <svg viewBox="0 0 200 80" className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <defs>
                        <linearGradient id={`scannerConeGrad-${idx}`} x1="50%" y1="0%" x2="50%" y2="100%">
                          <stop offset="0%" stopColor="#F6E1C3" stopOpacity="0.9" />
                          <stop offset="40%" stopColor="#D8B282" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points="100,0 20,80 180,80" fill={`url(#scannerConeGrad-${idx})`} />
                      <line x1="40" y1="50" x2="160" y2="50" stroke="#F6E1C3" strokeWidth="1.2" strokeOpacity="0.8" className="animate-pulse" />
                    </svg>
                  </div>

                  {/* The AI Diagnostic Telemetry Card */}
                  <div
                    className={`w-full p-5 sm:p-6 rounded-2xl border-2 text-left relative overflow-hidden shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 ${themeClass(
                      "border-[#D8B282]/50 bg-gradient-to-b from-[#0F1B36]/95 via-[#080F22]/98 to-[#040814] text-white group-hover:border-[#F6E1C3] group-hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)]",
                      "border-2 border-[#D8B282]/50 bg-gradient-to-b from-white via-[#FFFDF9] to-[#FBF6EE] text-[#0F172A] shadow-[0_15px_35px_rgba(180,130,60,0.12)] group-hover:border-amber-600 group-hover:shadow-[0_15px_35px_rgba(180,130,60,0.22)]",
                      "border-yellow-400 bg-zinc-950 text-yellow-100"
                    )}`}
                  >
                    {/* Top Laser Edge */}
                    <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#F6E1C3] to-transparent opacity-70 group-hover:opacity-100" />

                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${themeClass(
                        "bg-[#D8B282]/15 border border-[#D8B282]/50 text-[#F6E1C3]",
                        "bg-amber-100 border border-[#D8B282]/50 text-[#78350F]",
                        "bg-yellow-400/20 text-yellow-300"
                      )}`}>
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[9.5px] font-mono font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${themeClass(
                          "border-[#D8B282]/40 bg-[#D8B282]/15 text-[#F6E1C3]",
                          "border-2 border-amber-500 bg-amber-100 text-amber-900",
                          "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                        )}`}>
                          {item.badge}
                        </span>
                        <div className="text-[9px] font-mono font-black text-rose-400 mt-1">
                          {item.metricName}: {item.metricValue}
                        </div>
                      </div>
                    </div>

                    <h3 className={`text-sm sm:text-base font-black mb-2 leading-snug ${themeClass("text-white group-hover:text-[#F6E1C3]", "text-[#0F172A] group-hover:text-[#78350F]", "text-white")}`}>
                      <KineticWords text={item.title} delay={0.15 + idx * 0.08} />
                    </h3>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.2 }}
                      transition={{ duration: 0.45, delay: 0.25 + idx * 0.08 }}
                      className={`text-xs leading-relaxed font-medium ${themeClass("text-[#D4C3A3]/85", "text-slate-700", "text-yellow-100")}`}
                    >
                      {item.desc}
                    </motion.p>

                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-mono font-bold ${themeClass(
                      "border-amber-400/15 text-[#D8B282]/85",
                      "border-[#D8B282]/30 text-[#78350F]",
                      "border-yellow-400/30 text-yellow-300"
                    )}`}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        <span>{item.diagnosticStatus}</span>
                      </span>
                      <span className="text-[9px] text-[#F6E1C3]">[ SCAN_ACTIVE ]</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </CosmicQuantumPortalSection>

      <OrganicCurvedDivider reverse variant="wave" />

      {/* =========================================================================
          4. SECTION 4: HỆ SINH THÁI 8 VỆ TINH LIÊN MINH (CÙNG NHAU TẠO RA GIÁ TRỊ LỚN HƠN)
             DEDICATED ALLIANCE SALON LIGHT THEME BACKGROUND
             ORBIT VORTEX ANIMATES IN FIRST (DELAY 0s), FOLLOWED BY SURROUNDING CONTENT
          ========================================================================= */}
      <CosmicQuantumPortalSection
        id="ecosystem"
        hudCode="SEC_04 // CELESTIAL_ALLIANCE"
        hudTitle="8_SATELLITE_HUBS"
        shape="arch"
        transitionVariant="slide-right"
      >
      <section
        className={`py-28 relative z-10 border-t transition-colors duration-500 overflow-hidden ${themeClass(
          "border-[#D8B282]/30",
          "border-[#D8B282]/30",
          "border-yellow-400/30"
        )}`}
      >
        {/* Dedicated 3-Theme Multi-Layer Atmosphere Background with Cosmic Pyramids & Golden Aurora */}
        <SectionAtmosphereBackground themeMode={themeMode} sectionId="ecosystem" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 4 Cols: Text content directly on background (NO rectangular box/border) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.8 }}
              className={`lg:col-span-4 text-left space-y-6 ${themeClass(
                "text-slate-100",
                "text-slate-900",
                "text-yellow-300"
              )}`}
            >
              <div className={`inline-block text-xs font-black tracking-[0.2em] uppercase ${themeClass("text-[#D8B282] drop-shadow-sm", "text-[#92400E]", "text-yellow-300")}`}>
                HỆ SINH THÁI DOANH NGHIỆP TOÀN DIỆN
              </div>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-sans font-black tracking-tight leading-snug ${themeClass("text-slate-100 drop-shadow-md", "text-[#0F172A]", "text-white")}`}
                style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
              >
                <span className="inline-block whitespace-nowrap">
                  <KineticWords text="Cùng nhau tạo ra" delay={0.1} />
                </span>{" "}
                <br />
                <span className={`font-black inline-block whitespace-nowrap ${themeClass(
                  "bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282] bg-clip-text text-transparent drop-shadow-md",
                  "bg-gradient-to-r from-[#9A3412] via-[#C2410C] to-[#EA580C] bg-clip-text text-transparent",
                  "text-yellow-300"
                )}`}>
                  <KineticWords text="giá trị lớn hơn" delay={0.3} />
                </span>
              </h2>
              <p className={`text-sm leading-relaxed font-medium ${themeClass("text-slate-200 drop-shadow-sm", "text-slate-700 font-semibold", "text-yellow-100")}`}>
                Business Connect gắn kết chặt chẽ hiệp hội, doanh nghiệp, chuyên gia và nhà đầu tư trong một mạng lưới tuần hoàn khép kín.
              </p>

              {/* 3 Metric Rows: Không dùng hình chữ nhật bao quanh, để dạng danh sách chữ thường thanh lịch */}
              <div className="space-y-3 pt-1">
                {[
                  { label: "300+ Hiệp hội ngành nghề", icon: Users },
                  { label: ">10.000 Doanh nghiệp liên kết", icon: Building2 },
                  { label: "8 lĩnh vực kết nối mở rộng quy mô", icon: Zap },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 py-1 ${themeClass(
                        "text-slate-200 drop-shadow-sm",
                        "text-slate-900 font-semibold",
                        "text-yellow-200"
                      )}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#D8B282]/20 flex items-center justify-center text-[#F6E1C3] shrink-0 border border-[#D8B282]/40">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="px-7 py-3.5 rounded-full font-black text-xs tracking-wider uppercase bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 shadow-lg hover:scale-105 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Khám phá hệ sinh thái</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Middle 5 Cols: 8-Satellite Orbital Constellation with Golden Radar - ANIMATES IN FIRST */}
            <motion.div
              initial={{ scale: 0.25, opacity: 0, rotate: -45 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0 }}
              className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] select-none"
              onMouseEnter={() => setOrbitPaused(true)}
              onMouseLeave={() => setOrbitPaused(false)}
            >
              {/* Central Diamond Core */}
              <div className="relative z-20 w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#F6E1C3] via-amber-400 to-[#8C653B] shadow-[0_0_50px_rgba(245,158,11,0.8)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-2 text-center">
                  <Crown className="w-6 h-6 text-[#D8B282]" />
                  <span className="text-[8px] font-mono font-black text-[#F6E1C3] uppercase mt-0.5">
                    DIAMOND CORE
                  </span>
                </div>
              </div>

              {/* 3 Concentric Solid Luminous Orbit Rings (Tuyệt đối không dùng nét đứt) */}
              <div className="absolute w-56 h-56 rounded-full border border-[#D8B282]/50 shadow-[0_0_15px_rgba(216,178,130,0.25)]" />
              <div className="absolute w-72 h-72 rounded-full border-2 border-[#F6E1C3]/40 shadow-[0_0_20px_rgba(246,225,195,0.3)]" />
              <div className="absolute w-88 h-88 rounded-full border border-[#D8B282]/50 shadow-[0_0_25px_rgba(216,178,130,0.25)]" />

              {/* 8 Satellites Rotating with Laser Spoke Web */}
              <div className={`absolute w-88 h-88 rounded-full animate-orbit-spin ${orbitPaused ? "paused-spin" : ""}`}>
                {/* SVG Laser Synapse Web connecting Central Core to 8 Satellites */}
                <svg viewBox="0 0 352 352" className="absolute inset-0 w-full h-full pointer-events-none">
                  {CONSTELLATION_SATELLITES.map((sat, sIdx) => {
                    const angleRad = (sIdx * 45 * Math.PI) / 180;
                    const radius = 160;
                    const sx = 176 + radius * Math.cos(angleRad);
                    const sy = 176 + radius * Math.sin(angleRad);
                    const isSel = activeSatellite === sIdx;
                    return (
                      <g key={`sat-spoke-${sat.id}`}>
                        <line
                          x1="176"
                          y1="176"
                          x2={sx}
                          y2={sy}
                          stroke={isSel ? "#FFFFFF" : "#D8B282"}
                          strokeWidth={isSel ? "2.5" : "1"}
                          strokeOpacity={isSel ? "0.9" : "0.3"}
                          className={isSel ? "filter drop-shadow-[0_0_8px_rgba(246,225,195,1)]" : ""}
                        />
                        {isSel && (
                          <circle cx={(176 + sx) / 2} cy={(176 + sy) / 2} r="3" fill="#F6E1C3" className="animate-ping" />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {CONSTELLATION_SATELLITES.map((sat, sIdx) => {
                  const angleRad = (sIdx * 45 * Math.PI) / 180;
                  const radius = 160;
                  const x = 176 + radius * Math.cos(angleRad) - 24;
                  const y = 176 + radius * Math.sin(angleRad) - 24;
                  const isSel = activeSatellite === sIdx;
                  const Icon = sat.icon;
                  return (
                    <div
                      key={sat.id}
                      onClick={() => setActiveSatellite(sIdx)}
                      className="absolute w-12 h-12 rounded-full cursor-pointer select-none"
                      style={{ left: x, top: y }}
                    >
                      <div className={`animate-orbit-reverse ${orbitPaused ? "paused-spin" : ""}`}>
                        <div
                          className={`w-12 h-12 rounded-full p-0.5 border-2 flex items-center justify-center transition-all duration-300 ${
                            isSel
                              ? "bg-[#D8B282] text-slate-950 border-white ring-4 ring-amber-400/50 scale-115 shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                              : themeClass(
                                  "bg-[#0A1428] text-white border-amber-400/50 hover:border-[#F6E1C3] hover:scale-105",
                                  "bg-white text-slate-800 border-[#D8B282]/60 hover:border-amber-600 hover:scale-105 shadow-md",
                                  "bg-black text-yellow-200 border-yellow-400"
                                )
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right 3 Cols: Active Satellite Info directly on background (NO rectangular box/border) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 1.0 }}
              className="lg:col-span-3 space-y-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono uppercase font-black tracking-widest ${themeClass("text-[#D8B282] drop-shadow-sm", "text-[#78350F]", "text-yellow-300")}`}>
                  LĨNH VỰC #{activeSatellite !== null ? activeSatellite + 1 : 1}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              {activeSatellite !== null && (
                <div className="space-y-2.5">
                  <h3
                    className={`text-2xl font-black font-sans tracking-tight ${themeClass("text-white drop-shadow-md", "text-[#0F172A]", "text-white")}`}
                    style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                  >
                    {CONSTELLATION_SATELLITES[activeSatellite].name}
                  </h3>
                  <p className={`text-sm leading-relaxed font-medium ${themeClass("text-slate-200 drop-shadow-sm", "text-slate-700", "text-yellow-100")}`}>
                    {CONSTELLATION_SATELLITES[activeSatellite].desc}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDemoModalOpen(true)}
                  className="px-7 py-3.5 rounded-full font-black text-xs tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 hover:brightness-105 transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span>Kết nối ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      </CosmicQuantumPortalSection>

      <OrganicCurvedDivider reverse variant="flow" />

      {/* =========================================================================
          5. SECTION: ĐƯỢC TIN TƯỞNG BỞI CÁC HIỆP HỘI VÀ DOANH NGHIỆP
             NHỮNG TỔ CHỨC TIÊN PHONG ĐÃ LỰA CHỌN (IMAGE 1 & 3 SPEC)
             PLACED DIRECTLY BELOW SECTION "CÙNG NHAU TẠO RA GIÁ TRỊ LỚN HƠN"
          ========================================================================= */}
      <CosmicQuantumPortalSection
        id="partners"
        hudCode="SEC_05 // ALLIANCE_TRUST"
        hudTitle="PIONEER_ORGANIZATIONS"
        shape="chamfer"
        transitionVariant="vortex-spiral"
      >
        <BusinessConnectPartnersSection
          themeMode={themeMode}
          onOpenDemo={() => setDemoModalOpen(true)}
        />
      </CosmicQuantumPortalSection>

      <OrganicCurvedDivider variant="crest" />

      

      {/* =========================================================================
          7. SECTION 6: CÂU CHUYỆN THÀNH CÔNG & KHÁCH HÀNG TIÊN PHONG
             DEDICATED REFLECTION POOL LIGHT THEME BACKGROUND
          ========================================================================= */}
      <CosmicQuantumPortalSection
        id="testimonials"
        shape="vault"
        transitionVariant="curtain-overlap"
      >
      <section
        className={`py-28 relative z-10 border-t transition-colors duration-500 overflow-hidden ${themeClass(
          "border-[#D8B282]/30",
          "border-[#D8B282]/30",
          "border-yellow-400/30"
        )}`}
      >
        {/* Dedicated 3-Theme Multi-Layer Atmosphere Background with Crystal Diamond & Beacon Art */}
        <SectionAtmosphereBackground themeMode={themeMode} sectionId="testimonials" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className={`inline-block text-xs font-black tracking-[0.2em] uppercase ${themeClass("text-[#D8B282]", "text-[#78350F]", "text-yellow-300")}`}>
              KẾT NỐI ĐÚNG • TĂNG TRƯỞNG THẬT
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight ${themeClass("text-slate-100", "text-[#0F172A]", "text-white")}`}>
              Tiếng nói từ những <br />
              <span className={`font-black ${themeClass(
                "bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282] bg-clip-text text-transparent",
                "bg-gradient-to-r from-[#78350F] via-[#B45309] to-[#D97706] bg-clip-text text-transparent",
                "text-yellow-300"
              )}`}>
                người tiên phong
              </span>
            </h2>
          </div>

          {/* 3-Avatar Spherical Showcase & Floating Bubbles (Theo đúng phong cách CEO 1983) */}
          <div className="max-w-5xl mx-auto space-y-8">
            {/* 3 Floating Spherical Avatars on Water/Energy Crest */}
            <div className="relative z-10 grid grid-cols-3 gap-4 sm:gap-8 items-end justify-items-center pt-4 pb-2">
              {TESTIMONIALS.map((tItem, tIdx) => {
                const isActive = activeTestimonialIdx === tIdx;
                return (
                  <div key={tItem.id} className="flex flex-col items-center group">
                    <button
                      type="button"
                      onClick={() => setActiveTestimonialIdx(tIdx)}
                      className="relative cursor-pointer transition-all duration-300 focus:outline-none"
                    >
                      {/* Crystal Sphere Glass Outer Shell */}
                      <div
                        className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full p-[3px] transition-all duration-500 transform-gpu ${
                          isActive
                            ? "bg-gradient-to-tr from-[#F6E1C3] via-[#D8B282] to-[#FFFFFF] scale-110 shadow-[0_0_40px_rgba(216,178,130,0.85),inset_0_0_20px_rgba(255,255,255,0.7)] ring-4 ring-[#D8B282]"
                            : "bg-gradient-to-tr from-[#38BDF8]/40 via-[#D8B282]/40 to-white/60 opacity-75 hover:opacity-100 hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                        }`}
                      >
                        {/* Leader Avatar Inside Sphere */}
                        <img
                          src={tItem.avatar}
                          alt={tItem.author}
                          className="w-full h-full rounded-full object-cover shadow-inner group-hover:brightness-110 transition-all"
                        />

                        {/* Top Curved Glass Glare Specular Highlight */}
                        <div className="absolute top-1.5 left-3 right-3 h-5 rounded-t-full bg-gradient-to-b from-white/70 via-white/20 to-transparent pointer-events-none" />

                        {/* Bottom Iridescent Caustic Rim */}
                        <div className="absolute bottom-1 left-3 right-3 h-3 rounded-b-full bg-gradient-to-t from-[#D8B282]/40 to-transparent pointer-events-none" />

                        {/* Verified Status Dot */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D8B282] border-2 border-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                        </div>
                      </div>

                      {/* Active Indicator Wave Ripple under Sphere */}
                      {isActive && (
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 pointer-events-none">
                          <span className="w-2 h-2 rounded-full bg-[#D8B282] animate-ping opacity-90" />
                          <span className="w-4 h-1.5 rounded-full bg-[#F6E1C3] blur-[1px]" />
                        </div>
                      )}
                    </button>

                    {/* Member Name Tag under Sphere */}
                    <div className="mt-3 text-center">
                      <p className={`text-xs sm:text-sm font-black transition-colors ${isActive ? "text-[#D8B282]" : themeClass("text-slate-300", "text-slate-700", "text-white")}`}>
                        {tItem.author}
                      </p>
                      <p className={`text-[10px] font-mono font-medium truncate max-w-[120px] sm:max-w-[160px] ${themeClass("text-slate-400", "text-slate-500", "text-yellow-200")}`}>
                        {tItem.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Indicator Dots */}
            <div className="relative z-10 flex items-center justify-center gap-2 py-1">
              {TESTIMONIALS.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setActiveTestimonialIdx(dotIdx)}
                  className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                    activeTestimonialIdx === dotIdx
                      ? "w-8 bg-gradient-to-r from-[#F6E1C3] to-[#D8B282] shadow-[0_0_12px_rgba(216,178,130,0.8)]"
                      : "w-2 bg-slate-400/40 hover:bg-slate-400/70"
                  }`}
                  aria-label={`Slide ${dotIdx + 1}`}
                />
              ))}
            </div>

            {/* Testimonial Active Card Spotlight (Matching CEO 1983 Format) */}
            <div className={`p-6 sm:p-9 rounded-3xl border-2 shadow-2xl backdrop-blur-2xl relative overflow-hidden text-left transition-all duration-500 ${themeClass(
              "border-[#D8B282]/50 bg-gradient-to-br from-[#0C1226]/95 via-[#070B16]/98 to-[#030610] text-white shadow-[0_20px_60px_rgba(0,0,0,0.8)]",
              "border-2 border-[#D8B282]/60 bg-gradient-to-br from-white via-[#FFFDF9] to-[#FAF4EC] text-[#0F172A] shadow-[0_25px_60px_rgba(180,130,60,0.16)]",
              "border-yellow-400 bg-black text-yellow-300"
            )}`}>
              {/* Top Laser Specular Line */}
              <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#D8B282] to-transparent" />

              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between border-b border-[#D8B282]/30 pb-5 mb-5">
                <div className="flex items-center gap-4">
                  {/* Active Member Square Framed Avatar */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-[2px] bg-gradient-to-tr from-[#F6E1C3] via-[#D8B282] to-[#8C653B] shadow-xl shrink-0">
                    <img
                      src={TESTIMONIALS[activeTestimonialIdx].avatar}
                      alt={TESTIMONIALS[activeTestimonialIdx].author}
                      className="w-full h-full rounded-[14px] object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#D8B282] border-2 border-white flex items-center justify-center">
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-lg sm:text-2xl font-black font-sans tracking-tight ${themeClass("text-white", "text-[#0F172A]", "text-white")}`}
                        style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                      >
                        {TESTIMONIALS[activeTestimonialIdx].author}
                      </h4>
                      <Volume2 className="w-4 h-4 text-[#D8B282] cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                    <p className={`text-xs sm:text-sm font-bold ${themeClass("text-[#D8B282]", "text-[#78350F]", "text-yellow-300")}`}>
                      {TESTIMONIALS[activeTestimonialIdx].role}
                    </p>
                    <p className={`text-[11px] sm:text-xs font-normal ${themeClass("text-slate-300", "text-slate-600", "text-yellow-100")}`}>
                      {TESTIMONIALS[activeTestimonialIdx].company}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  {/* Real-Time Audio Spectrum Waveform Visualizer */}
                  <div className="flex items-center gap-1 h-6 px-3 py-1 rounded-full border border-[#D8B282]/40 bg-black/60 shadow-inner">
                    {[35, 75, 45, 90, 60, 100, 70, 40, 85, 50, 95, 65, 40, 80].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-amber-500 via-[#F6E1C3] to-white rounded-full animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDuration: `${0.5 + (i % 6) * 0.18}s`,
                        }}
                      />
                    ))}
                    <span className="text-[8.5px] font-mono font-bold text-[#F6E1C3] ml-1.5 uppercase tracking-wider">
                      VOICE_AUTH // 96kHz
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full border text-xs font-mono font-black ${themeClass(
                    "border-[#D8B282]/40 bg-[#D8B282]/15 text-[#F6E1C3]",
                    "border-2 border-amber-500 bg-amber-100 text-amber-900",
                    "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                  )}`}>
                    {TESTIMONIALS[activeTestimonialIdx].metric}
                  </span>
                </div>
              </div>

              {/* Quote text */}
              <p className={`text-base sm:text-lg leading-relaxed italic mb-6 font-medium ${themeClass("text-slate-200", "text-slate-800", "text-yellow-100")}`}>
                "{TESTIMONIALS[activeTestimonialIdx].quote}"
              </p>

              {/* Badges footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D8B282]/20 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[#D8B282] font-mono text-[10.5px] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{TESTIMONIALS[activeTestimonialIdx].badge}</span>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10.5px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{TESTIMONIALS[activeTestimonialIdx].stats}</span>
                  </span>
                </div>

                <p className={`text-[11px] italic ${themeClass("text-slate-400", "text-slate-500", "text-yellow-200")}`}>
                  ✨ {TESTIMONIALS[activeTestimonialIdx].highlight}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </CosmicQuantumPortalSection>

      <OrganicCurvedDivider reverse variant="crest" />

      {/* =========================================================================
          8. SECTION 7: FOOTER CTA & REGISTRATION
             POLISHED PORCELAIN & GOLD LIGHT THEME CARD
          ========================================================================= */}
      <CosmicQuantumPortalSection
        id="footer-cta"
        shape="chamfer"
        transitionVariant="curtain-overlap"
      >
      <section
        className={`py-28 relative z-10 border-t transition-colors duration-500 overflow-hidden ${themeClass(
          "border-[#D8B282]/30",
          "border-[#D8B282]/30",
          "border-yellow-400/30"
        )}`}
      >
        {/* Dedicated 3-Theme Multi-Layer Atmosphere Background with Luxury Gold Reactor Grid */}
        <SectionAtmosphereBackground themeMode={themeMode} sectionId="cta" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className={`rounded-3xl border-2 p-6 sm:p-10 md:p-14 text-left relative overflow-hidden shadow-2xl backdrop-blur-2xl ${themeClass(
            "border-[#D8B282]/50 bg-gradient-to-r from-[#0C1226]/95 via-[#070B16]/98 to-[#050811]/95 text-white shadow-[0_20px_70px_rgba(0,0,0,0.85)]",
            "border-2 border-[#D8B282]/60 bg-gradient-to-br from-white via-[#FAF7F2] to-[#F5ECE0] text-[#0F172A] shadow-[0_25px_70px_rgba(180,130,60,0.18)]",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight ${themeClass("text-slate-100", "text-[#0F172A]", "text-white")}`}>
                    Sẵn sàng mở ra <br />
                    <span className={`font-black ${themeClass(
                      "bg-gradient-to-r from-white via-[#F6E1C3] to-[#D8B282] bg-clip-text text-transparent",
                      "bg-gradient-to-r from-[#78350F] via-[#B45309] to-[#D97706] bg-clip-text text-transparent",
                      "text-yellow-300"
                    )}`}>
                      nhiều cơ hội hơn?
                    </span>
                  </h2>
                  <p className={`text-base sm:text-lg font-medium mt-2 max-w-xl ${themeClass("text-[#D4C3A3]/90", "text-slate-700", "text-yellow-100")}`}>
                    Hãy để Business Connect đồng hành cùng hiệp hội hoặc doanh nghiệp của bạn.
                  </p>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 max-w-xl pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${themeClass("text-slate-300", "text-slate-800", "text-yellow-200")}`}>
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        required
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                          "border-[#D8B282]/40 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-amber-400",
                          "border-2 border-amber-400/50 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20",
                          "border-yellow-400 bg-black text-yellow-100"
                        )}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${themeClass("text-slate-300", "text-slate-800", "text-yellow-200")}`}>
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        value={demoForm.phone}
                        onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                        placeholder="0912 345 678"
                        className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                          "border-[#D8B282]/40 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-amber-400",
                          "border-2 border-amber-400/50 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20",
                          "border-yellow-400 bg-black text-yellow-100"
                        )}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${themeClass("text-slate-300", "text-slate-800", "text-yellow-200")}`}>
                        Email doanh nghiệp
                      </label>
                      <input
                        type="email"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        placeholder="ceo@company.vn"
                        className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                          "border-[#D8B282]/40 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-amber-400",
                          "border-2 border-amber-400/50 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20",
                          "border-yellow-400 bg-black text-yellow-100"
                        )}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${themeClass("text-slate-300", "text-slate-800", "text-yellow-200")}`}>
                        Tên Hiệp hội / Doanh nghiệp
                      </label>
                      <input
                        type="text"
                        value={demoForm.org}
                        onChange={(e) => setDemoForm({ ...demoForm, org: e.target.value })}
                        placeholder="Công ty CP..."
                        className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                          "border-[#D8B282]/40 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-amber-400",
                          "border-2 border-amber-400/50 bg-white text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20",
                          "border-yellow-400 bg-black text-yellow-100"
                        )}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 cursor-pointer bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#B88E4C] text-[#050811] hover:brightness-105 shadow-[0_0_25px_rgba(216,178,130,0.4)] disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? "Đang gửi..." : "Đặt demo ngay"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoModalOpen(true)}
                      className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold border transition-all active:scale-95 cursor-pointer ${themeClass(
                        "border-[#D8B282]/40 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-amber-400/60",
                        "border-2 border-[#D8B282]/50 bg-white text-slate-900 hover:bg-amber-50 shadow-sm",
                        "border-yellow-400 bg-black text-yellow-200"
                      )}`}
                    >
                      <span>Liên hệ tư vấn</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Col Badge info */}
              <div className="lg:col-span-4 space-y-4 text-left border-l border-[#D8B282]/30 pl-0 lg:pl-8">
                <div className={`text-xs font-mono font-black tracking-widest uppercase ${themeClass("text-[#D8B282]", "text-[#78350F]", "text-yellow-300")}`}>
                  ĐẶC QUYỀN DOANH NGHIỆP VIP
                </div>
                <h4
                  className={`text-xl font-black font-sans tracking-tight ${themeClass("text-white", "text-[#0F172A]", "text-white")}`}
                  style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
                >
                  Khởi tạo mạng lưới chỉ trong 24 giờ
                </h4>
                <p className={`text-xs leading-relaxed font-medium ${themeClass("text-slate-300", "text-slate-700", "text-yellow-100")}`}>
                  Đội ngũ chuyên gia kỹ thuật của ViOne hỗ trợ số hóa toàn diện danh bạ hội viên, cấu hình thẻ NFC và đào tạo ban thư ký sử dụng phần mềm.
                </p>
                <div className="pt-2">
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${themeClass(
                    "bg-[#D8B282]/10 border-[#D8B282]/40 text-[#F6E1C3]",
                    "bg-amber-100 border-2 border-amber-500 text-amber-950 font-bold",
                    "bg-yellow-400/20 border-yellow-400 text-yellow-200"
                  )}`}>
                    <ShieldCheck className="w-6 h-6 text-[#C29B69] shrink-0" />
                    <div className="text-xs leading-tight font-semibold">
                      Cam kết bảo mật dữ liệu theo tiêu chuẩn quốc tế và thỏa thuận NDA minh bạch.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </CosmicQuantumPortalSection>

      {/* =========================================================================
          9. FOOTER COPYRIGHT & BRAND
          ========================================================================= */}
      <footer className={`py-8 border-t text-xs font-mono transition-colors duration-500 ${themeClass(
        "bg-[#020408] border-white/10 text-slate-400",
        "bg-[#FAF8F5] border-[#D8B282]/30 text-slate-700 font-bold",
        "bg-black border-yellow-400/30 text-yellow-200"
      )}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold">BUSINESS CONNECT VN</span>
            <span>•</span>
            <span>VIONE PLATFORM ECOSYSTEM</span>
          </div>
          <div>© {new Date().getFullYear()} ViConnect. Tất cả các quyền được bảo lưu.</div>
        </div>
      </footer>

      {/* =========================================================================
          MODALS: DEMO BOOKING & 4K VIDEO KYC PLAYER
          ========================================================================= */}
      {/* Demo Request Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className={`relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl text-left ${themeClass(
            "border-[#D8B282]/50 bg-[#070B16] text-white",
            "border-2 border-[#D8B282]/60 bg-white text-slate-900 shadow-2xl",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}>
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3
              className="text-2xl font-black font-sans tracking-tight mb-2"
              style={{ fontFamily: "'Be Vietnam Pro', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              Đăng Ký Trải Nghiệm Demo
            </h3>
            <p className={`text-xs mb-6 font-medium ${themeClass("text-slate-400", "text-slate-600", "text-yellow-100")}`}>
              Điền thông tin để đội ngũ Business Connect thiết lập phiên trải nghiệm giải pháp 1-1 cho tổ chức của bạn.
            </p>
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  placeholder="Ví dụ: Lê Hoàng Long"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                    "border-[#D8B282]/40 bg-white/[0.05] text-white focus:border-amber-400",
                    "border-2 border-amber-400/50 bg-slate-50 text-slate-900 focus:border-amber-600",
                    "border-yellow-400 bg-black text-white"
                  )}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  placeholder="0912 345 678"
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                    "border-[#D8B282]/40 bg-white/[0.05] text-white focus:border-amber-400",
                    "border-2 border-amber-400/50 bg-slate-50 text-slate-900 focus:border-amber-600",
                    "border-yellow-400 bg-black text-white"
                  )}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tên Hiệp hội / Doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  value={demoForm.org}
                  onChange={(e) => setDemoForm({ ...demoForm, org: e.target.value })}
                  placeholder="Hiệp hội Doanh nghiệp ABC..."
                  className={`w-full h-11 px-4 rounded-xl border text-sm font-medium focus:outline-none ${themeClass(
                    "border-[#D8B282]/40 bg-white/[0.05] text-white focus:border-amber-400",
                    "border-2 border-amber-400/50 bg-slate-50 text-slate-900 focus:border-amber-600",
                    "border-yellow-400 bg-black text-white"
                  )}`}
                />
              </div>
              <div className="pt-2">
                <MagneticButton className="w-full">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#F6E1C3] via-[#D8B282] to-[#8C653B] text-slate-950 hover:brightness-105 transition-all shadow-lg cursor-pointer"
                  >
                    {submitting ? "Đang xử lý..." : "Xác Nhận Đặt Lịch Demo"}
                  </button>
                </MagneticButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Video KYC Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-3xl border border-[#D8B282]/50 bg-[#070B16] p-4 sm:p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8B282]/30 mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#D8B282]" />
                <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  DEMO NỀN TẢNG BUSINESS CONNECT 4K ULTRA HD
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#D8B282]/40">
              <video
                ref={modalVideoRef}
                src="/landing/video_vione_kyc.mp4"
                playsInline
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
