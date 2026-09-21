import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Calendar, User, ArrowLeft } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listNews, type NewsItem } from "@/lib/member-app.functions";
import { useT, useFmt } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/m/news")({
  component: NewsScreen,
});

function NewsScreen() {
  const t = useT();
  const fmt = useFmt();
  const fetchNews = useServerFn(listNews);
  const { data: news, loading } = useServerData<NewsItem[]>(() => fetchNews(), []);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.news.title")} back />

      <div className="mt-3 space-y-3 px-4 pb-12">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.news.loading")}
          </p>
        )}
        {!loading && news.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.news.empty")}
          </p>
        )}
        {news.map((n: any) => (
          <article
            key={n.id}
            onClick={() => setSelectedNews(n)}
            className="vba-card p-4 transition-all duration-200 hover:border-[#F6E1C3]/40 active:scale-[0.99] cursor-pointer"
          >
            {n.category && (
              <span className="inline-block rounded-md bg-[var(--vba-gold-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vba-gold)]">
                {n.category}
              </span>
            )}
            <h2 className="mt-2 text-[14px] font-semibold leading-snug text-[var(--vba-text)] hover:text-[#D8B282]">
              {n.title}
            </h2>
            {n.excerpt && (
              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--vba-text-muted)]">
                {n.excerpt}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--vba-text-dim)]">
              <span>{[n.author, fmt.rel(n.time)].filter(Boolean).join(" · ")}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {n.views}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedNews && (
        <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto p-5 sm:p-6 rounded-2xl bg-[#0d1624] border border-[#D8B282]/30 text-[#F6E1C3] shadow-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="pr-6">
              {selectedNews.category && (
                <span className="inline-block rounded-full bg-[#D8B282]/20 border border-[#D8B282]/40 px-3 py-1 text-[11px] font-semibold text-[#F6E1C3] uppercase tracking-wider mb-2.5">
                  {selectedNews.category}
                </span>
              )}

              <DialogTitle className="text-lg sm:text-xl font-bold leading-tight text-white text-left mb-2.5">
                {selectedNews.title}
              </DialogTitle>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 pb-3 mb-3 border-b border-white/10">
              {selectedNews.author && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D8B282]" />
                  <span>{selectedNews.author}</span>
                </div>
              )}
              {selectedNews.time && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D8B282]" />
                  <span>{fmt.rel(selectedNews.time)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D8B282]" />
                <span>{selectedNews.views} lượt xem</span>
              </div>
            </div>

            <div className="space-y-3.5 text-[13.5px] leading-relaxed text-white/90">
              <p className="font-medium text-white/95 bg-white/5 p-3.5 rounded-xl border border-white/5">
                {selectedNews.excerpt}
              </p>
              <p className="text-white/80">
                Hiệp hội doanh nhân CEO 1983 không ngừng đẩy mạnh các hoạt động xúc tiến kết nối giao thương nội khối, xây dựng chuỗi cung ứng bền vững và lan tỏa giá trị kinh tế thiết thực đến từng hội viên trong kỷ nguyên chuyển đổi số toàn diện.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] font-semibold text-xs hover:brightness-110 transition-all shadow-md cursor-pointer"
              >
                Đóng bài viết
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
