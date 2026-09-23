import { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  Check,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseProductsFromExcel,
  downloadProductTemplateExcel,
  type ParsedProductItem,
} from "@/lib/marketplace-excel";

interface ProductExcelModalProps {
  open: boolean;
  onClose: () => void;
  onImportProducts: (items: ParsedProductItem[]) => Promise<void>;
}

export function ProductExcelModal({ open, onClose, onImportProducts }: ProductExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [items, setItems] = useState<ParsedProductItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    await processFile(selectedFile);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    await processFile(droppedFile);
  };

  const processFile = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Vui lòng tải lên file định dạng Excel (.xlsx, .xls) hoặc .csv");
      return;
    }

    setFile(f);
    setParsing(true);
    try {
      const { items: parsedItems, validCount, invalidCount } = await parseProductsFromExcel(f);
      setItems(parsedItems);

      // Auto-select all valid rows
      const validSet = new Set<number>();
      parsedItems.forEach((it, idx) => {
        if (it.isValid) validSet.add(idx);
      });
      setSelectedIndices(validSet);

      if (parsedItems.length === 0) {
        toast.warning("File Excel không có dữ liệu sản phẩm.");
      } else {
        toast.success(`Đã đọc ${parsedItems.length} sản phẩm (${validCount} hợp lệ, ${invalidCount} cần bổ sung).`);
      }
    } catch (err: any) {
      console.error("Lỗi đọc file Excel:", err);
      toast.error(err?.message || "Không thể đọc file Excel. Vui lòng kiểm tra định dạng.");
    } finally {
      setParsing(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const validCount = items.filter((i) => i.isValid).length;
    if (selectedIndices.size === validCount && validCount > 0) {
      setSelectedIndices(new Set());
    } else {
      const allValid = new Set<number>();
      items.forEach((it, idx) => {
        if (it.isValid) allValid.add(idx);
      });
      setSelectedIndices(allValid);
    }
  };

  const handleConfirmImport = async () => {
    const toImport = items.filter((_, idx) => selectedIndices.has(idx));
    if (toImport.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm hợp lệ để nhập.");
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: toImport.length });
    try {
      await onImportProducts(toImport);
      toast.success(`Đã nhập thành công ${toImport.length} sản phẩm lên sàn Marketplace!`);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error("Lỗi nhập sản phẩm:", err);
      toast.error(err?.message || "Có lỗi xảy ra trong quá trình lưu sản phẩm.");
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setItems([]);
    setSelectedIndices(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validItemsCount = items.filter((i) => i.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Nhập danh sách sản phẩm từ file Excel
              </h2>
              <p className="text-xs text-muted-foreground">
                Tự động đọc các thông tin sản phẩm và đồng bộ hàng loạt lên sàn giao thương B2B
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action Bar: Download template + Upload trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Chưa có file mẫu chuẩn? Tải file mẫu để điền dữ liệu đúng định dạng:
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadProductTemplateExcel()}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Tải file mẫu Excel (.xlsx)
            </button>
          </div>

          {/* Upload Dropzone if no file or user wants to re-upload */}
          {items.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 p-8 text-center transition-all hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                {parsing ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Upload className="h-7 w-7" />
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {parsing
                  ? "Đang phân tích dữ liệu Excel..."
                  : "Nhấp để chọn file hoặc kéo thả file Excel vào đây"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hỗ trợ định dạng .xlsx, .xls, .csv dung lượng tối đa 15MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details + Quick switch */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-foreground">{file?.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({items.length} dòng đọc được)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Stats & Select All */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">
                    Tổng số: <strong className="text-primary">{items.length}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Hợp lệ: {validItemsCount}
                  </span>
                  {items.length - validItemsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> Không hợp lệ: {items.length - validItemsCount}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {selectedIndices.size === validItemsCount
                    ? "Bỏ chọn tất cả"
                    : `Chọn tất cả hợp lệ (${validItemsCount})`}
                </button>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="w-10 px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === validItemsCount && validItemsCount > 0}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-2.5">STT</th>
                      <th className="px-3 py-2.5">Tên sản phẩm</th>
                      <th className="px-3 py-2.5">Danh mục</th>
                      <th className="px-3 py-2.5 text-right">Giá bán</th>
                      <th className="px-3 py-2.5">Đơn vị</th>
                      <th className="px-3 py-2.5">Công ty</th>
                      <th className="px-3 py-2.5">Liên hệ</th>
                      <th className="px-3 py-2.5 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((it, idx) => {
                      const isSelected = selectedIndices.has(idx);
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            !it.isValid
                              ? "bg-rose-500/5 dark:bg-rose-950/10"
                              : isSelected
                              ? "bg-primary/5"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!it.isValid}
                              onChange={() => toggleSelect(idx)}
                              className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer disabled:opacity-30"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 max-w-[220px]">
                            <div className="truncate font-medium text-foreground" title={it.title}>
                              {it.title || "—"}
                            </div>
                            {it.description && (
                              <div
                                className="truncate text-[10px] text-muted-foreground"
                                title={it.description}
                              >
                                {it.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {it.categoryName || "Dịch vụ"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right font-mono font-semibold text-primary">
                            {it.price > 0 ? it.price.toLocaleString("vi-VN") + " ₫" : "—"}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                            {it.unit || "Gói"}
                          </td>
                          <td className="px-3 py-2.5 max-w-[150px] truncate text-muted-foreground" title={it.company}>
                            {it.company || "—"}
                          </td>
                          <td className="px-3 py-2.5 max-w-[130px] truncate text-muted-foreground">
                            {it.sellerName || it.sellerPhone ? (
                              <span>
                                {it.sellerName} {it.sellerPhone ? `(${it.sellerPhone})` : ""}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {it.isValid ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <Check className="h-3 w-3" /> Hợp lệ
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 cursor-help"
                                title={it.error}
                              >
                                <AlertCircle className="h-3 w-3" /> {it.error || "Lỗi"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {items.length > 0
              ? `Đã chọn ${selectedIndices.size} / ${validItemsCount} sản phẩm hợp lệ`
              : "Vui lòng chọn file Excel để xem trước"}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={importing || selectedIndices.size === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang nhập...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Xác nhận nhập ({selectedIndices.size} sản phẩm)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
