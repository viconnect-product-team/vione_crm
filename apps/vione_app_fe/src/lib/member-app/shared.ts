// Shared helpers for the member-app domain: date formatting.

export function relTime(iso: string | null): string {
  // Returns the raw ISO string; the client localizes it via useFmt().rel().
  return iso ?? "";
}

export function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("vi-VN");
}

export async function resolveAssociationId(_db?: any, _userId?: string): Promise<string | null> {
  return null;
}
