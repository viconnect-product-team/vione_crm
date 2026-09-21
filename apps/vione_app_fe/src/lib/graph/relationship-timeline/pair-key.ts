// BC-7.5 — Deterministic, non-authoritative relationship pair identity.
//
// canonicalPairKey(a, b) is unordered, stable, and produces the same value
// for (a,b) and (b,a). It is a PROJECTION for grouping timeline events, not
// an authorization boundary. Graph RLS still governs visibility.

const NIL = "00000000-0000-0000-0000-000000000000";

/**
 * Return `rel:<lowerId>:<higherId>` using lexical string ordering, or null
 * when either node id is missing / equal to the nil uuid. Unordered by
 * construction; caller may safely swap arguments.
 */
export function canonicalPairKey(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
  if (!a || !b) return null;
  if (a === NIL || b === NIL) return null;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return `rel:${lo}:${hi}`;
}
