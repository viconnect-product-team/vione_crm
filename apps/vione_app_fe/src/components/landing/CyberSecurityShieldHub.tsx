import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Server,
  Cpu,
  Zap,
  Activity,
  CheckCircle2,
  BadgeCheck,
  Crown,
} from "lucide-react";

interface CyberSecurityShieldHubProps {
  themeMode: "dark" | "light" | "contrast";
}

const SECURITY_NODES = [
  {
    id: 0,
    title: "MÃ HÓA ĐẦU CUỐI",
    spec: "AES-256-GCM • RSA-4096",
    badge: "E2E ZERO-LEAK",
    icon: Lock,
    status: "100% ENCRYPTED",
    color: "#D8B282",
    x: "15%",
    y: "20%",
  },
  {
    id: 1,
    title: "MULTI-CLOUD DỰ PHÒNG",
    spec: "FAILOVER <3S • DUAL REGION",
    badge: "GEO-REDUNDANT",
    icon: Server,
    status: "ACTIVE-ACTIVE",
    color: "#F6E1C3",
    x: "85%",
    y: "20%",
  },
  {
    id: 2,
    title: "TIÊU CHUẨN ISO 27001",
    spec: "SOC 2 TYPE II • BIG-4 AUDIT",
    badge: "GLOBAL CERT",
    icon: ShieldCheck,
    status: "AUDITED 2026",
    color: "#D8B282",
    x: "15%",
    y: "80%",
  },
  {
    id: 3,
    title: "ZERO-TRUST RBAC",
    spec: "IMMUTABLE AUDIT • BIOMETRIC",
    badge: "ROLE-BASED",
    icon: Cpu,
    status: "REAL-TIME SIEM",
    color: "#FFFFFF",
    x: "85%",
    y: "80%",
  },
];

const TELEMETRY_METRICS = [
  { label: "SLA UPTIME", value: "99.99%", sub: "Không gián đoạn", icon: Activity },
  { label: "API LATENCY", value: "38ms", sub: "Edge CDN toàn quốc", icon: Zap },
  { label: "ENCRYPTION KEY", value: "4096-bit", sub: "Quantum-Resistant", icon: Lock },
  { label: "CONCURRENCY", value: "100.000+", sub: "Tải đồng thời Đại hội", icon: Crown },
];

