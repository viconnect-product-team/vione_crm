import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutTemplate,
  Check,
  Eye,
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle2,
  Crown,
  Layers,
  Zap,
  RotateCcw,
  X,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader } from "@/components/dashboard/PageKit";
import {
  LANDING_TEMPLATES_CATALOG,
  getActiveLandingTemplateId,
  setActiveLandingTemplateId,
  getLandingTemplate,
  type LandingTemplateMeta,
  type LandingTemplateCategory,
  LANDING_TEMPLATE_CHANGE_EVENT,
} from "@/lib/landing-templates-catalog";

export const Route = createFileRoute("/admin/landing-templates")({
  component: AdminLandingTemplatesPage,
});

const CATEGORIES: { key: "all" | LandingTemplateCategory; label: string }[] = [
  { key: "all", label: "Tất cả Template" },
  { key: "b2b", label: "Doanh Nghiệp B2B" },
  { key: "executive", label: "Doanh Nhân Lãnh Đạo" },
  { key: "association", label: "Hiệp Hội Uy Tín" },
  { key: "tech", label: "Công Nghệ & Tương Lai" },
];

export function AdminLandingTemplatesPage() {
  const [activeTemplateId, setActiveTemplateIdState] = useState<string>("b2b-v1");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | LandingTemplateCategory>("all");
  const [previewingTemplate, setPreviewingTemplate] = useState<LandingTemplateMeta | null>(null);

  // Sync active template on mount and listen to changes
  useEffect(() => {
    setActiveTemplateIdState(getActiveLandingTemplateId());

    const handleTemplateChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTemplateIdState(customEvent.detail);
      } else {
        setActiveTemplateIdState(getActiveLandingTemplateId());
      }
    };

    window.addEventListener(LANDING_TEMPLATE_CHANGE_EVENT, handleTemplateChange);
    window.addEventListener("storage", handleTemplateChange);

    return () => {
      window.removeEventListener(LANDING_TEMPLATE_CHANGE_EVENT, handleTemplateChange);
      window.removeEventListener("storage", handleTemplateChange);
    };
  }, []);

  const activeTemplate = useMemo(() => getLandingTemplate(activeTemplateId), [activeTemplateId]);

  const handleApplyTemplate = (template: LandingTemplateMeta) => {
    setActiveLandingTemplateId(template.id);
    setActiveTemplateIdState(template.id);
    toast.success(`Đã áp dụng thành công template "${template.name}" làm Landing Page chính!`, {
      description:
        "Trang chủ /landing và giao diện khách truy cập đã được chuyển đổi sang mẫu mới.",
      action: {
        label: "Xem ngay",
        onClick: () => window.open("/landing", "_blank"),
      },
    });
  };

  const filteredTemplates = useMemo(() => {
    return LANDING_TEMPLATES_CATALOG.filter((item) => {
      const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.versionLabel.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <AppShell>
      <PageHeader
        title="Quản Lý Template Landing Page"
        subtitle="Kho mẫu giao diện Landing đa phong cách sẵn có — Xem trước trực quan và áp dụng ngay cho toàn hệ thống"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/landing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Xem Landing hiện tại</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        }
      />
      <div className="space-y-6 pb-12">
        {/* 1. Active Template Spotlight Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-amber-500/5 p-5 sm:p-6 shadow-sm">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  ĐANG KÍCH HOẠT LÀM LANDING CHÍNH
                </span>
                <span className="text-xs font-mono font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted/60">
                  {activeTemplate.versionLabel}
                </span>
                <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                  {activeTemplate.categoryName}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {activeTemplate.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {activeTemplate.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setPreviewingTemplate(activeTemplate)}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Xem Demo Nhanh</span>
              </button>
              <a
                href="/landing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Mở Trang Chủ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc tag..."
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 3. Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const isActive = activeTemplateId === template.id;

            return (
              <div
                key={template.id}
                className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 overflow-hidden bg-card/80 backdrop-blur-xs ${
                  isActive
                    ? "border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-md"
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {/* Visual Banner Header */}
                <div
                  className="relative h-36 w-full p-4 flex flex-col justify-between overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${template.themeColor}22 0%, #020617 100%)`,
                  }}
                >
                  {/* Decorative Glow Orb */}
                  <div
                    className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none"
                    style={{ backgroundColor: template.themeColor }}
                  />

                  {/* Header Badges */}
                  <div className="relative flex items-center justify-between gap-2 z-10">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black font-mono tracking-wider uppercase bg-black/50 text-white/90 border border-white/10 backdrop-blur-xs">
                      {template.versionLabel}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {template.badge && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: template.themeColor }}
                        >
                          {template.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Đang dùng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title in Header */}
                  <div className="relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                      {template.categoryName}
                    </span>
                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {template.name}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground/90 italic">
                      "{template.tagline}"
                    </p>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Feature Highlights */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                        Điểm nổi bật:
                      </span>
                      <ul className="space-y-1">
                        {template.features.slice(0, 3).map((feat, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-1.5 text-xs text-foreground/80"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tags Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-border flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewingTemplate(template)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Xem Demo</span>
                    </button>

                    {isActive ? (
                      <div className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Đang Kích Hoạt</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyTemplate(template)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Áp Dụng</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Live Preview Modal Drawer */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-6xl h-[92vh] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden text-left">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 backdrop-blur-xs flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-bold font-mono">
                  {previewingTemplate.versionLabel}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{previewingTemplate.name}</h3>
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                    Đường dẫn demo: {previewingTemplate.previewRoute}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeTemplateId === previewingTemplate.id ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    Đang là Landing chính
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyTemplate(previewingTemplate);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp Dụng Template Này</span>
                  </button>
                )}

                <a
                  href={previewingTemplate.previewRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Mở toàn màn hình tab mới"
                >
                  <Maximize2 className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewingTemplate(null)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Đóng bản xem trước"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Live Preview Frame */}
            <div className="flex-1 w-full bg-slate-950 overflow-hidden relative">
              <iframe
                src={previewingTemplate.previewRoute}
                title={previewingTemplate.name}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
