# GRAPH_RECOMMENDATION_PRIVACY — BC-4.4

- **Viewer-scoped.** Candidate generation walks only RLS-visible neighbors,
  contexts, and timeline entries.
- **Hidden-node collapse.** A hidden candidate is dropped from the page;
  no "hidden result exists" signal leaks.
- **Reason example allowlist.** Reason `examples` are drawn from nodes the
  viewer can already see; hidden connectors and hidden shared contexts
  are omitted silently, never partially redacted.
- **No cross-viewer leakage.** Scores are per-viewer and never cached
  across viewers.
- **Reason contributions are pre-rounded** (`0.001` precision) so raw
  weights and viewer topology cannot be reverse-engineered from the DTO.
