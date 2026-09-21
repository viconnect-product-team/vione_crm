# Platform Layer Diagram (FROZEN — BC-0.4)

Canonical three-layer architecture. Documentation-only. Rendered diagram:
`Platform_Layer_Diagram.mmd` artifact (same content as below).

```text
┌──────────────────────────────────────────────────────────────────────┐
│ PRODUCT SURFACES                                                       │
│  Association Admin (/app)   Member PWA (/m)                            │
│  Business Connect (/connect)   Community (/community)   Future (/company)
│  → compose Shared Services under one identity context + route namespace │
└──────────────────────────────────────────────────────────────────────┘
                                 ▲  consume (down-only)
┌──────────────────────────────────────────────────────────────────────┐
│ SHARED BUSINESS SERVICES (scope-agnostic, one owner each)             │
│  Business Card · Networking · Companies · Meetings · Marketplace       │
│  Events · Messaging · Documents · Search · AI personas · Media         │
│  Analytics · Notification templates                                    │
└──────────────────────────────────────────────────────────────────────┘
                                 ▲  consume (down-only)
┌──────────────────────────────────────────────────────────────────────┐
│ PLATFORM CORE (zero business logic)                                    │
│  Authentication · Identity · Authorization · Audit · Notification infra│
│  Storage · Search infra · AI Gateway · Realtime · Observability        │
│  Configuration · Feature Flags · Billing foundation · Analytics found. │
└──────────────────────────────────────────────────────────────────────┘

Dependency rules: arrows point strictly downward.
Core imports nothing above it. Shared imports only Core. Products import
Shared + Core. No product/association imports into Core or Shared.
No circular dependencies.
```

## Mermaid source

```mermaid
flowchart TD
  subgraph P["Product Surfaces"]
    A1["Association Admin /app"]
    A2["Member PWA /m"]
    A3["Business Connect /connect"]
    A4["Community /community"]
  end
  subgraph S["Shared Business Services"]
    S1["Business Card"]
    S2["Networking (global)"]
    S3["Marketplace"]
    S4["Events / Meetings"]
    S5["Documents / Messaging"]
    S6["AI Personas"]
    S7["Companies / Media / Analytics"]
  end
  subgraph C["Platform Core (no business logic)"]
    C1["Auth / Identity / Authz"]
    C2["Audit / Observability"]
    C3["Storage / Search infra"]
    C4["AI Gateway / Realtime"]
    C5["Config / Flags / Billing / Analytics foundation"]
  end
  P --> S
  S --> C
```