export function CyberSecurityShieldHub({ themeMode }: CyberSecurityShieldHubProps) {
  const [activeNode, setActiveNode] = useState<number>(0);

  const themeClass = (dark: string, light: string, contrast?: string) => {
    if (themeMode === "contrast") return contrast ?? dark;
    if (themeMode === "light") return light;
    return dark;
  };

  const current = SECURITY_NODES[activeNode] || SECURITY_NODES[0];
  const CurrentIcon = current.icon;

  return (
    <div className="w-full relative z-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-mono font-black uppercase tracking-wider mb-2 backdrop-blur-md shadow-md ${themeClass(
            "bg-[#D8B282]/15 border-[#D8B282]/40 text-[#F6E1C3]",
            "bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border-[#F97316]/50 text-[#EA580C] font-black shadow-xs",
            "bg-yellow-400/20 border-yellow-400 text-yellow-300"
          )}`}
        >
          <span className={`w-2 h-2 rounded-full animate-ping ${themeClass("bg-[#D8B282]", "bg-[#EA580C]", "bg-yellow-400")}`} />
          <span>SECURITY 04 • ENTERPRISE SLA 99.99%</span>
        </div>

        <h2
          className={`text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight ${themeClass(
            "text-white",
            "text-[#0F172A]",
            "text-yellow-300"
          )}`}
        >
          HẠ TẦNG BẢO MẬT & PHÒNG THỦ KHÔNG GIAN SỐ
        </h2>

        {/* Dynamic Security Tags (Strictly Brand Colors) */}
        <div className="mt-3 flex flex-wrap justify-center items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-sm flex items-center gap-1.5 ${themeClass(
              "bg-white/10 border-white/20 text-white",
              "bg-white border-[#F59E0B]/40 text-[#0F172A] shadow-xs",
              "bg-white/10 border-white/20 text-white"
            )}`}
          >
            <Lock className={`w-3.5 h-3.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-300")}`} />
            AES-256 ZERO-LEAK
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-sm flex items-center gap-1.5 ${themeClass(
              "bg-[#D8B282]/15 border-[#D8B282]/40 text-[#F6E1C3]",
              "bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border-[#F97316]/40 text-[#EA580C] font-black shadow-xs",
              "bg-yellow-400/20 border-yellow-400 text-yellow-300"
            )}`}
          >
            <Server className={`w-3.5 h-3.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-300")}`} />
            MULTI-CLOUD ACTIVE-ACTIVE
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border shadow-sm flex items-center gap-1.5 ${themeClass(
              "bg-white/10 border-white/20 text-white",
              "bg-white border-[#F59E0B]/40 text-[#0F172A] shadow-xs",
              "bg-white/10 border-white/20 text-white"
            )}`}
          >
            <BadgeCheck className={`w-3.5 h-3.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-300")}`} />
            SOC 2 TYPE II AUDITED
          </span>
        </div>
      </div>

      {/* Main Grid: Holographic 3D Shield Left + Live Telemetry Dashboard Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 7 cols: Holographic Cyber Defense Shield with 4 Satellites */}
        <div
          className={`lg:col-span-7 p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[380px] ${themeClass(
            "border-[#D8B282]/35 bg-[#080E1C]/90",
            "border-2 border-[#F59E0B]/50 bg-white/98 shadow-[0_20px_60px_rgba(245,158,11,0.15)]",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}
        >
          {/* Animated Background Golden Laser Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(216,178,130,0.25)_0%,transparent_70%)]" />
          </div>

          {/* Central 3D Cyber Shield Core */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Concentric Firewall Energy Rings */}
            <div
              className="absolute inset-0 rounded-full border border-[#D8B282]/30 animate-ping pointer-events-none"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute inset-4 rounded-full border border-dashed border-[#D8B282]/40 animate-spin pointer-events-none"
              style={{ animationDuration: "14s" }}
            />
            <div
              className="absolute inset-10 rounded-full border border-[#F6E1C3]/30 animate-spin pointer-events-none"
              style={{ animationDuration: "8s", animationDirection: "reverse" }}
            />

            {/* Center Shield Vault */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-[#1E2E4F] via-[#0B152B] to-[#040815] border-2 border-[#D8B282] flex flex-col items-center justify-center shadow-[0_0_35px_rgba(216,178,130,0.4),inset_0_0_20px_rgba(216,178,130,0.3)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFF5E6] via-[#D8B282] to-[#8C653B] flex items-center justify-center text-slate-950 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-[9px] font-mono font-black tracking-widest text-[#F6E1C3] mt-1 uppercase">
                VAULT E2E
              </span>
            </motion.div>

            {/* 4 Orbital Defense Satellites */}
            {SECURITY_NODES.map((node, idx) => {
              const NodeIcon = node.icon;
              const isSelected = activeNode === idx;

              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(idx)}
                  style={{ left: node.x, top: node.y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-300 group"
                >
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? themeMode === "light"
                          ? "bg-gradient-to-r from-[#FFF7ED] to-[#FEF3C7] border-2 border-[#EA580C] text-[#EA580C] shadow-[0_0_25px_rgba(249,115,22,0.4)] scale-110 ring-2 ring-[#EA580C]/40 font-black"
                          : "bg-[#0F1E3A] border-[#D8B282] text-white shadow-[0_0_25px_rgba(216,178,130,0.6)] scale-110 ring-2 ring-[#D8B282]/50"
                        : themeMode === "light"
                        ? "bg-white border-[#F59E0B]/40 text-[#0F172A] hover:border-[#EA580C] shadow-xs"
                        : "bg-[#070D1B]/90 border-white/15 text-slate-300 hover:border-[#D8B282]"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${themeClass("bg-[#D8B282]/20 text-[#D8B282]", "bg-[#FFF7ED] text-[#EA580C]", "bg-yellow-400/20 text-yellow-300")}`}
                    >
                      <NodeIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] font-black uppercase leading-tight">{node.title}</p>
                      <p className={`text-[8.5px] font-mono ${themeClass("text-[#D8B282]", "text-[#EA580C] font-bold", "text-yellow-300")}`}>{node.badge}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Active Node Telemetry Strip */}
          <div
            className={`mt-4 w-full max-w-md px-4 py-2.5 rounded-2xl border flex items-center justify-between shadow-lg ${themeClass(
              "border-[#D8B282]/35 bg-[#060D1A]/95 text-white",
              "border-2 border-[#F59E0B]/40 bg-white text-[#0F172A] shadow-md"
            )}`}
          >
            <div className="flex items-center gap-2">
              <CurrentIcon className={`w-4 h-4 ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-300")}`} />
              <div className="text-left">
                <p className={`text-xs font-black ${themeClass("text-white", "text-[#0F172A]")}`}>
                  {current.title}
                </p>
                <p className={`text-[9px] font-mono ${themeClass("text-[#D8B282]", "text-[#EA580C] font-bold")}`}>
                  {current.spec}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold flex items-center gap-1.5 ${themeClass("bg-[#D8B282]/20 border border-[#D8B282]/50 text-[#F6E1C3]", "bg-[#FFF7ED] border border-[#F97316]/50 text-[#EA580C] font-black")}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${themeClass("bg-[#D8B282]", "bg-[#EA580C]")}`} />
              {current.status}
            </span>
          </div>
        </div>

        {/* Right 5 cols: 4 Live Telemetry Gauges */}
        <div
          className={`lg:col-span-5 p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl flex flex-col justify-between ${themeClass(
            "border-[#D8B282]/40 bg-[#080E1E]/95 text-white",
            "border-2 border-[#F59E0B]/50 bg-white/98 text-[#0F172A] shadow-[0_20px_60px_rgba(245,158,11,0.15)]",
            "border-yellow-400 bg-black text-yellow-300"
          )}`}
        >
          <div className="flex items-center justify-between border-b border-[#D8B282]/20 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${themeClass("bg-[#D8B282]", "bg-[#EA580C]")}`} />
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${themeClass(
                  "text-[#F6E1C3]",
                  "text-[#EA580C] font-black",
                  "text-yellow-300"
                )}`}
              >
                CHỈ SỐ AN NINH HẠ TẦNG
              </span>
            </div>
            <span className={`text-[9.5px] font-mono font-semibold ${themeClass("text-[#D8B282]", "text-[#D97706] font-bold")}`}>
              AP-SOUTHEAST (HA DUO)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 my-2">
            {TELEMETRY_METRICS.map((met, mIdx) => {
              const MetIcon = met.icon;
              return (
                <div
                  key={mIdx}
                  className={`p-4 rounded-2xl border transition-all ${themeClass(
                    "border-white/10 bg-black/40 hover:border-[#D8B282]/40",
                    "border-[#F59E0B]/40 bg-[#FAF7F2] hover:border-[#EA580C] shadow-xs"
                  )}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-mono ${themeClass(
                        "text-slate-400",
                        "text-[#64748B] font-bold"
                      )}`}
                    >
                      {met.label}
                    </span>
                    <MetIcon className={`w-3.5 h-3.5 ${themeClass("text-[#D8B282]", "text-[#EA580C]")}`} />
                  </div>
                  <p
                    className={`text-2xl font-black font-mono tracking-tight ${themeClass(
                      "text-[#F6E1C3]",
                      "text-[#EA580C]"
                    )}`}
                  >
                    {met.value}
                  </p>
                  <p
                    className={`text-[9.5px] mt-0.5 ${themeClass(
                      "text-slate-400",
                      "text-[#334155] font-medium"
                    )}`}
                  >
                    {met.sub}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Quick Security Guarantee Ribbon */}
          <div
            className={`mt-4 p-3 rounded-2xl border flex items-center gap-2.5 ${themeClass(
              "border-[#D8B282]/30 bg-[#D8B282]/10 text-[#F6E1C3]",
              "border-[#F59E0B]/40 bg-[#FFF7ED] text-[#1E293B] shadow-xs",
              "border-yellow-400 bg-yellow-400/10 text-yellow-300"
            )}`}
          >
            <CheckCircle2 className={`w-5 h-5 shrink-0 ${themeClass("text-[#D8B282]", "text-[#EA580C]", "text-yellow-400")}`} />
            <span className="font-medium text-[11px] leading-relaxed">
              Hạ tầng đáp ứng tiêu chuẩn Ngân hàng & Định chế tài chính quốc gia, dự phòng thảm họa (Disaster Recovery) tự động.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
