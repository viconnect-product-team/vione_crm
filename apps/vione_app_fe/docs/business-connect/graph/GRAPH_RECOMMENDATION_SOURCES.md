# GRAPH_RECOMMENDATION_SOURCES — BC-4.4

Frozen for `RELATIONSHIP_RECOMMENDATION_VERSION = 1.0.0`.

| Source             | Category            | Base | Freq cap | Model      | Reason code        |
| ------------------ | ------------------- | ---- | -------- | ---------- | ------------------ |
| MUTUAL_CONNECTION  | mutual              | 0.35 | 12       | capped_log | MUTUAL_CONNECTIONS |
| STRONG_MUTUAL      | strength            | 0.20 | 6        | capped_log | TRUSTED_MUTUAL     |
| SHARED_COMPANY     | context_company     | 0.18 | 4        | capped_log | SHARED_COMPANY     |
| SHARED_ASSOCIATION | context_association | 0.12 | 4        | capped_log | SHARED_ASSOCIATION |
| SHARED_COMMUNITY   | context_community   | 0.10 | 4        | capped_log | SHARED_COMMUNITY   |
| SHARED_EVENT       | context_event       | 0.08 | 4        | capped_log | SHARED_EVENT       |
| SHARED_MEETING     | context_meeting     | 0.08 | 3        | capped_log | SHARED_MEETING     |
| INTRODUCTION_PATH  | introduction        | 0.10 | 3        | capped_log | INTRODUCTION_PATH  |

All sources emit only `person` candidates in v1.
