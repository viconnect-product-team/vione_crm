import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Share2, X, BookOpen, Check, ExternalLink, Calendar, HardDrive } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listDocuments, type LibraryDoc } from "@/lib/member-app.functions";
import { useT, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/association/library")({
  component: LibraryScreen,
});

function LibraryScreen() {
  const t = useT();
  const { lang } = useLang();
  const isEn = lang === "en";
  const fetchDocs = useServerFn(listDocuments);
  const { data: docs, loading } = useServerData<LibraryDoc[]>(() => fetchDocs(), []);
  const [selectedDoc, setSelectedDoc] = useState<LibraryDoc | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = (doc: LibraryDoc) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success(isEn ? `Downloading "${doc.name}"` : `Đang tải xuống tài liệu "${doc.name}"`);
      if (doc.url) {
        window.open(doc.url, "_blank");
      }
    }, 600);
  };

  const handleShare = (doc: LibraryDoc) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success(isEn ? "Document link copied to clipboard!" : "Đã sao chép liên kết tài liệu vào bộ nhớ tạm!");
    }
  };

  return (
    <div className="vba-animate pb-20">
      <MemberHeader title={isEn ? "Resource Library" : t("m.library.title")} back />

      <div className="mt-3 space-y-2.5 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.library.loading")}
          </p>
        )}
        {!loading && docs.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.library.empty")}
          </p>
        )}
        {docs.map((d) => {
          const ext = (d.type || "PDF").toUpperCase();
          const isPdf = ext.includes("PDF");
          const isXls = ext.includes("XLS") || ext.includes("SHEET");

          return (
            <div
              key={d.id}
              onClick={() => setSelectedDoc(d)}
              className="vba-card flex items-center justify-between gap-3 p-3.5 rounded-2xl cursor-pointer transition hover:border-amber-400/50 hover:shadow-md active:scale-[0.99] border border-slate-200/80 dark:border-slate-800"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-black text-[11px] shadow-xs ${
                    isPdf
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60"
                      : isXls
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60"
                      : "bg-blue-50 dark:bg-blue-950/50 text-[#003B95] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60"
                  }`}
                >
                  {ext}
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-bold text-[var(--vba-text)] leading-snug">
                    {d.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{d.size}</span>
                    <span>•</span>
                    <span>{d.time}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(d);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 hover:bg-amber-400 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                title={isEn ? "Download" : "Tải xuống"}
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── DOCUMENT VIEWER MODAL (Căn giữa, tối giản, ít chữ) ── */}
      {selectedDoc && mounted && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="relative w-full max-w-[380px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1222] p-5 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Document Header */}
            <div className="pr-6">
              <span className="inline-block rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">
                {selectedDoc.type?.toUpperCase() || "PDF"} • {selectedDoc.category || "Văn bản nội bộ"}
              </span>
              <h2 className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug">
                {selectedDoc.name}
              </h2>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Dung lượng: {selectedDoc.size}</span>
                <span>•</span>
                <span>Ngày ban hành: {selectedDoc.time}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleDownload(selectedDoc)}
                disabled={downloading}
                style={{ color: "#ffffff" }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] text-white py-2.5 text-xs font-bold shadow-md shadow-[#003B95]/20 active:scale-98 transition cursor-pointer disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                <span>{downloading ? (isEn ? "Downloading..." : "Đang tải...") : (isEn ? "Download file" : "Tải xuống văn bản")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShare(selectedDoc)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>{isEn ? "Share" : "Chia sẻ"}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
