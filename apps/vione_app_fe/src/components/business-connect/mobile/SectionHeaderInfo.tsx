import React, { useId, useState } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Bell, 
  ChevronRight 
} from "lucide-react";
import { MobileSearchBar } from "./MobileSearchBar";

const tabs = [
  { id: "network", label: "Mạng lưới" },
  { id: "customers", label: "Khách hàng" },
  { id: "suggestions", label: "Gợi ý (AI)" },
];

// Mock data cho phần gợi ý AI Match (ảnh 2)
const aiMatches = [
  {
    id: "1",
    name: "Vũ Khánh Lin",
    title: "Giám đốc MKT - Ne...",
    days: "110 ngày từ lần gặp...",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Bùi Đức Thắng",
    title: "Giám đốc VH - Thà...",
    days: "92 ngày từ lần gặp...",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  },
];

// Mock data cho danh sách cần giữ kết nối (ảnh 3)
const nurtureConnections = [
  {
    id: "1",
    name: "Vũ Khánh Linh",
    title: "Giám đốc Marketing · NextGen",
    days: "110 ngày chưa liên hệ",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Vũ Khánh Linh",
    title: "Giám đốc Marketing · NextGen",
    days: "110 ngày chưa liên hệ",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    name: "Bùi Đức Thắng",
    title: "Giám đốc Vận hành · Thành Đạt...",
    days: "92 ngày chưa liên hệ",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  },
];

