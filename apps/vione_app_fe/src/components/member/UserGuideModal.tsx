import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Upload,
  Trash2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/api-client";

export interface UserGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_PDF_URL = "/docs/HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf";

export function UserGuideModal({ open, onClose }: UserGuideModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string>(DEFAULT_PDF_URL);
  const [uploading, setUploading] = useState(false);
  const [adminBarOpen, setAdminBarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vba_active_guide_pdf");
      if (saved) {
        setPdfUrl(saved);
      }
    }
  }, []);

  if (!open || typeof document === "undefined") return null;

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Vui lòng chọn tệp tin có định dạng PDF (.pdf)");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadFile(file, `HDSD_${Date.now()}.pdf`);
      if (uploadedUrl) {
        setPdfUrl(uploadedUrl);
        localStorage.setItem("vba_active_guide_pdf", uploadedUrl);
        toast.success("Đã tải lên file PDF hướng dẫn sử dụng mới thành công!");
      }
    } catch (err: any) {
      toast.error("Tải file lên thất bại. Vui lòng thử lại!");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleResetDefault = () => {
    setPdfUrl(DEFAULT_PDF_URL);
    localStorage.removeItem("vba_active_guide_pdf");
    toast.info("Đã khôi phục file PDF hướng dẫn sử dụng mặc định của hệ thống.");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#071228] shadow-2xl">
        {/* Header bar */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-xs border border-white/20">
              <FileText className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  Sổ Tay Hướng Dẫn Sử Dụng
                </h3>
                <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-400/30">
                  PDF Chuẩn
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/80">
                CLB Doanh Nhân CEO 1983 · Bản hướng dẫn chi tiết & hình ảnh minh họa thực tế
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminBarOpen((v) => !v)}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              title="Quản lý file PDF"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Quản lý file</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition backdrop-blur-md border border-white/25 shadow-xs"
              title="Mở toàn màn hình trong tab mới"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>

            <a
              href={pdfUrl}
              download="HUONG_DAN_SU_DUNG_APP_HIEP_HOI_CEO1983.pdf"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
              title="Tải tệp PDF về máy"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải PDF</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl bg-black/30 hover:bg-black/50 text-white transition ml-1 cursor-pointer"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Optional Admin Toolbar: Upload & Delete */}
        {adminBarOpen && (
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 px-4 sm:px-6 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-sky-200 font-medium">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              <span>Cập nhật file PDF hướng dẫn sử dụng cho hội viên:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 px-3 py-1 text-xs font-bold text-white shadow-xs cursor-pointer transition">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                <span>{uploading ? "Đang tải lên..." : "Tải file PDF mới"}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading}
                  onChange={handleUploadPdf}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
                title="Khôi phục file ban đầu"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>Xóa / Đặt lại mặc định</span>
              </button>
            </div>
          </div>
        )}

        {/* Main PDF Viewer Body */}
        <div className="flex-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 relative">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="h-full w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white shadow-inner"
            title="Tài liệu Hướng dẫn sử dụng App Hiệp Hội CEO 1983"
          />

          {/* Mobile Fallback Overlay if browser does not render iframe PDF */}
          <div className="sm:hidden absolute bottom-4 inset-x-4 pointer-events-none flex justify-center">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg border border-white/20 active:scale-95 transition"
            >
              <Download className="h-4 w-4" />
              <span>Xem toàn màn hình & Tải về</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Tài liệu đã được xác thực 100% hình ảnh minh chứng thực tế
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdminBarOpen((v) => !v)}
              className="sm:hidden text-sky-600 font-semibold"
            >
              Quản lý file
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
