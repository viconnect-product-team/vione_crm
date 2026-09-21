# GRAPH_RECOMMENDATION_DIVERSITY — BC-4.4

Diversity is a hard, deterministic post-rank rerank.

- No more than `RECO_MAX_CONSECUTIVE_SAME_CATEGORY` (2) consecutive items
  from the same dominant category may appear in the emitted page.
- The rerank preserves the base sort order except when it needs to promote
  the first candidate from a different category to break a streak.
- If no alternative category is available in the remaining pool, the
  streak is allowed to continue — diversity never invents evidence.

Determinism: the rerank is a pure function of the ranked input; it makes
no runtime lookups and never consults wall-clock or randomness.
