// Export per-field change history for an AI-imported business card
// to CSV or PDF for internal records / sharing.

import { jsPDF } from "jspdf";
import type { FieldHistoryEntry } from "@/components/connect/AiCardImportModal";

export type HistoryExportRow = {
  fieldKey: string;
  fieldLabel: string;
  entries: FieldHistoryEntry[];
};

export type HistoryExportMeta = {
  cardTitle: string; // e.g. display name or "Card #1"
  generatedAt?: number;
  locale?: "vi" | "en";
};

const SOURCE_LABEL_VI: Record<FieldHistoryEntry["source"], string> = {
  ai: "AI đề xuất",
  edit: "Chỉnh sửa",
  restore: "Khôi phục theo AI",
  revert: "Quay lại mốc",
};
const SOURCE_LABEL_EN: Record<FieldHistoryEntry["source"], string> = {
  ai: "AI suggestion",
  edit: "Manual edit",
  restore: "Restored from AI",
  revert: "Reverted to snapshot",
};

function fmtTs(ts: number, locale: "vi" | "en"): string {
  try {
    return new Date(ts).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

function csvEscape(v: string | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function safeSlug(v: string): string {
  return (
    v
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "card"
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportHistoryCSV(rows: HistoryExportRow[], meta: HistoryExportMeta): void {
  const locale = meta.locale ?? "vi";
  const labels = locale === "vi" ? SOURCE_LABEL_VI : SOURCE_LABEL_EN;
  const header =
    locale === "vi"
      ? ["Trường", "Thời gian", "Nguồn", "Người thao tác", "Giá trị"]
      : ["Field", "Timestamp", "Source", "Actor", "Value"];
  const lines: string[] = [];
  lines.push(header.map(csvEscape).join(","));
  const unknownActor = locale === "vi" ? "Không xác định" : "Unknown";
  for (const row of rows) {
    if (!row.entries?.length) continue;
    for (const e of row.entries) {
      lines.push(
        [
          csvEscape(row.fieldLabel),
          csvEscape(fmtTs(e.ts, locale)),
          csvEscape(labels[e.source]),
          csvEscape(e.actorLabel ?? unknownActor),
          csvEscape(e.value ?? ""),
        ].join(","),
      );
    }
  }
  // BOM for Excel UTF-8
  const body = "\uFEFF" + lines.join("\r\n");
  const ts = meta.generatedAt ?? Date.now();
  const filename = `card-history-${safeSlug(meta.cardTitle)}-${ts}.csv`;
  triggerDownload(new Blob([body], { type: "text/csv;charset=utf-8" }), filename);
}

export function exportHistoryPDF(rows: HistoryExportRow[], meta: HistoryExportMeta): void {
  const locale = meta.locale ?? "vi";
  const labels = locale === "vi" ? SOURCE_LABEL_VI : SOURCE_LABEL_EN;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const title = locale === "vi" ? "Lịch sử thay đổi danh thiếp" : "Business card change history";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`${meta.cardTitle}`, margin, y);
  y += 14;
  doc.text(
    (locale === "vi" ? "Xuất lúc: " : "Generated: ") +
      fmtTs(meta.generatedAt ?? Date.now(), locale),
    margin,
    y,
  );
  y += 18;
  doc.setTextColor(0);

  const col = {
    time: margin,
    source: margin + 110,
    actor: margin + 210,
    value: margin + 320,
  };
  const valueW = pageW - margin - col.value;
  const unknownActor = locale === "vi" ? "Không xác định" : "Unknown";

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  for (const row of rows) {
    if (!row.entries?.length) continue;
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(row.fieldLabel, margin, y);
    y += 14;

    // header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(locale === "vi" ? "Thời gian" : "Timestamp", col.time, y);
    doc.text(locale === "vi" ? "Nguồn" : "Source", col.source, y);
    doc.text(locale === "vi" ? "Người thao tác" : "Actor", col.actor, y);
    doc.text(locale === "vi" ? "Giá trị" : "Value", col.value, y);
    y += 4;
    doc.setDrawColor(210);
    doc.line(margin, y, pageW - margin, y);
    y += 10;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    for (const e of row.entries) {
      const valueLines = doc.splitTextToSize(e.value ?? "—", valueW);
      const rowH = Math.max(14, valueLines.length * 12);
      ensureSpace(rowH + 4);
      doc.text(fmtTs(e.ts, locale), col.time, y);
      doc.text(labels[e.source], col.source, y);
      const actorLines = doc.splitTextToSize(
        e.actorLabel ?? unknownActor,
        col.value - col.actor - 6,
      );
      doc.text(actorLines, col.actor, y);
      doc.text(valueLines, col.value, y);
      y += rowH;
    }
    y += 10;
  }

  // page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(`${i} / ${pages}`, pageW - margin, pageH - 20, { align: "right" });
  }

  const ts = meta.generatedAt ?? Date.now();
  doc.save(`card-history-${safeSlug(meta.cardTitle)}-${ts}.pdf`);
}
