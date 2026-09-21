// Server-only helper: resolve the caller's ACTIVE association id (the
// membership row marked is_default, via current_association_id()).
// Callers without an active association (e.g. platform admins with no
// membership) get null and keep whatever their RLS policies already allow.
// Imported ONLY inside createServerFn .handler() bodies via await import().

export async function getActiveAssociationId(supabase: any): Promise<string | null> {
  const { data } = await supabase.rpc("current_association_id");
  return typeof data === "string" && data.length > 0 ? data : null;
}
