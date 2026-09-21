/**
 * Utility functions for date formatting across ViOne and CEO 1983 platforms.
 * Standardizes date presentation into Vietnamese format: dd/mm/yyyy or ddd, dd/mm/yy.
 */

export function formatDisplayDate(
  dateInput: string | Date | number | null | undefined,
  options?: { withWeekday?: boolean; shortYear?: boolean }
): string {
  if (!dateInput || dateInput === "—" || dateInput === "-") return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const fullYear = d.getFullYear();
  const year = options?.shortYear ? String(fullYear).slice(-2) : String(fullYear);

  const dateStr = `${day}/${month}/${year}`;

  if (options?.withWeekday) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const weekday = days[d.getDay()];
    return `${weekday}, ${dateStr}`;
  }

  return dateStr;
}

export function formatFullVnDate(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const fullDays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${fullDays[d.getDay()]}, ${day}/${month}/${year}`;
}

export function formatDisplayDateTime(
  dateInput: string | Date | number | null | undefined,
  options?: { showSeconds?: boolean; shortYear?: boolean }
): string {
  if (!dateInput || dateInput === "—" || dateInput === "-") return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const fullYear = d.getFullYear();
  const year = options?.shortYear ? String(fullYear).slice(-2) : String(fullYear);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  const timeStr = options?.showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  return `${day}/${month}/${year} ${timeStr}`;
}

export function formatCurrencyInput(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

export function parseCurrencyInput(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  const digits = String(val).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

