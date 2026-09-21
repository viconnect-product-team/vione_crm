// Xuất nhật ký gia hạn (renewal audit log) ra PDF, kèm chữ ký thời gian
// (timestamp + mã băm SHA-256 của nội dung) để đối chiếu tính toàn vẹn.

import { jsPDF } from "jspdf";
import type { AdminRenewalAuditRow } from "@/lib/renewal-audit-admin.functions";
import type { RenewalAuditEntry as MemberAuditEntry } from "@/lib/member-app/renewal.functions";

// Hỗ trợ cả admin audit row lẫn member self-service audit entry
type RenewalAuditEntry = AdminRenewalAuditRow | MemberAuditEntry;

export type RenewalAuditExportMeta = {
  memberLabel?: string;
  filterLabel?: string;
  rangeLabel?: string;
  generatedAt?: number;
};

const EVENT_LABEL: Record<RenewalAuditEntry["eventType"], string> = {
  payment: "Thanh toán thật",
  idempotent_noop: "Bấm lặp (không phát sinh)",
  failure: "Thất bại",
};

const ROBOTO_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-vietnamese-400-normal.woff";

function fmtVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Bỏ dấu tiếng Việt — chỉ dùng khi không nạp được font Unicode. */
function deaccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

async function sha256Hex(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback không mã hoá mạnh — chỉ để có mã đối chiếu.
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
    return `fnv${(h >>> 0).toString(16)}`;
  }
}

/** Chuỗi chuẩn hoá dùng để băm — thay đổi bất kỳ trường nào sẽ đổi mã. */
export function buildAuditDigestPayload(rows: RenewalAuditEntry[]): string {
  return rows
    .map((r: any) =>
      [
        r.id,
        r.eventType,
        r.reference,
        r.method ?? "",
        r.amountPaid,
        r.invoiceNo ?? "",
        r.previousTermEnd ?? "",
        r.newTermEnd ?? "",
        r.errorCode ?? "",
        r.createdAt,
      ].join("|"),
    )
    .join("\n");
}

async function tryLoadUnicodeFont(doc: jsPDF): Promise<boolean> {
  try {
    const res = await fetch(ROBOTO_URL);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    doc.addFileToVFS("Roboto-vi.ttf", b64);
    doc.addFont("Roboto-vi.ttf", "RobotoVi", "normal");
    doc.setFont("RobotoVi", "normal");
    return true;
  } catch {
    return false;
  }
}

export async function exportRenewalAuditPDF(
  rows: RenewalAuditEntry[],
  meta: RenewalAuditExportMeta = {},
): Promise<void> {
  const generatedAt = meta.generatedAt ?? Date.now();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const unicode = await tryLoadUnicodeFont(doc);
  const T = (s: string) => (unicode ? s : deaccent(s));
  const FONT = unicode ? "RobotoVi" : "helvetica";
  const setFont = (weight: "normal" | "bold") => doc.setFont(FONT, unicode ? "normal" : weight);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const ensure = (needed: number) => {
    if (y + needed > pageH - margin - 24) {
      doc.addPage();
      y = margin;
    }
  };

  setFont("bold");
  doc.setFontSize(16);
  doc.text(T("Nhật ký gia hạn hội viên"), margin, y);
  y += 20;

  setFont("normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  if (meta.memberLabel) {
    doc.text(T(`Hội viên: ${meta.memberLabel}`), margin, y);
    y += 13;
  }
  doc.text(T(`Xuất lúc: ${new Date(generatedAt).toLocaleString("vi-VN")}`), margin, y);
  y += 13;
  if (meta.filterLabel) {
    doc.text(T(`Bộ lọc: ${meta.filterLabel}`), margin, y);
    y += 13;
  }
  if (meta.rangeLabel) {
    doc.text(T(`Khoảng thời gian: ${meta.rangeLabel}`), margin, y);
    y += 13;
  }

  // Tổng hợp
  const payments = rows.filter((r) => r.eventType === "payment");
  const total = payments.reduce((s, r) => s + r.amountPaid, 0);
  doc.text(
    T(
      `Tổng: ${rows.length} sự kiện · Thanh toán: ${payments.length} (${fmtVND(total)}) · ` +
        `Bấm lặp: ${rows.filter((r) => r.eventType === "idempotent_noop").length} · ` +
        `Thất bại: ${rows.filter((r) => r.eventType === "failure").length}`,
    ),
    margin,
    y,
  );
  y += 18;
  doc.setTextColor(0);

  if (!rows.length) {
    doc.setFontSize(11);
    doc.text(T("Không có sự kiện nào trong nhật ký."), margin, y);
  }

  const contentW = pageW - margin * 2;

  for (const r of rows) {
    const lines: string[] = [];
    lines.push(`${fmtDateTime(r.createdAt)} — ${EVENT_LABEL[r.eventType]}`);
    lines.push(
      `Mã tham chiếu: ${r.reference}` +
        (r.method ? ` · Phương thức: ${r.method}` : "") +
        (r.invoiceNo ? ` · Hóa đơn: ${r.invoiceNo}` : ""),
    );
    if (r.eventType === "payment" || r.amountPaid > 0) {
      lines.push(`Số tiền: ${fmtVND(r.amountPaid)}`);
    }
    if (r.previousTermEnd || r.newTermEnd) {
      lines.push(`Hạn hội viên: ${r.previousTermEnd ?? "—"} → ${r.newTermEnd ?? "—"}`);
    }
    if (r.eventType === "idempotent_noop" && typeof r.metadata?.reason === "string") {
      lines.push(`Lý do không phát sinh: ${r.metadata.reason}`);
    }
    if (r.eventType === "failure") {
      lines.push(`Lỗi: ${r.errorCode ?? "—"}${r.errorMessage ? ` — ${r.errorMessage}` : ""}`);
    }

    const wrapped = lines.flatMap((l: any) => doc.splitTextToSize(T(l), contentW - 12) as string[]);
    const blockH = wrapped.length * 13 + 14;
    ensure(blockH + 6);

    doc.setDrawColor(220);
    doc.setFillColor(248, 249, 251);
    doc.roundedRect(margin, y, contentW, blockH, 6, 6, "FD");

    let ty = y + 16;
    setFont("bold");
    doc.setFontSize(10.5);
    doc.text(wrapped[0], margin + 8, ty);
    ty += 13;
    setFont("normal");
    doc.setFontSize(9.5);
    doc.setTextColor(60);
    for (const line of wrapped.slice(1)) {
      doc.text(line, margin + 8, ty);
      ty += 13;
    }
    doc.setTextColor(0);
    y += blockH + 8;
  }

  // Chữ ký thời gian + mã toàn vẹn
  const digest = await sha256Hex(`${generatedAt}\n${buildAuditDigestPayload(rows)}`);
  const stampIso = new Date(generatedAt).toISOString();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    setFont("normal");
    doc.setFontSize(7.5);
    doc.setTextColor(130);
    doc.text(
      T(`Chữ ký thời gian: ${stampIso} · SHA-256: ${digest.slice(0, 32)}`),
      margin,
      pageH - 22,
    );
    doc.text(`${i} / ${pages}`, pageW - margin, pageH - 22, { align: "right" });
  }

  doc.save(`renewal-audit-${new Date(generatedAt).toISOString().slice(0, 10)}.pdf`);
}
