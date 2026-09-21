# BC-6.0 — Smart Introduction Reason Codes

Stable, versioned reason codes. Priorities live in
`INTRODUCTION_REASON_PRIORITY`.

| Code                       | Priority | Trigger                                              |
| -------------------------- | -------- | ---------------------------------------------------- |
| STRONG_DIRECT_INTERMEDIARY | 100      | source→intermediary strength ≥ 0.7                   |
| STRONG_TARGET_RELATIONSHIP | 95       | intermediary→target strength ≥ 0.7                   |
| MUTUAL_TRUST_PATH          | 90       | 2-hop path with `min(strengths) ≥ 0.55`              |
| PRIOR_INTRODUCTION_HISTORY | 85       | Prior successful introduction recorded (viewer-safe) |
| SAME_ASSOCIATION           | 70       | Shared context kind = `association`                  |
| SAME_COMPANY_CONTEXT       | 68       | Shared context kind = `company`                      |
| SHARED_COMMUNITY           | 60       | Shared context kind = `community`                    |
| SHARED_EVENT               | 55       | Shared context kind = `event`                        |
| RECENT_INTERACTION         | 50       | Any hop marked recent (≤ 30d)                        |
| SHORTEST_TRUSTED_PATH      | 20       | Fallback when nothing else applies                   |

`summaryKey = businessConnect.introduction.reason.<CODE>`. Optional `count`
and `examples[]` are viewer-visible only. Reason DTOs never expose raw edge
or hidden node ids.
