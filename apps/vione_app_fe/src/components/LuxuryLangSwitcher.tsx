import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", codeLabel: "VI", flag: "🇻🇳" },
  { code: "en", label: "English", codeLabel: "EN", flag: "🇬🇧" },
] as const;

export function LuxuryLangSwitcher({
  className = "",
  variant = "subtle-blue",
}: {
  className?: string;
  variant?: "luxury" | "subtle-blue";
}) {
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  if (variant === "subtle-blue") {
    return (
      <div ref={containerRef} className={`relative inline-block text-left font-sans ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Chọn ngôn ngữ"
          className="flex h-8 items-center gap-1.5 rounded-full border border-[#004B91] bg-white/40 dark:bg-slate-900/40 px-2.5 py-1 text-slate-700 dark:text-slate-200 backdrop-blur-md transition-all hover:bg-white/70 hover:border-blue-600 active:scale-95 cursor-pointer shadow-2xs"
        >
          <span className="text-sm leading-none" role="img" aria-label={activeLang.label}>
            {activeLang.flag}
          </span>
          <span className="text-[11.5px] font-bold tracking-wider text-slate-800 dark:text-slate-100">
            {activeLang.codeLabel}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-[#004B91] dark:text-sky-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 p-1.5 bg-white/95 dark:bg-slate-900/95 border border-[#004B91]/40 rounded-2xl shadow-[0_12px_32px_rgba(0,75,145,0.18)] backdrop-blur-xl z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="space-y-0.5">
              {LANGUAGES.map((l) => {
                const active = lang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      active
                        ? "bg-[#004B91] text-white font-bold shadow-xs"
                        : "text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-[#004B91] dark:hover:text-sky-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="text-[12.5px] font-medium">{l.label}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-white shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left font-sans ${className}`}>
      {/* Luxury Trigger Wrapper */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center cursor-pointer select-none group animate-fade-in"
      >
        {/* Glass Globe Sphere with Gold Gradient Border */}
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#AB6D3C] to-[#FDE6B4] p-[1px] shadow-[0_4px_12px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(242,180,90,0.35)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gradient-to-b dark:from-[#3a3937] dark:to-[#161514] text-slate-800 dark:text-white">
            <span className="text-sm leading-none">{activeLang.flag}</span>
          </div>
        </div>

        {/* Pill Trigger with Gold Gradient Border */}
        <div className="ml-[-8px] flex h-8 items-center bg-gradient-to-r from-[#AB6D3C] to-[#FDE6B4] p-[1px] rounded-r-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(242,180,90,0.35)]">
          <div className="flex h-full items-center gap-1.5 pl-3.5 pr-3 bg-white dark:bg-[#0d0c0b] rounded-r-full text-slate-800 dark:text-[#ffe8c2] group-hover:text-amber-700 dark:group-hover:text-white transition-colors">
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-amber-800 dark:text-[#fcd89a] group-hover:text-amber-900 dark:group-hover:text-white">
              {activeLang.codeLabel}
            </span>
            <ChevronDown className="h-3 w-3 text-amber-600 dark:text-[#f2b45a] transition-transform duration-300 group-hover:translate-y-0.5" />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-48 p-1.5 bg-white border border-amber-200/80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl z-[9999] animate-in fade-in slide-in-from-top-2 duration-150 dark:bg-[#0d1527] dark:border-[#AB6D3C]/30 dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          <div className="space-y-0.5">
            {LANGUAGES.map((l) => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-xs text-left"
                      : "text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-transparent text-left group dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-amber-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className={`text-[12.5px] font-medium transition-colors ${
                      active ? "text-white" : "text-slate-700 group-hover:text-amber-800 dark:text-[#d1c7b7] dark:group-hover:text-white"
                    }`}>
                      {l.label}
                    </span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-white shrink-0" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
