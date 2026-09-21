# Work Hub — Error Model (BC-8.0)

All service-layer errors are instances of `WorkHubError` with a frozen
code set. Server functions surface these to the UI unchanged.

| Code                      | When                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| `WORK_HUB_INVALID_FILTER` | Malformed / out-of-range filter (e.g. `limit > 100`)                |
| `WORK_HUB_INVALID_CURSOR` | Cursor is unparseable or carries a stale registry version           |
| `WORK_HUB_UNAVAILABLE`    | Unrecoverable composition failure (rare — sources degrade to empty) |

Source-level failures do not throw. They are absorbed by the repository
and the affected source contributes zero items. This keeps the Hub
available when a single dependency is down.
