# Work Hub — Observability (BC-8.0)

The Hub is a read-model and emits no domain events. Instrumentation is
limited to request-level signals:

- Server functions log resolver runtime and per-source result counts at
  `debug` level. No PII, no counterpart names, no note contents.
- `registryVersion` is stamped on every response so downstream logs can
  correlate to a specific frozen contract.
- Failures degrade to empty per source; watch for a persistent drop in
  a single source's contribution as a health signal.

There is no separate dashboard for the Hub — canonical domain
observability (Connections, Introductions, Meetings) remains the source
of truth for lifecycle metrics.
