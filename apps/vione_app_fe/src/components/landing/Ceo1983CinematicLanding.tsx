import React, { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Volume2,
  VolumeX,
  Shield,
  Award,
  ChevronDown,
  Layers,
  Crown,
  ExternalLink,
  Users,
  TrendingUp,
  Globe,
  Anchor,
  Wind,
  Sun,
  Waves,
} from "lucide-react";

export function Ceo1983CinematicLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [audioActive, setAudioActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Track overall scroll progress across the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scene navigation tracking
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.16) setActiveScene(0); // Sky
      else if (latest < 0.33) setActiveScene(1); // Birds
      else if (latest < 0.50) setActiveScene(2); // Kites
      else if (latest < 0.67) setActiveScene(3); // Villas
      else if (latest < 0.83) setActiveScene(4); // Blue Water
      else setActiveScene(5); // Underwater
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Ambient sound synthesizer using Web Audio API (no external file required)
  const toggleAmbientSound = () => {
    if (!audioActive) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Gentle pink-noise / wind / oceanic breeze simulation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();

        setAudioActive(true);
      } catch {
        setAudioActive(false);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setAudioActive(false);
    }
  };

  const sceneTitles = [
    { num: "01", name: "BẦU TRỜI", sub: "The Dawn Sky" },
    { num: "02", name: "ĐÀN CHIM", sub: "Flock of Freedom" },
    { num: "03", name: "CÁNH DIỀU", sub: "Soaring Above Storm" },
    { num: "04", name: "DINH THỰ", sub: "Empire Horizon" },
    { num: "05", name: "MẶT NƯỚC", sub: "Azure Sea Surface" },
    { num: "06", name: "THỦY CUNG", sub: "The Abyssal Apex" },
  ];

  const scrollToPercent = (pct: number) => {
    if (!containerRef.current) return;
    const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: totalHeight * pct,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#000d20] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden"
    >
      {/* ══════════════════════════════════════════════════════════════════════════
          FIXED TOP BAR: CEO 1983 LUXURY GLASS HEADER
      ══════════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#001026]/70 backdrop-blur-md border-b border-white/10 transition-all">
        <Link to="/association" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-[#003B95] p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#001433]">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm sm:text-base font-black tracking-wider text-amber-300">
                CLB DOANH NHÂN CEO 1983
              </span>
              <span className="hidden sm:inline-block rounded-full bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[9px] font-extrabold text-amber-300 tracking-wider">
                CINEMATIC
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Hội Tụ Tinh Hoa · Lan Tỏa Giá Trị
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleAmbientSound}
            title={audioActive ? "Tắt âm thanh môi trường" : "Bật âm thanh điện ảnh"}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {audioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span className="hidden md:inline text-[11px] font-semibold text-amber-300">Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden md:inline text-[11px] font-medium">Sound OFF</span>
              </>
            )}
          </button>

          <Link
            to="/association"
            className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
          >
            Vào App Hiệp Hội
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════════
          RIGHT FLOATING SCENE TRACKER (CURVED BULLETS)
      ══════════════════════════════════════════════════════════════════════════ */}
      <aside className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3 p-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 shadow-2xl">
        {sceneTitles.map((s, idx) => (
          <button
            key={s.num}
            type="button"
            onClick={() => scrollToPercent(idx * 0.18)}
            className={`group relative flex items-center gap-3 px-2 py-1.5 rounded-xl text-left transition-all ${
              activeScene === idx ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full transition-all ${
                activeScene === idx
                  ? "bg-amber-400 shadow-[0_0_10px_#F59E0B] scale-125"
                  : "bg-slate-600 group-hover:bg-slate-400"
              }`}
            />
            <span className="text-[11px] tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap absolute right-6 bg-slate-900/90 border border-white/10 px-2 py-1 rounded-md text-amber-300">
              {s.num} · {s.name}
            </span>
          </button>
        ))}
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 01: THE CELESTIAL SKY (BẦU TRỜI & KHỞI NGUYÊN)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 pt-20 overflow-hidden bg-gradient-to-b from-[#020B18] via-[#001D47] to-[#003B95]">
        {/* Volumetric God-Rays from the Sun */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(245,158,11,0.25)_0%,rgba(0,59,149,0)_70%)] pointer-events-none animate-pulse" />

        {/* Ambient floating cloud silhouettes */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="absolute top-10 left-0 w-full h-96" viewBox="0 0 1440 320" fill="none">
            <path
              fill="rgba(255,255,255,0.06)"
              d="M0,192L48,197.3C96,203,192,213,288,208C384,203,480,181,576,181.3C672,181,768,203,864,197.3C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
          </svg>
          <svg className="absolute top-48 left-0 w-full h-96" viewBox="0 0 1440 320" fill="none">
            <path
              fill="rgba(245,158,11,0.04)"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,122.7C960,149,1056,203,1152,208C1248,213,1344,171,1392,149.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Phân Cảnh 01 · Bầu Trời Khởi Nguyên
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, filter: "blur(12px)", y: 30 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1.4, delay: 0.2 }}
            className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-tight leading-tight"
          >
            KHỞI NGUYÊN BẢN LĨNH 1983
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Nơi quy tụ 500+ chủ doanh nghiệp bản lĩnh sinh năm 1983. Vươn cao tầm nhìn chiến lược,
            kiến tạo chuỗi giá trị thịnh vượng nội khối trong kỷ nguyên số.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={() => scrollToPercent(0.18)}
              className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-7 py-3 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Bắt Đầu Hành Trình Cuộn</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <Link
              to={"/association/login" as any}
              className="rounded-full border border-amber-400/50 bg-white/5 hover:bg-white/10 px-7 py-3 text-sm font-bold text-amber-300 backdrop-blur-sm transition-all hover:border-amber-300"
            >
              Gia Nhập Hiệp Hội
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 text-xs font-semibold tracking-wider animate-bounce">
          <span>CUỘN ĐỂ KHÁM PHÁ</span>
          <ChevronDown className="h-4 w-4 text-amber-400" />
        </div>

        {/* Organic Curved Cloud Transition (NO RECTANGLE) */}
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-24 sm:h-36"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
              fill="#002B70"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 02: THE FLOCK OF BIRDS (ĐÀN CHIM SẢI CÁNH VƯƠN CAO)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 py-24 bg-gradient-to-b from-[#002B70] via-[#003B95] to-[#052F6E] overflow-hidden">
        {/* Animated Multi-Layer SVG Bird Flock */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Distant Flock */}
          <div className="absolute top-20 right-12 opacity-30 animate-pulse">
            <svg width="180" height="90" viewBox="0 0 100 50" fill="currentColor" className="text-amber-200">
              <path d="M10,25 Q20,10 30,25 Q40,10 50,25 Q35,28 30,25 Q25,28 10,25 Z" />
              <path d="M55,35 Q62,24 70,35 Q78,24 85,35 Q75,37 70,35 Q65,37 55,35 Z" />
              <path d="M35,15 Q40,8 45,15 Q50,8 55,15 Q47,17 45,15 Q42,17 35,15 Z" />
            </svg>
          </div>

          {/* Mid-ground Soaring Eagles */}
          <div className="absolute top-1/3 left-10 opacity-70">
            <svg width="240" height="120" viewBox="0 0 140 70" fill="currentColor" className="text-amber-400/80">
              <path d="M15,35 Q45,5 70,35 Q95,5 125,35 Q95,42 70,38 Q45,42 15,35 Z" />
            </svg>
          </div>

          {/* Foreground Hero Silhouette */}
          <div className="absolute bottom-32 right-1/4 opacity-40">
            <svg width="320" height="160" viewBox="0 0 180 90" fill="currentColor" className="text-white/20">
              <path d="M20,45 Q60,10 90,45 Q120,10 160,45 Q120,55 90,50 Q60,55 20,45 Z" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest mb-4">
            <Wind className="h-3.5 w-3.5 text-amber-400" />
            Phân Cảnh 02 · Đàn Chim Sải Cánh
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-white">
            SẢI CÁNH VƯƠN XA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
              KẾT NỐI KHÔNG BIÊN GIỚI
            </span>
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Một cánh chim đơn độc dễ bị quật ngã trước bão dông, nhưng một đàn đại bàng cùng chung
              chí hướng sẽ tạo nên luồng nâng khí động học đưa cả tập thể vút bay qua mọi tầng mây.
              Đó là triết lý gắn kết bền vững của CLB Doanh Nhân CEO 1983.
            </p>

            {/* Organic Curved Card */}
            <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 text-amber-300 font-bold text-sm mb-3">
                <Shield className="h-5 w-5 text-amber-400" />
                <span>NGUYÊN LÝ ĐỘI HÌNH V</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                Khi các doanh nghiệp hội viên cùng hợp tác nội khối, lực cản cạnh tranh thị trường giảm
                đến 71%, mở ra sức mạnh cộng hưởng gấp nhiều lần quy mô độc lập.
              </p>
            </div>
          </div>
        </div>

        {/* Organic Wave Transition into Kites */}
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-24 sm:h-36"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C200,10 400,110 600,40 C800,-30 1000,90 1200,30 L1200,120 L0,120 Z"
              fill="#06224D"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 03: THE KITES (CÁNH DIỀU NGƯỢC GIÓ)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 py-24 bg-gradient-to-b from-[#06224D] via-[#081B3A] to-[#0A1A3A] overflow-hidden">
        {/* Floating Vietnamese Kites with silk tails */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main Hero Kite */}
          <div className="absolute top-16 right-10 sm:right-32 animate-[bounce_6s_ease-in-out_infinite]">
            <svg width="220" height="260" viewBox="0 0 120 160" fill="none">
              {/* Kite Body Diamond */}
              <polygon points="60,10 110,60 60,110 10,60" fill="url(#kiteGrad)" stroke="#F59E0B" strokeWidth="2" />
              {/* Spine & Cross spar */}
              <line x1="60" y1="10" x2="60" y2="110" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="10" y1="60" x2="110" y2="60" stroke="#F59E0B" strokeWidth="1.5" />
              {/* Fluttering Ribbon Tail */}
              <path
                d="M60,110 Q80,125 50,140 Q75,155 60,170 Q45,185 70,200"
                stroke="#F59E0B"
                strokeWidth="2.5"
                fill="none"
              />
              <defs>
                <linearGradient id="kiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#003B95" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Secondary Kite */}
          <div className="absolute bottom-20 left-12 opacity-60">
            <svg width="140" height="180" viewBox="0 0 120 160" fill="none">
              <polygon points="60,10 100,50 60,90 20,50" fill="rgba(245,158,11,0.3)" stroke="#FBBF24" strokeWidth="1.5" />
              <path d="M60,90 Q70,110 50,130 Q65,145 55,160" stroke="#FBBF24" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest mb-4">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            Phân Cảnh 03 · Cánh Diều Ngược Gió
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-white">
            GIÓ CÀNG NGƯỢC <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              CÁNH DIỀU CÀNG BAY CAO
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Thương trường biến động không phải là rào cản, mà chính là bệ phóng tôi luyện ý chí.
            Doanh nhân CEO 1983 biến mọi cơn gió ngược thành lực đẩy đưa con thuyền doanh nghiệp bứt phá
            đỉnh cao.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 backdrop-blur-md">
              <span className="text-2xl font-black text-amber-400">100%</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Kiên định vượt qua suy thoái</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 backdrop-blur-md">
              <span className="text-2xl font-black text-amber-400">500+</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Doanh nghiệp đồng hành</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-3.5 backdrop-blur-md">
              <span className="text-2xl font-black text-amber-400">10.000+ Tỷ</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">Giá trị xúc tiến giao thương</p>
            </div>
          </div>
        </div>

        {/* Organic Transition into Villas */}
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-24 sm:h-36"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,30 C300,100 500,-20 800,70 C950,110 1100,20 1200,50 L1200,120 L0,120 Z"
              fill="#081426"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 04: THE EMPIRE ON THE HORIZON (DINH THỰ & DI SẢN)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col justify-between px-4 sm:px-12 pt-24 pb-10 bg-gradient-to-b from-[#081426] via-[#051A38] to-[#01224D] overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest mb-4">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            Phân Cảnh 04 · Dinh Thự & Di Sản
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-white">
            KIẾN TẠO DI SẢN BỀN VỮNG
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Không dừng lại ở thành tựu tài chính nhất thời, các thành viên CEO 1983 cùng nhau kiến tạo
            những công trình, doanh nghiệp và giá trị trường tồn cùng thời gian.
          </p>
        </div>

        {/* Horizon Architectural Silhouettes in Bottom 1/4 Viewport */}
        <div className="relative w-full max-w-6xl mx-auto mt-12 z-10">
          <div className="relative h-44 sm:h-64 w-full flex items-end justify-center overflow-hidden">
            {/* Background Villa and Skyline Silhouettes */}
            <svg
              className="w-full h-full text-[#030F1E] drop-shadow-[0_-5px_15px_rgba(245,158,11,0.15)]"
              viewBox="0 0 1000 250"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              {/* Skyline & Modern Villa geometry */}
              <polygon points="50,250 50,150 120,110 190,150 190,250" />
              <polygon points="170,250 170,120 280,120 280,250" />
              <polygon points="260,250 260,80 340,80 340,250" />
              <polygon points="360,250 360,160 420,130 480,160 480,250" />
              <polygon points="460,250 460,100 580,100 580,250" />
              <polygon points="560,250 560,60 640,60 640,250" />
              <polygon points="660,250 660,140 750,140 750,250" />
              <polygon points="730,250 730,90 820,90 820,250" />
              <polygon points="840,250 840,150 920,110 980,150 980,250" />
            </svg>

            {/* Glowing Golden Windows */}
            <div className="absolute bottom-12 left-1/4 h-3 w-6 bg-amber-400/80 rounded-xs blur-[1px] shadow-[0_0_12px_#F59E0B]" />
            <div className="absolute bottom-20 left-1/3 h-4 w-4 bg-amber-300/90 rounded-xs blur-[1px] shadow-[0_0_10px_#F59E0B]" />
            <div className="absolute bottom-16 right-1/3 h-3 w-8 bg-amber-400/80 rounded-xs blur-[1px] shadow-[0_0_12px_#F59E0B]" />
            <div className="absolute bottom-24 right-1/4 h-5 w-5 bg-amber-200 rounded-xs blur-[1px] shadow-[0_0_15px_#F59E0B]" />
          </div>
        </div>

        {/* Organic Coastline Wave Transition into Sea */}
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-24 sm:h-36"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,45 C150,120 400,-10 650,70 C900,140 1050,10 1200,60 L1200,120 L0,120 Z"
              fill="#003580"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 05: THE SURFACE OF THE BLUE WATER (MẶT NƯỚC ĐẠI DƯƠNG)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 py-24 bg-gradient-to-b from-[#003580] via-[#004A99] to-[#002855] overflow-hidden">
        {/* Sun Caustics and Water Surface Reflection */}
        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen">
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.4)_0%,transparent_60%)] animate-pulse" />
        </div>

        {/* Ripple Wave SVG Lines */}
        <div className="absolute top-1/4 left-0 w-full opacity-40 pointer-events-none">
          <svg className="w-full h-32" viewBox="0 0 1200 100" fill="none">
            <path
              d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50"
              stroke="rgba(56,189,248,0.6)"
              strokeWidth="2"
            />
            <path
              d="M0,70 Q150,40 300,70 T600,70 T900,70 T1200,70"
              stroke="rgba(245,158,11,0.4)"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1 text-xs font-bold text-sky-300 uppercase tracking-widest mb-4">
            <Waves className="h-3.5 w-3.5 text-sky-400" />
            Phân Cảnh 05 · Mặt Nước Đại Dương Xanh
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black leading-tight text-white">
            ĐỐI DIỆN ĐẠI DƯƠNG XANH <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-200 to-amber-300">
              VƯỢT SÓNG LỚN, ĐÓN CƠ HỘI LỚN
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed">
            Mặt biển phẳng lặng không tạo nên thủy thủ tài ba. Chỉ những người dám căng buồm ra khơi,
            đối diện với những ngọn sóng dữ mới có thể chạm tới những vùng đất hứa màu mỡ.
          </p>

          <div className="mt-10">
            <button
              type="button"
              onClick={() => scrollToPercent(0.85)}
              className="group inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-500/20 hover:bg-sky-500/30 px-6 py-3 text-sm font-bold text-sky-200 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>Lặn Xuống Thủy Cung Sâu Thẳm</span>
              <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Underwater Plunge Transition Wave (DARK WATER IMMERSION) */}
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-none z-20 pointer-events-none">
          <svg
            className="relative block w-full h-28 sm:h-44"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,60 C250,140 500,0 750,90 C1000,160 1100,20 1200,50 L1200,120 L0,120 Z"
              fill="#00142E"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 06: THE ABYSSAL REALM & SHARK METAPHOR (THỦY CUNG & CÁ MẬP)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-12 py-32 bg-gradient-to-b from-[#00142E] via-[#000D20] to-[#000511] overflow-hidden">
        {/* Volumetric Caustic Light Rays Slicing Through the Depths */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute -top-40 left-1/4 w-32 h-[800px] bg-gradient-to-b from-sky-400/40 via-sky-300/10 to-transparent rotate-12 blur-md" />
          <div className="absolute -top-40 left-1/2 w-48 h-[900px] bg-gradient-to-b from-amber-300/30 via-sky-300/10 to-transparent -rotate-6 blur-lg" />
          <div className="absolute -top-40 right-1/4 w-36 h-[850px] bg-gradient-to-b from-sky-400/30 via-sky-300/5 to-transparent rotate-18 blur-md" />
        </div>

        {/* Rising Air Bubbles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-10 left-[15%] h-3 w-3 rounded-full bg-white/40 blur-[0.5px] animate-bounce" />
          <div className="absolute bottom-24 left-[35%] h-4 w-4 rounded-full bg-sky-200/50 blur-[0.5px] animate-pulse" />
          <div className="absolute bottom-16 right-[25%] h-2.5 w-2.5 rounded-full bg-white/40 blur-[0.5px] animate-bounce" />
          <div className="absolute bottom-40 right-[40%] h-3.5 w-3.5 rounded-full bg-sky-300/40 blur-[0.5px] animate-pulse" />
        </div>

        {/* Floating Apex Shark Silhouette Metaphor */}
        <div className="absolute top-24 right-10 opacity-25 pointer-events-none animate-[pulse_8s_ease-in-out_infinite]">
          <svg width="360" height="140" viewBox="0 0 200 80" fill="currentColor" className="text-sky-300">
            {/* Elegant hydrodynamic Shark silhouette */}
            <path d="M10,40 Q40,30 90,30 Q120,10 135,15 Q145,25 155,30 Q185,32 195,20 Q190,40 198,60 Q180,48 150,50 Q130,55 110,65 Q100,50 90,50 Q40,50 10,40 Z" />
            <polygon points="90,30 115,10 120,30" />
            <polygon points="100,50 112,68 118,52" />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 backdrop-blur-md px-5 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Anchor className="h-4 w-4 text-amber-400" />
            Phân Cảnh 06 · Đỉnh Cao Thủy Cung & Bản Lĩnh Cá Mập
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-tight leading-tight">
            NƠI NHỮNG CON CÁ MẬP <br />
            CÙNG TẠO SÓNG ĐẠI DƯƠNG
          </h2>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Dưới tầng sâu của đại dương thương trường, chỉ những bộ óc chiến lược sắc bén và quyết đoán
            mới có thể định hình cục diện. CLB Doanh Nhân CEO 1983 — cộng đồng lãnh đạo tinh hoa cùng
            hợp lực thống lĩnh thị trường.
          </p>

          {/* ══════════════════════════════════════════════════════════════════
              THE LEADERS BENEATH THE SURFACE (HỘI TỤ ĐỈNH CAO DƯỚI ĐÁY BIỂN)
              Hierarchy: Ocean environment -> Sharks -> Leaders -> Typography -> CTA
          ══════════════════════════════════════════════════════════════════ */}
          <div className="relative my-12 w-full max-w-4xl mx-auto py-6">
            {/* Background Swimming Sharks Silhouettes */}
            <div className="absolute -top-10 left-4 opacity-20 pointer-events-none animate-[pulse_10s_ease-in-out_infinite]">
              <svg width="240" height="90" viewBox="0 0 200 80" fill="currentColor" className="text-sky-400">
                <path d="M10,40 Q40,30 90,30 Q120,10 135,15 Q145,25 155,30 Q185,32 195,20 Q190,40 198,60 Q180,48 150,50 Q130,55 110,65 Q100,50 90,50 Q40,50 10,40 Z" />
                <polygon points="90,30 115,10 120,30" />
              </svg>
            </div>
            <div className="absolute -bottom-6 right-2 opacity-15 pointer-events-none animate-[pulse_12s_ease-in-out_infinite]">
              <svg width="280" height="110" viewBox="0 0 200 80" fill="currentColor" className="text-sky-300">
                <path d="M10,40 Q40,30 90,30 Q120,10 135,15 Q145,25 155,30 Q185,32 195,20 Q190,40 198,60 Q180,48 150,50 Q130,55 110,65 Q100,50 90,50 Q40,50 10,40 Z" />
                <polygon points="90,30 115,10 120,30" />
              </svg>
            </div>

            {/* Sub-surface Leader Figures */}
            <div className="text-xs uppercase tracking-[0.25em] text-sky-300/70 font-bold mb-6">
              — The Leaders Beneath the Surface —
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8">
              {/* Leader 1: Executive Director */}
              <div className="group relative flex flex-col items-center text-center p-4 rounded-3xl bg-white/[0.04] border border-sky-400/20 backdrop-blur-md transition-transform hover:-translate-y-1.5 duration-500">
                <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-sky-400/50 via-white/20 to-transparent shadow-[0_0_25px_rgba(56,189,248,0.25)] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-[#001D47] flex items-center justify-center text-sky-200">
                    <Shield className="w-8 h-8 text-sky-300" />
                  </div>
                </div>
                <div className="mt-3 text-sm font-extrabold text-white tracking-wide">EXECUTIVE</div>
                <div className="text-[11px] text-sky-300/80 font-medium">Ban Cố Vấn Chiến Lược</div>
              </div>

              {/* Leader 2: CEO (Center elevated in Light Ray) */}
              <div className="group relative flex flex-col items-center text-center p-5 rounded-3xl bg-white/[0.08] border border-amber-400/40 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-transform hover:-translate-y-2 duration-500 md:-translate-y-4">
                <div className="relative w-24 h-24 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-white/40 to-amber-600 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-[#001433] flex items-center justify-center text-amber-300">
                    <Crown className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
                <div className="mt-3 text-base font-black text-amber-300 tracking-wider">CHỦ TỊCH / CEO</div>
                <div className="text-xs text-amber-200/90 font-bold">Ban Điều Hành CLB 1983</div>
              </div>

              {/* Leader 3: General Director */}
              <div className="group relative flex flex-col items-center text-center p-4 rounded-3xl bg-white/[0.04] border border-sky-400/20 backdrop-blur-md transition-transform hover:-translate-y-1.5 duration-500">
                <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-sky-400/50 via-white/20 to-transparent shadow-[0_0_25px_rgba(56,189,248,0.25)] flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-[#001D47] flex items-center justify-center text-sky-200">
                    <TrendingUp className="w-8 h-8 text-sky-300" />
                  </div>
                </div>
                <div className="mt-3 text-sm font-extrabold text-white tracking-wide">TỔNG GIÁM ĐỐC</div>
                <div className="text-[11px] text-sky-300/80 font-medium">Khối Sản Xuất & Thương Mại</div>
              </div>
            </div>
          </div>

          {/* Floating Glass Executive Card Badges */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <div className="rounded-3xl p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl hover:border-amber-400/50 transition-all text-left">
              <Crown className="h-7 w-7 text-amber-400 mb-3" />
              <h3 className="font-bold text-white text-base">Thẻ Hội Viên VIP M1983</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Đặc quyền tham gia các kỳ họp kín Ban Chấp Hành, xúc tiến các gói thầu và đơn hàng nghìn tỷ.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl hover:border-amber-400/50 transition-all text-left">
              <Globe className="h-7 w-7 text-sky-400 mb-3" />
              <h3 className="font-bold text-white text-base">Hệ Sinh Thái Số Toàn Diện</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Danh thiếp số NFC, sàn giao thương B2B, bỏ phiếu kín đại hội và thanh toán hội phí tự động VietQR.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-gradient-to-b from-white/10 to-white/5 border border-white/15 backdrop-blur-xl shadow-2xl hover:border-amber-400/50 transition-all text-left">
              <Users className="h-7 w-7 text-emerald-400 mb-3" />
              <h3 className="font-bold text-white text-base">500+ Bạn Hữu Đồng Niên</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Cùng năm sinh 1983, cùng chí hướng lớn, thấu hiểu và chia sẻ giá trị kinh doanh chân thành.
              </p>
            </div>
          </div>

          {/* Master CTAs */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
            <Link
              to={"/association/login" as any}
              className="rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-8 py-4 text-sm sm:text-base font-black text-slate-950 shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              Đăng Ký Gia Nhập CLB CEO 1983
            </Link>

            <Link
              to="/association"
              className="rounded-full border border-amber-400/50 bg-[#001D47]/80 hover:bg-[#002868] px-8 py-4 text-sm sm:text-base font-bold text-amber-300 backdrop-blur-md shadow-xl transition-all"
            >
              Vào Không Gian Hiệp Hội
            </Link>

            <Link
              to="/card/$code"
              params={{ code: "M1983-007" }}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-6 py-4 text-sm font-semibold text-slate-200 transition-all"
            >
              <span>Xem Danh Thiếp Số Demo</span>
              <ExternalLink className="h-4 w-4 text-amber-400" />
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <footer className="relative z-10 mt-28 pt-8 border-t border-white/10 w-full max-w-5xl mx-auto text-center text-xs text-slate-500">
          <p>© 2026 CLB Doanh Nhân CEO 1983 · Nền tảng số hóa độc lập Hướng 2</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Hotline: 098.333.1983 · Email: btk@ceo1983.vn · Trụ sở: Hà Nội & TP. Hồ Chí Minh
          </p>
        </footer>
      </section>
    </div>
  );
}
