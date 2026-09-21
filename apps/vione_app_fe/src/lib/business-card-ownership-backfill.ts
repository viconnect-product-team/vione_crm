// BC-2.1B — Deterministic Business Card ownership backfill: pure-logic model.
//
// This is the authoritative TypeScript mirror of the SQL function
// `public.run_business_card_ownership_backfill` and its rollback counterpart.
// It exists so the eligibility / idempotency / rollback rules are unit-testable
// deterministically WITHOUT relying on the zero-row production dataset, and so
// the classification stays in lock-step with BC-2.0's approved classifier.
//
// It performs NO IO. The SQL function is the runtime source of truth; this
// module documents and tests the exact same decision logic.

export type MemberRow = {
  id: string;
  user_id: string | null;
  association_id: string;
};

export type CardRow = {
  id: string;
  member_id: string | null;
  association_id: string;
  owner_user_id: string | null;
};

export type OwnershipClassification =
  | "A_RESOLVABLE_UNIQUE"
  | "B_MEMBER_WITHOUT_USER"
  | "C_ORPHAN_MEMBER_REFERENCE"
  | "D_AMBIGUOUS_USER_MAPPING"
  | "E_ASSOCIATION_MISMATCH"
  | "F_ALREADY_GLOBAL_COMPATIBLE";

export const REASON_CODE: Record<
  Exclude<OwnershipClassification, "A_RESOLVABLE_UNIQUE" | "F_ALREADY_GLOBAL_COMPATIBLE">,
  string
> = {
  B_MEMBER_WITHOUT_USER: "MEMBER_WITHOUT_USER",
  C_ORPHAN_MEMBER_REFERENCE: "ORPHAN_MEMBER_REFERENCE",
  D_AMBIGUOUS_USER_MAPPING: "AMBIGUOUS_USER_MAPPING",
  E_ASSOCIATION_MISMATCH: "ASSOCIATION_MISMATCH",
};

/**
 * Classify a single card using the BC-2.0 approved order. The precedence is
 * significant and must match the SQL classifier exactly:
 *   orphan → association mismatch → member-without-user → ambiguous →
 *   already-owned → eligible.
 */
export function classifyCard(card: CardRow, members: MemberRow[]): OwnershipClassification {
  const member = card.member_id ? (members.find((m) => m.id === card.member_id) ?? null) : null;

  if (!member) return "C_ORPHAN_MEMBER_REFERENCE";
  if (card.association_id !== member.association_id) return "E_ASSOCIATION_MISMATCH";
  if (!member.user_id) return "B_MEMBER_WITHOUT_USER";

  const sameUserSameAssoc = members.filter(
    (m) => m.user_id === member.user_id && m.association_id === member.association_id,
  );
  if (sameUserSameAssoc.length > 1) return "D_AMBIGUOUS_USER_MAPPING";

  if (card.owner_user_id) return "F_ALREADY_GLOBAL_COMPATIBLE";
  return "A_RESOLVABLE_UNIQUE";
}

export type BackfillItem = {
  card_id: string;
  prior_owner_user_id: string | null;
  assigned_owner_user_id: string;
  classification: "A_RESOLVABLE_UNIQUE";
  action: "assigned";
};

export type BackfillRun = {
  runId: string;
  eligibleCount: number;
  updatedCount: number;
  items: BackfillItem[];
};

/**
 * Deterministic backfill over an in-memory card/member set. Mutates card rows
 * in place exactly like the SQL UPDATE (owner_user_id = members.user_id) and
 * returns the run record. Idempotent: a card with a non-null owner_user_id is
 * never touched, so a clean rerun yields updatedCount = 0.
 *
 * Throws on an eligible/updated row-count mismatch — the same assertion the SQL
 * function raises to abort the transaction.
 */
export function runBackfill(
  cards: CardRow[],
  members: MemberRow[],
  runId = "run-" + Math.random().toString(36).slice(2),
): BackfillRun {
  const eligible = cards.filter(
    (c) => c.owner_user_id === null && classifyCard(c, members) === "A_RESOLVABLE_UNIQUE",
  );

  const items: BackfillItem[] = [];
  let updated = 0;
  for (const card of eligible) {
    const member = members.find((m) => m.id === card.member_id)!;
    // Re-check no-overwrite inside the "transaction".
    if (card.owner_user_id !== null) continue;
    card.owner_user_id = member.user_id!;
    updated += 1;
    items.push({
      card_id: card.id,
      prior_owner_user_id: null,
      assigned_owner_user_id: member.user_id!,
      classification: "A_RESOLVABLE_UNIQUE",
      action: "assigned",
    });
  }

  if (updated !== eligible.length) {
    throw new Error(
      `Row-count mismatch: eligible=${eligible.length} updated=${updated} (aborting)`,
    );
  }

  return { runId, eligibleCount: eligible.length, updatedCount: updated, items };
}

/**
 * Isolated rollback. Clears owner_user_id ONLY for rows this run assigned that
 * remain unchanged since (current owner === assigned owner). A card whose owner
 * was manually changed afterward is preserved. Returns cleared count.
 */
export function rollbackRun(cards: CardRow[], items: BackfillItem[]): number {
  let cleared = 0;
  for (const item of items) {
    const card = cards.find((c) => c.id === item.card_id);
    if (!card) continue;
    if (card.owner_user_id === item.assigned_owner_user_id) {
      card.owner_user_id = item.prior_owner_user_id;
      cleared += 1;
    }
  }
  return cleared;
}
