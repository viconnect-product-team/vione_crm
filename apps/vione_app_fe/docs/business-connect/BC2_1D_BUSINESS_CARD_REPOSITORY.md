# BUSINESS_CARD_REPOSITORY — Persistence Layer (BC-2.1D)

The repository layer is the **only** code allowed to query Business Card tables
directly. Pure data access: no authorization, no DTO mapping, no business rules.
Each method takes an explicit `SupabaseClient` so the caller controls the auth
context (user-scoped RLS client, anon publishable client, or admin client).

## Modules & table ownership

| Repository               | File                          | Owns                                                                      |
| ------------------------ | ----------------------------- | ------------------------------------------------------------------------- |
| `BusinessCardRepository` | `business-card.repository.ts` | `member_business_cards`, `business_card_skills/services/needs`, audit RPC |
| `LeadRepository`         | `lead.repository.ts`          | `business_card_leads`, analytics reads from `business_card_interactions`  |
| `InteractionRepository`  | `interaction.repository.ts`   | `business_card_interactions` (write/timeline)                             |
| `RelationshipRepository` | `relationship.repository.ts`  | `saved_business_cards`                                                    |

## Dependency rule

No module outside these repositories may query the tables above. `LeadService`
scopes analytics by card id through `BusinessCardRepository.listCardIdsByMember`
so `member_business_cards` is never touched outside its repository.

## Rules

- No `throw`-based business errors — only surface DB errors.
- No mapping to DTOs (that is the service/mapper layer).
- RLS still applies; the repository does not bypass it.
