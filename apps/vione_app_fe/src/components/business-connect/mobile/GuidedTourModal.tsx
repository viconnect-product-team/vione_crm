import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X, Check } from "lucide-react";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon?: string;
  position?: "top" | "bottom" | "auto";
}

interface GuidedTourModalProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  storageKey?: string;
}

export function GuidedTourModal({
  steps,
  isOpen,
  onClose,
  storageKey = "vione_guided_tour_completed",
}: GuidedTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 375,
    height: typeof window !== "undefined" ? window.innerHeight : 667,
  });

  const step = steps[currentStep];

  // Calculate and update target element bounding box
  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 250);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateTargetRect();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateTargetRect, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
    onClose();
  };

  if (!isOpen || !step) return null;

  const padding = 6;
  const targetTop = targetRect ? Math.max(0, targetRect.top - padding) : 0;
  const targetLeft = targetRect ? Math.max(0, targetRect.left - padding) : 0;
  const targetWidth = targetRect ? targetRect.width + padding * 2 : 0;
  const targetHeight = targetRect ? targetRect.height + padding * 2 : 0;

  const spaceBelow = windowDimensions.height - (targetTop + targetHeight);
  const isBottom = spaceBelow >= 220 || targetTop < 200;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto select-none transition-all duration-300">
      {/* Dark SVG Backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        <defs>
          <mask id="tour-vione-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetLeft}
                y={targetTop}
                width={targetWidth}
                height={targetHeight}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 12, 21, 0.78)"
          mask="url(#tour-vione-mask)"
        />
      </svg>

      {/* Pulsing Gold Halo around the highlighted element */}
      {targetRect && (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: targetTop,
            left: targetLeft,
            width: targetWidth,
            height: targetHeight,
            boxShadow: "0 0 0 3px #D8B282, 0 0 20px rgba(216, 178, 130, 0.55)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl border-2 border-[#F6E1C3] animate-ping opacity-60 pointer-events-none" />
        </div>
      )}

      {/* Coachmark Tooltip Box */}
      <div
        className="absolute left-4 right-4 max-w-[420px] mx-auto z-10 transition-all duration-300 ease-out"
        style={{
          top: targetRect
            ? isBottom
              ? Math.min(windowDimensions.height - 240, targetTop + targetHeight + 14)
              : Math.max(16, targetTop - 210)
            : "40%",
        }}
      >
        <div className="rounded-3xl border border-[#D8B282]/40 bg-[#0A1224]/95 backdrop-blur-xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white relative">
          {/* Header Row: Step counter badge + Close */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] shadow-xs">
                BƯỚC {currentStep + 1} / {steps.length}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-200/90 font-medium">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Chỉ dẫn ViOne</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng hướng dẫn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5 mb-4">
            <h3 className="text-base font-black text-white flex items-center gap-2 leading-tight">
              {step.icon && <span className="text-lg">{step.icon}</span>}
              <span>{step.title}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Progress dots & Actions Row */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentStep
                      ? "w-5 bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_100%)]"
                      : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Lùi</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] text-xs font-black uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#050c15]" />
                    <span>Bắt đầu ngay</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp theo</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#050c15]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
