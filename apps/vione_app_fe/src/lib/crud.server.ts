// Server-only CRUD helpers (audit logging + code generation).
// Imported only inside createServerFn .handler() bodies via await import().

type Admin = any;

export function genCode(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function logActivity(
  admin: Admin,
  opts: { action: string; target: string; category: string; user?: string; associationId?: string },
): Promise<void> {
  const now = new Date();
  const at = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  const code = `L-${now.getTime().toString(36).toUpperCase()}`;
  const assocId = opts.associationId || "c1983000-0000-4000-8000-000000001983";
  const allowedCategories = new Set(["auth", "member", "fee", "event", "system"]);
  let cat = (opts.category || "system").toLowerCase();
  if (!allowedCategories.has(cat)) {
    if (cat.includes("meet") || cat.includes("họp")) cat = "event";
    else if (cat.includes("perk") || cat.includes("benefit") || cat.includes("user")) cat = "member";
    else cat = "system";
  }
  const { error } = await admin.from("activity_log").insert({
    code,
    user: opts.user ?? "admin@connect.vn",
    action: opts.action,
    target: opts.target,
    category: cat,
    at,
    ip: "127.0.0.1",
    association_id: assocId,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });
  if (error) console.error("activity_log insert failed:", error.message);
}
