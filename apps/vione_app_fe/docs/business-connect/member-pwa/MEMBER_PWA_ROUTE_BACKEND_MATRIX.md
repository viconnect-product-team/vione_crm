# Member PWA — Route × Backend Matrix (P0-A1)

Source of truth for every production route under `src/routes/m*.tsx`. Statuses:
`LIVE_BACKEND_VERIFIED`, `BACKEND_PARTIAL`, `BLOCKED_NO_BACKEND`,
`DEFERRED_BY_PRODUCT_DECISION`, `TEST_DEMO_ONLY`.

| Route                                                             | Hook / Server fn                                                                             | Table(s) / RPC                                                               | DTO                 | Status                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| `/m` (`m.tsx`)                                                    | `checkRenewalReminder`                                                                       | `notifications`, `members`                                                   | reminder ack        | LIVE_BACKEND_VERIFIED                                     |
| `/m` index (`m.index.tsx`)                                        | `getMyMember`, `getMyBenefits`, `listMyEvents`, `listNotifications`, `getMyAssociationBrand` | `members`, `events`, `notifications`, `associations`, `association_benefits` | member DTOs         | LIVE_BACKEND_VERIFIED                                     |
| `/m/events`                                                       | `listMyEvents`, `registerForEvent`                                                           | `events`, `event_registrations`                                              | `MyEvent[]`         | LIVE_BACKEND_VERIFIED                                     |
| `/m/checkin`                                                      | `getMyCheckinState`, `checkInMyself` (`member-app/checkin.functions`)                        | `member_checkins`, `members`, `events`                                       | `MyCheckinRecord[]` | LIVE_BACKEND_VERIFIED (P0-A2A · Option A online-required) |
| `/m/library`                                                      | `listDocuments`                                                                              | `documents`                                                                  | `LibraryDoc[]`      | LIVE_BACKEND_VERIFIED                                     |
| `/m/news`                                                         | `listNews`                                                                                   | `news`                                                                       | `NewsItem[]`        | LIVE_BACKEND_VERIFIED                                     |
| `/m/notifications`                                                | `listNotifications`, mark read/all, delete                                                   | `notifications`                                                              | list + counts       | LIVE_BACKEND_VERIFIED                                     |
| `/m/opportunities`                                                | `listOpportunities`, `expressInterest`                                                       | `opportunities`, `opportunity_interests`                                     | list + interest     | LIVE_BACKEND_VERIFIED                                     |
| `/m/perks`, `/m/perks/$id`                                        | `listPerks`, `getPerk`                                                                       | `perks`                                                                      | `Perk[]`            | LIVE_BACKEND_VERIFIED                                     |
| `/m/products`                                                     | `listMyProducts`, `requestQuote`                                                             | `products`, `quote_requests`                                                 | `MyProduct[]`       | LIVE_BACKEND_VERIFIED                                     |
| `/m/profile`                                                      | `getMyMember` (+ future update fn)                                                           | `members`, `profiles`                                                        | `MyMember`          | LIVE_BACKEND_VERIFIED (read) · edit → P0-A2               |
| `/m/renew`, `/m/renew/pay`, `/m/renew/history`, `/m/renew/result` | `getMyMembership`, `getRenewalQuote`, `payMyRenewal`, `getMyRenewalHistory`                  | `memberships`, `invoices`, `transactions`                                    | quote / receipt     | LIVE_BACKEND_VERIFIED                                     |
| `/m/messages`                                                     | `listConversations`, `listMessages`, `sendMessage`, `markConversationRead`                   | `messages`, `members`                                                        | conversation DTOs   | LIVE_BACKEND_VERIFIED                                     |
| `/m/members`                                                      | `listMembers`                                                                                | `members` (association-scoped)                                               | `DirectoryMember[]` | LIVE_BACKEND_VERIFIED                                     |
| `/m/history`                                                      | `getMyHistory`                                                                               | `activity_log`, `event_registrations`, `invoices`                            | `MyHistory`         | LIVE_BACKEND_VERIFIED                                     |
| `/m/card`                                                         | member-app functions                                                                         | `member_business_cards`, `card_settings`                                     | card DTO            | LIVE_BACKEND_VERIFIED (localStorage is UI cache only)     |
| `/m/business-cards`                                               | business-card server fns                                                                     | `member_business_cards`                                                      | card list           | LIVE_BACKEND_VERIFIED                                     |

## Structural verification

`src/__tests__/member-pwa-no-mock-imports.p0a1.test.ts` fails the build if a
production `src/routes/m*.tsx` file (or a component under
`src/components/member/**`) imports any fixture module listed in the P0-A gap
register. As of P0-A2A no `/m/*` route is a known violation; the file
still exports `KNOWN_VIOLATIONS = []` as a placeholder for future work.

## Not in P0-A scope

Desktop admin routes (`/members`, `/marketplace`, `/network`, dashboard
widgets) still import `members-data`, `marketplace-data`, `networking-data`,
etc. Those are called out in the Backend Runtime Audit and are handled in a
later phase (P0-B admin cutover), not here.
