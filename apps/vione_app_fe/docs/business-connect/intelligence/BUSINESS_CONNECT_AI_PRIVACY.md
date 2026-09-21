# BC-9.0 — Privacy Invariants

## Hard exclusions (§6, §14, §15)

The following are **structurally** and **runtime** excluded from every AI code
path in Business Connect Intelligence:

1. `business_meeting_private_notes` — private notes are never fetched,
   indexed, embedded, summarized, prompted, audited, or exposed via AI, even
   to organizers or admins.
2. Hidden contact details (private phone/email not authorized for the capability).
3. Raw email inboxes.
4. Unrestricted notification payloads.
5. Raw audit logs, raw timeline metadata.
6. Provider secrets, authentication identifiers.
7. Cross-tenant / cross-association data.

## Enforcement layers

| Layer            | Mechanism                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Type system      | `BusinessConnectSafeFact` union has no private-note variant                                                                                  |
| Registry         | `BUSINESS_CONNECT_AI_CAPABILITY_SOURCES` allowlists do not include `private_meeting_notes`                                                   |
| Eligibility      | `assertPrivateNotesExcluded()` static assertion                                                                                              |
| Redaction        | `assertSafeFact` walks every fact and throws on forbidden keys                                                                               |
| Static gate      | `business-connect-ai-context.bc90.test.ts` greps every intelligence source file for the private-notes table name — build fails if introduced |
| Runtime (Turn B) | Tool executor exposes no `get_private_notes` tool; SQL layer denies via RLS                                                                  |

## Sensitive-attribute policy (§15)

AI **must not** infer or classify:

- health, religion, ethnicity, political affiliation, sexual orientation
- financial condition, wealth estimate, creditworthiness
- personality diagnosis, emotional vulnerability
- protected legal status

Every prompt embeds this rule in the shared system instructions.

## Shared notes policy (§7)

Shared notes may enter context only when:

- viewer is authorized to read the shared note (canonical RLS)
- note belongs to the target meeting
- capability explicitly permits shared-note context
  (`meeting_preparation`, `follow_up_draft`)
- content passes redaction and length limits

Shared-note bodies are always ingested as **bounded summaries** (`bodySummary`
on `SharedNoteFact`), never verbatim raw bodies.
