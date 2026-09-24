import { useState } from "react";
import { UserPlus, Check, X, Building2, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

interface SuggestedPartner {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  industry: string;
  mutualCount: number;
  matchScore: number;
}

const DEFAULT_SUGGESTIONS: SuggestedPartner[] = [
  {
    id: "p-sug-1",
    name: "Hoàng Việt Anh",
    title: "Phó Tổng Giám Đốc",
    company: "Tập Đoàn FPT",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    industry: "Công nghệ thông tin & Chuyển đổi số",
    mutualCount: 12,
    matchScore: 98,
  },
  {
    id: "p-sug-2",
    name: "Vũ Hải Đăng",
    title: "Chủ tịch HĐQT",
    company: "GreenLogistics Hub",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    industry: "Logistics & Chuỗi cung ứng",
    mutualCount: 8,
    matchScore: 94,
  },
  {
    id: "p-sug-3",
    name: "Ngô Minh Trang",
    title: "Giám Đốc Đầu Tư",
    company: "Dragon Capital Partners",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80",
    industry: "Đầu tư tài chính & Quỹ phát triển",
    mutualCount: 15,
    matchScore: 96,
  },
  {
    id: "p-sug-4",
    name: "Đặng Quang Huy",
    title: "Tổng Giám Đốc",
    company: "EcoSmart Materials",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    industry: "Vật liệu xây dựng sinh thái",
    mutualCount: 6,
    matchScore: 91,
  },
  {
    id: "p-sug-5",
    name: "Trần Bảo Ngọc",
    title: "Sáng Lập & CEO",
    company: "MediCare Pharma Vina",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    industry: "Dược phẩm & Y tế kỹ thuật số",
    mutualCount: 9,
    matchScore: 93,
  },
];

export function NetworkPartnerSuggestionsStrip() {
  const [suggestions, setSuggestions] = useState<SuggestedPartner[]>(DEFAULT_SUGGESTIONS);
  const [connectedIds, setConnectedIds] = useState<Record<string, boolean>>({});

  const handleConnect = (partner: SuggestedPartner) => {
    setConnectedIds((prev) => ({ ...prev, [partner.id]: true }));
    toast.success(`Đã gửi lời mời kết nối đến ${partner.name}!`, {
      description: `${partner.title} · ${partner.company}`,
    });
  };

  const handleDismiss = (partnerId: string) => {
    setSuggestions((prev) => prev.filter((p) => p.id !== partnerId));
  };

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-5 mb-5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5 shadow-xs">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-[13px] font-bold text-[var(--bc-mobile-text,#0F172A)]">
              Gợi ý kết nối doanh nhân
            </h3>
          </div>
          <p className="text-[11px] text-[var(--bc-mobile-muted,#64748B)] mt-0.5">
            Phù hợp năng lực & quan hệ kinh doanh
          </p>
        </div>
        <Link
          to="/connect-app/network"
          search={{ tab: "suggestions" }}
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Horizontal suggestions carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-3.5 px-3.5">
        {suggestions.map((partner) => {
          const isConnected = !!connectedIds[partner.id];

          return (
            <div
              key={partner.id}
              className="relative flex-none w-[175px] rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 flex flex-col justify-between transition-all hover:border-amber-400/50 hover:shadow-xs group"
            >
              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => handleDismiss(partner.id)}
                className="absolute top-2 right-2 p-1 rounded-full text-[var(--bc-mobile-muted)] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Bỏ qua"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div>
                {/* Avatar */}
                <div className="relative mx-auto w-14 h-14 mb-2">
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="w-full h-full rounded-full object-cover border border-amber-400/40 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded-full text-[8.5px] font-black bg-amber-500 text-slate-950 shadow-xs">
                    {partner.matchScore}%
                  </span>
                </div>

                {/* Name & Title */}
                <h4 className="text-[12.5px] font-bold text-[var(--bc-mobile-text,#0F172A)] text-center truncate">
                  {partner.name}
                </h4>
                <p className="text-[10.5px] text-[var(--bc-mobile-muted)] text-center line-clamp-1 mt-0.5">
                  {partner.title}
                </p>
                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300 text-center line-clamp-1">
                  {partner.company}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--bc-mobile-border)] flex flex-col gap-2">
                <p className="text-[9.5px] text-[var(--bc-mobile-muted)] text-center line-clamp-1">
                  👥 {partner.mutualCount} kết nối chung
                </p>

                <button
                  type="button"
                  onClick={() => handleConnect(partner)}
                  disabled={isConnected}
                  className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    isConnected
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-105 shadow-xs active:scale-95"
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Đã gửi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>Kết nối</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
