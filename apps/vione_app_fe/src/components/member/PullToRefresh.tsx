import React, { useState, useRef, useEffect, type ReactNode } from "react";
import {
  RotateCw,
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Hand,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";

export interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  enableSwipeNav?: boolean;
  enableReachability?: boolean;
  enableThumbHub?: boolean;
  pathname?: string;
}

/**
 * Dynamic One-Handed Ergonomics & Pull-To-Refresh System.
 * 1. Pull-to-refresh vật lý đàn hồi & rung haptic xúc giác.
 * 2. Cử chỉ vuốt ngang chuyển tab linh hoạt với visual indicators động theo lực kéo.
 * 3. Vuốt mép trái (Edge Swipe Back) quay lại tức thời.
 * 4. Chế độ Reachability (Hạ nửa màn hình 35%) đưa mọi nút trên đỉnh vào tầm ngón tay cái.
 * 5. Phím trợ năng ngón tay cái (Ergonomic Thumb Hub) hỗ trợ thao tác nhanh: Quay lại, Hạ màn hình, Đầu trang, Làm mới.
 */
export function PullToRefresh({
  children,
  onRefresh,
  onSwipeLeft,
  onSwipeRight,
  className = "",
  enableSwipeNav = true,
  enableReachability = true,
  enableThumbHub = true,
  pathname,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull to refresh states
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Dynamic Horizontal Swipe Indicator states
  const [swipeDistanceX, setSwipeDistanceX] = useState(0);
  const [isSwipingX, setIsSwipingX] = useState(false);

  // Dynamic Reachability Mode (Hạ màn hình kiểu iOS)
  const [isReachabilityActive, setIsReachabilityActive] = useState(false);

  // Gesture tracking refs
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isAtTopRef = useRef(true);
  const gestureDirectionRef = useRef<"vertical" | "horizontal" | null>(null);

  const PULL_THRESHOLD = 60; // px kéo xuống để kích hoạt reload
  const MAX_PULL = 95;

  // Haptic feedback
  const triggerHaptic = (ms = 15) => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  // Scroll to top
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      triggerHaptic(10);
      toast.info("Đã cuộn lên đầu trang");
    }
  };

  // Toggle Reachability
  const toggleReachability = () => {
    setIsReachabilityActive((prev) => {
      const next = !prev;
      triggerHaptic(next ? 25 : 15);
      if (next) {
        toast.info("Đã kích hoạt chế độ Một tay (Hạ màn hình)");
      }
      return next;
    });
  };

  useEffect(() => {
    const handler = () => toggleReachability();
    window.addEventListener("vba:toggle_reachability", handler);
    return () => window.removeEventListener("vba:toggle_reachability", handler);
  }, []);

  // Auto dismiss reachability after 10s of inactivity
  useEffect(() => {
    if (!isReachabilityActive) return;
    const t = setTimeout(() => setIsReachabilityActive(false), 10000);
    return () => clearTimeout(t);
  }, [isReachabilityActive]);

  // Instantly reset scroll to top on tab / route switch to prevent scroll jumps
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [pathname]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;

    isAtTopRef.current = container.scrollTop <= 0;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    gestureDirectionRef.current = null;
    setIsSwipingX(false);
    setSwipeDistanceX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    // Xác định hướng cử chỉ sau khi di chuyển > 8px
    if (!gestureDirectionRef.current) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        if (Math.abs(diffX) > Math.abs(diffY) * 1.2) {
          gestureDirectionRef.current = "horizontal";
        } else {
          gestureDirectionRef.current = "vertical";
        }
      }
    }

    // ── GESTURE DỌC: PULL TO REFRESH ──
    if (gestureDirectionRef.current === "vertical" && isAtTopRef.current && diffY > 0) {
      const damped = Math.min(diffY * 0.45, MAX_PULL);
      setPullY(damped);
      setIsPulling(true);

      if (damped >= PULL_THRESHOLD && pullY < PULL_THRESHOLD) {
        triggerHaptic(20);
      }
    }

    // ── GESTURE NGANG: TRACKING VUỐT TAB DYNAMIC ──
    if (enableSwipeNav && gestureDirectionRef.current === "horizontal") {
      setIsSwipingX(true);
      setSwipeDistanceX(diffX);
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (isRefreshing) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;
    const duration = Date.now() - startTimeRef.current;

    setIsSwipingX(false);
    setSwipeDistanceX(0);

    // ── 1. XỬ LÝ CỬ CHỈ NGANG DYNAMIC: CHUYỂN TAB / BACK ──
    if (
      enableSwipeNav &&
      (gestureDirectionRef.current === "horizontal" || Math.abs(diffX) > Math.abs(diffY) * 1.4)
    ) {
      const isQuickSwipe = duration < 350 && Math.abs(diffX) > 40;
      const isDistanceSwipe = Math.abs(diffX) > 65;

      if (isQuickSwipe || isDistanceSwipe) {
        // Cử chỉ vuốt từ mép trái màn hình (Edge Swipe Back)
        if (startXRef.current <= 40 && diffX > 40) {
          triggerHaptic(20);
          if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
          }
        }

        // Vuốt sang trái (Swipe Left -> Chuyển tiếp tab sau)
        if (diffX < -50) {
          triggerHaptic(15);
          if (onSwipeLeft) {
            onSwipeLeft();
          } else {
            window.dispatchEvent(new CustomEvent("vba:swipe_next_tab"));
          }
          return;
        }

        // Vuốt sang phải (Swipe Right -> Lùi về tab trước)
        if (diffX > 50) {
          triggerHaptic(15);
          if (onSwipeRight) {
            onSwipeRight();
          } else {
            window.dispatchEvent(new CustomEvent("vba:swipe_prev_tab"));
          }
          return;
        }
      }
    }

    {/* Vuốt xuống từ mép đáy màn hình (Bottom Edge Swipe Down) để kích hoạt chế độ một tay (Reachability) */}
    if (enableReachability && typeof window !== "undefined") {
      if (isReachabilityActive && diffY < -20) {
        setIsReachabilityActive(false);
        triggerHaptic(15);
        return;
      }
      if (!isReachabilityActive && startYRef.current >= window.innerHeight - 110 && diffY > 30) {
        toggleReachability();
        return;
      }
    }

    // ── 2. XỬ LÝ KÉO DỌC: PULL TO REFRESH ──
    if (isPulling) {
      setIsPulling(false);
      if (pullY >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullY(50);
        triggerHaptic(30);

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            window.dispatchEvent(new Event("vba:refresh_data"));
            await new Promise((res) => setTimeout(res, 750));
          }
          setRefreshSuccess(true);
          triggerHaptic(20);
          toast.success("Đã làm mới dữ liệu thành công!");
        } catch {
          toast.error("Không thể làm mới dữ liệu.");
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setRefreshSuccess(false);
            setPullY(0);
          }, 450);
        }
      } else {
        setPullY(0);
      }
    }
  };

  const progressPct = Math.min(100, Math.round((pullY / PULL_THRESHOLD) * 100));

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ── REACHABILITY OVERLAY (VÙNG TRÊN KHI HẠ MÀN HÌNH) ── */}
      {isReachabilityActive && (
        <div
          onClick={() => setIsReachabilityActive(false)}
          className="absolute inset-x-0 top-0 h-[35vh] z-40 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer transition-opacity animate-in fade-in"
        >
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/20">
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Chạm vùng này để đẩy màn hình lên</span>
          </div>
        </div>
      )}

      {/* ── DYNAMIC HORIZONTAL SWIPE CUE INDICATORS ── */}
      {isSwipingX && Math.abs(swipeDistanceX) > 25 && (
        <div
          className={`pointer-events-none fixed top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-xl backdrop-blur-md border transition-transform ${
            swipeDistanceX < 0
              ? "right-3 bg-amber-500/90 text-white border-amber-400/50 animate-in slide-in-from-right-4"
              : "left-3 bg-[#003B95]/90 text-white border-blue-400/50 animate-in slide-in-from-left-4"
          }`}
          style={{
            transform: `translateY(-50%) scale(${Math.min(1.15, 0.9 + Math.abs(swipeDistanceX) / 250)})`,
          }}
        >
          {swipeDistanceX < 0 ? (
            <>
              <span className="text-[11px] font-bold">Tab tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[11px] font-bold">Tab trước</span>
            </>
          )}
        </div>
      )}

      {/* ── PULL-TO-REFRESH INDICATOR ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `translateY(${pullY > 0 ? pullY - 45 : -60}px)`,
          opacity: pullY > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-white/95 dark:bg-[#0F172A]/95 px-4 py-2 shadow-xl backdrop-blur-md">
          {refreshSuccess ? (
            <>
              <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white shadow-xs">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Đã cập nhật!
              </span>
            </>
          ) : isRefreshing ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin text-[#003B95] dark:text-amber-400" />
              <span className="text-xs font-bold text-[#003B95] dark:text-amber-400">
                Đang làm mới dữ liệu...
              </span>
            </>
          ) : (
            <>
              <div
                className="grid h-5 w-5 place-items-center rounded-full bg-amber-500/15 text-amber-500 transition-transform duration-150"
                style={{
                  transform: `rotate(${pullY >= PULL_THRESHOLD ? 180 : (pullY / PULL_THRESHOLD) * 180}deg)`,
                }}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {pullY >= PULL_THRESHOLD ? "Thả ra để cập nhật" : `Kéo xuống để làm mới (${progressPct}%)`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── NỘI DUNG CHÍNH (ÁP DỤNG REACHABILITY TRANSFORMATION) ── */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`h-full w-full overflow-y-auto overscroll-contain transition-transform ${className}`}
        style={{
          transform: isReachabilityActive
            ? "translateY(35vh)"
            : pullY > 0
            ? `translateY(${pullY * 0.75}px)`
            : "none",
          transitionDuration: isReachabilityActive ? "300ms" : isPulling ? "0ms" : "250ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