export const SectionHeaderInfo = (): React.ReactElement => {
  const [activeTab, setActiveTab] = useState("network");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchId = useId();

  return (
    <section
      className="flex flex-col items-start gap-4 relative w-full bc-translucent-card text-[var(--bc-mobile-text)] p-4 rounded-2xl"
      aria-labelledby="network-heading"
    >
      {/* ── HEADER ── */}
      <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
          <h1
            id="network-heading"
            className="relative flex items-center self-stretch mt-[-1.00px] [font-family:'Inter-Regular',Helvetica] font-semibold text-[var(--bc-mobile-text,#0F172A)] text-2xl tracking-[0] leading-8"
          >
            Network
          </h1>
        </div>
        <p className="flex items-center gap-2 relative self-stretch w-full flex-[0_0_auto] mt-[-0.5px]">
          <span className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Light',Helvetica] font-medium text-[var(--bc-mobile-muted,#64748B)] text-xs tracking-[0] leading-4 whitespace-nowrap">
            14 kết nối
          </span>
          <span
            className="relative flex items-center w-fit mt-[-1.00px] [font-family:'Inter-Light',Helvetica] font-medium text-[var(--bc-mobile-muted,#64748B)] text-xs tracking-[0] leading-4 whitespace-nowrap"
            aria-hidden="true"
          >
            •
          </span>
          <span className="mt-[-1.00px] [font-family:'Inter-Medium',Helvetica] font-semibold bg-[linear-gradient(135deg,#DFB876_0%,#B8860B_45%,#966A06_70%,#6E4D00_100%)] dark:bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] bg-clip-text text-transparent text-xs leading-4 relative flex items-center w-fit tracking-[0] whitespace-nowrap">
            3 cần chăm sóc
          </span>
        </p>
      </header>

      {/* ── NAV CATEGORIES ── */}
      <nav
        className="flex items-start gap-2 px-0 py-1 relative self-stretch w-full flex-[0_0_auto] overflow-x-auto scrollbar-none"
        aria-label="Network categories"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`all-unset box-border inline-flex h-[34px] px-4 rounded-full border items-center justify-center relative border-solid transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] border-transparent shadow-[0_2px_10px_rgba(201,158,74,0.35)] font-bold"
                  : "bg-[var(--bc-mobile-surface-2)] border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted,#64748B)] hover:border-[var(--bc-mobile-accent)] hover:text-[var(--bc-mobile-text)]"
              }`}
            >
              <span
                className={`[font-family:'Inter-Medium',Helvetica] text-xs text-center leading-4 relative flex items-center w-fit tracking-[0] whitespace-nowrap font-medium ${
                  isActive ? "text-[#050c15] font-bold" : "text-[var(--bc-mobile-muted,#64748B)]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── SEARCH FORM ── */}
      <form
        className="flex items-start gap-2 relative self-stretch w-full flex-[0_0_auto]"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm người, công ty, chức danh..."
        />
        <button
          type="button"
          onClick={() => setIsFilterOpen((currentValue) => !currentValue)}
          aria-label="Mở bộ lọc"
          aria-pressed={isFilterOpen}
          className="flex w-[42px] h-[42px] bg-[var(--bc-mobile-surface-2)] backdrop-blur-md rounded-lg border-[var(--bc-mobile-border)] items-center justify-center relative border border-solid hover:border-[var(--bc-mobile-accent)] transition-colors"
        >
          <SlidersHorizontal className="w-[15px] h-[15px] text-[var(--bc-mobile-muted)]" aria-hidden="true" />
        </button>
      </form>

      {/* ── SECTION 1: AI MATCH – NÊN KẾT NỐI HÔM NAY ── */}
      <section className="flex flex-col items-start gap-3 w-full mt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[var(--bc-mobile-accent)]">
            <Sparkles className="w-[15px] h-[15px] fill-current" />
            <h2 className="[font-family:'Inter-Medium',Helvetica] font-semibold text-[15px] leading-5 tracking-tight text-[var(--bc-mobile-text,#0F172A)]">
              AI Match – Nên kết nối hôm nay
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-7 px-2.5 rounded-full items-center gap-1 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-all cursor-pointer shrink-0"
          >
            Xem tất cả
            <ChevronRight className="w-3 h-3 text-[var(--bc-mobile-accent)]" />
          </button>
        </div>

        {/* Danh sách cuộn ngang */}
        <div className="flex items-stretch gap-3 w-full overflow-x-auto scrollbar-none py-1">
          {aiMatches.map((match) => (
            <div
              key={match.id}
              className="flex items-center gap-3 w-[260px] shrink-0 bg-[var(--bc-mobile-surface)] backdrop-blur-md rounded-2xl p-3 border border-solid border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-colors shadow-xs"
            >
              <img
                className="w-12 h-12 rounded-full object-cover border border-solid border-[var(--bc-mobile-border)]"
                src={match.avatar}
                alt={match.name}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="[font-family:'Inter-Medium',Helvetica] font-semibold text-sm text-[var(--bc-mobile-text,#0F172A)] truncate">
                  {match.name}
                </span>
                <span className="[font-family:'Inter-Light',Helvetica] font-normal text-xs text-[var(--bc-mobile-muted,#64748B)] truncate mt-0.5">
                  {match.title}
                </span>
                <span className="[font-family:'Inter-Medium',Helvetica] font-medium text-xs text-[var(--bc-mobile-accent)] mt-1.5">
                  {match.days}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: CẦN GIỮ KẾT NỐI ── */}
      <section className="flex flex-col items-start gap-3 w-full mt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-[var(--bc-mobile-text)]">
            <Bell className="w-[15px] h-[15px] text-[var(--bc-mobile-accent)]" />
            <h2 className="[font-family:'Inter-Medium',Helvetica] font-semibold text-[15px] leading-5 tracking-tight text-[var(--bc-mobile-text,#0F172A)]">
              Cần giữ kết nối (3)
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex h-7 px-2.5 rounded-full items-center gap-1 text-[11px] font-medium text-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] hover:border-[var(--bc-mobile-accent)] transition-all cursor-pointer shrink-0"
          >
            Xem tất cả
            <ChevronRight className="w-3 h-3 text-[var(--bc-mobile-accent)]" />
          </button>
        </div>

        {/* Danh sách dọc */}
        <div className="flex flex-col w-full bg-[var(--bc-mobile-surface)] border border-[var(--bc-mobile-border)] rounded-2xl overflow-hidden shadow-xs">
          {nurtureConnections.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3.5 hover:bg-[var(--bc-mobile-surface-2)] transition-colors cursor-pointer ${
                index !== nurtureConnections.length - 1 ? "border-b border-solid border-[var(--bc-mobile-border)]" : ""
              }`}
            >
              <img
                className="w-11 h-11 rounded-full object-cover border border-solid border-[var(--bc-mobile-border)]"
                src={item.avatar}
                alt={item.name}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="[font-family:'Inter-Medium',Helvetica] font-semibold text-sm text-[var(--bc-mobile-text,#0F172A)] truncate">
                  {item.name}
                </span>
                <span className="[font-family:'Inter-Light',Helvetica] font-normal text-xs text-[var(--bc-mobile-muted,#64748B)] truncate mt-0.5">
                  {item.title}
                </span>
                <span className="[font-family:'Inter-Light',Helvetica] font-medium text-xs text-[var(--bc-mobile-accent)] mt-1">
                  {item.days}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--bc-mobile-muted)] shrink-0" />
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};
