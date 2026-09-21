import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  Calendar,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listNews, type NewsItem } from "@/lib/member-app.functions";
import { resolveMediaUrl } from "@/lib/api-client";
import { useT, useFmt } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type NewsSearch = {
  tab?: string;
};

export const Route = createFileRoute("/association/news")({
  validateSearch: (search: Record<string, unknown>): NewsSearch => {
    return { tab: typeof search.tab === "string" ? search.tab : undefined };
  },
  component: NewsScreen,
});

export default function NewsScreen() {
  const t = useT();
  const fmt = useFmt();

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const fetchNews = useServerFn(listNews);
  const { data: news = [], loading: newsLoading } = useServerData<NewsItem[]>(() => fetchNews(), []);

  return (
    <div className="vba-animate min-h-screen pb-16">
      <MemberHeader title="Tin tức CLB" back />

      {/* ── DANH SÁCH BÀI VIẾT TIN TỨC CLB ── */}
      <div className="mt-3 space-y-3 px-4">
        {newsLoading && (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#003B95] dark:text-amber-400" />
            <p className="text-[13px]">{t("m.news.loading")}</p>
          </div>
        )}
        {!newsLoading && news.length === 0 && (
          <div className="py-20 text-center space-y-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              {t("m.news.empty")}
            </p>
          </div>
        )}
        {news.map((n: any) => (
          <article
            key={n.id}
            onClick={() => setSelectedNews(n)}
            className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131a27] transition-all duration-200 hover:border-amber-500/50 hover:shadow-lg active:scale-[0.99] cursor-pointer shadow-xs flex flex-row min-h-[140px]"
          >
            {/* 45% Image Column */}
            <div className="relative w-[45%] overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={
                  resolveMediaUrl(n.image) ||
                  n.image ||
                  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80"
                }
                alt={n.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              {n.category && (
                <div className="absolute top-2 left-2">
                  <span className="inline-block rounded-md bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 text-[9.5px] font-black text-slate-950 shadow-xs uppercase tracking-wider">
                    {n.category}
                  </span>
                </div>
              )}
            </div>

            {/* 55% Content Column */}
            <div className="w-[55%] p-3 sm:p-3.5 flex flex-col justify-between">
              <div>
                <h2 className="text-[13px] sm:text-[14px] font-bold leading-snug text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#003B95] dark:group-hover:text-amber-400 transition-colors">
                  {n.title}
                </h2>
                {n.excerpt && (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {n.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2">
                <span className="truncate max-w-[85px]">{fmt.rel(n.time) || n.author}</span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  <Eye className="h-3 w-3 text-[#003B95] dark:text-amber-400 stroke-[2]" /> {n.views}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── ARTICLE DETAIL MODAL ── */}
      {selectedNews && (
        <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto p-0 rounded-3xl !bg-white dark:!bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Modal Image Header */}
            {selectedNews.image && (
              <div className="relative h-44 sm:h-48 w-full overflow-hidden rounded-t-3xl bg-slate-900">
                <img
                  src={resolveMediaUrl(selectedNews.image) || selectedNews.image}
                  alt={selectedNews.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-black/20 to-transparent" />
                {selectedNews.category && (
                  <div className="absolute bottom-3 left-4">
                    <span className="inline-block rounded-full bg-amber-400 text-slate-950 font-black text-[10px] px-3 py-1 uppercase tracking-wider shadow-md">
                      {selectedNews.category}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-5 sm:p-6">
              <DialogTitle className="text-lg sm:text-xl font-extrabold leading-snug text-slate-900 dark:text-white text-left mb-2.5">
                {selectedNews.title}
              </DialogTitle>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                {selectedNews.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#003B95] dark:text-amber-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedNews.author}</span>
                  </div>
                )}
                {selectedNews.time && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#003B95] dark:text-amber-400" />
                    <span>{fmt.rel(selectedNews.time)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#003B95] dark:text-amber-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedNews.views} lượt xem</span>
                </div>
              </div>

              <div className="space-y-3.5 text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 leading-relaxed">
                  {selectedNews.excerpt}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Hiệp hội doanh nhân CEO 1983 không ngừng đẩy mạnh các hoạt động xúc tiến kết nối
                  giao thương nội khối, xây dựng chuỗi cung ứng bền vững và lan tỏa giá trị kinh tế
                  thiết thực đến từng hội viên trong kỷ nguyên chuyển đổi số toàn diện.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedNews(null)}
                  style={{ color: "#ffffff" }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002B70] active:scale-95 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Đóng bài viết
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
