# BC-Mobile Route Matrix

Baseline for BC-Mobile-0. Legacy routes remain functional; `/connect-app/*` is the frozen target surface.

## Target (new)

| route | current purpose | backend source | mock/live | future action |
|---|---|---|---|---|
| `/connect-app` | Mobile shell layout (auth-guarded) | platform-identity fns | live | 0B: create layout + shell |
| `/connect-app` (index) | Trang chủ / Home | work-hub + notifications SDKs (planned) | live | 0B: placeholder; 0C+: real home |
| `/connect-app/network` | Network | `GlobalNetworkSDK` via `use-global-network` | live | 0B: placeholder; then connections list |
| `/connect-app/community` | Cộng đồng / Community | none exists yet | n/a | 0B: placeholder + explicit unavailable state (never fake communities) |
| `/connect-app/me` | Tôi / Me | platform-identity fns, card SDKs | live | 0B: placeholder; then profile/card hub |
| `/connect-app/network/$personId` | reserved | GlobalNetworkSDK counterpart DTOs | live | reserved |
| `/connect-app/community/$communityId` | reserved | none | n/a | reserved |
| `/connect-app/me/card` | reserved | business-card SDKs + QrCanvas | live | reserved (V "Present QR" target) |

## Member PWA (legacy, stays live)

| route | current purpose | backend source | mock/live | future action |
|---|---|---|---|---|
| `/m` | Member home | `member-app/profile.functions` | live | unchanged; later converge into `/connect-app` home |
| `/m/card` | Member identity card + QR | `member-app/profile.functions` | live | unchanged; QR primitives feed V "Present QR" |
| `/m/notifications` | Member notifications | `member-app/notifications.functions` | live | unchanged |
| `/m/messages` | Member messages | `member-app/messages.functions` | live | unchanged |
| `/m/events` | Member events | `member-app/events.functions` | live | unchanged |
| `/m/history` | Activity history | `member-app/history.functions` | live | unchanged |
| `/m/library` | Content library | `member-app/content.functions` | live | unchanged |
| `/m/members` | Member directory | `member-app/directory.functions` | live | unchanged |
| `/m/news` | News | `member-app/content.functions` | live | unchanged |
| `/m/opportunities` | Opportunities | `member-app/opportunities.functions` | live | unchanged |
| `/m/perks`, `/m/perks/$id` | Perks | `member-app/marketplace.functions` | live | unchanged |
| `/m/products` | Marketplace | `member-app/marketplace.functions` | live | unchanged |
| `/m/profile` | Member profile | `member-app/profile.functions` | live | unchanged |
| `/m/renew*` (5 routes) | Renewal flow + audit | `member-app/renewal.functions` | live | unchanged |
| `/m/checkin` | Event check-in | `member-app/checkin.functions` | live | unchanged |
| `/m/business-cards` | Saved business cards | business-card SDKs | live | unchanged |

## Business Connect (legacy, stays live)

| route | current purpose | backend source | mock/live | future action |
|---|---|---|---|---|
| `/business-connect` | Overview | work-hub SDK | live | unchanged (desktop surface) |
| `/business-connect/my-card` | Card builder | business-card fns | live | unchanged |
| `/business-connect/saved-cards` | Saved cards library | SavedCardSDK | live | unchanged |
| `/business-connect/connections` (+`$personNodeId`) | Connection workspace | GlobalNetworkSDK | live | feeds `/connect-app/network` reuse |
| `/business-connect/meetings*` | Meeting workspace | MeetingWorkspaceSDK | live | unchanged |
| `/business-connect/memory` | Relationship memory explorer | relationship-memory fns | live | unchanged |
| `/business-connect/notifications` | Notification center | NotificationOrchestrationSDK | live | feeds mobile top-bar bell |
| `/business-connect/relationship-timeline` | Timeline | timeline fns | live | unchanged |
| `/business-connect/introductions.*` (6 routes) | Smart introductions | introduction fns | live | unchanged |
| `/connect` | Connect layout/home | — | live | unchanged |
| `/connect/cards`, `/connect/cards/$cardId/edit` | Card gallery/builder | card fns | live | unchanged |
| `/connect/meetings/$section` | Meetings | MeetingSDK | live | unchanged |
| `/connect/network/*` (4 routes) | Network sections | GlobalNetworkSDK | live | primary reuse source for `/connect-app/network` |
| `/connect/calendar-settings` | Calendar prefs | calendar fns | live | unchanged |
| `/b/$slug` | Public business card | `getPublicBusinessCardFn` (public) | live | unchanged; scan-QR target |
| `/h/$slug` | Association landing | public fns | live | unchanged |
| `/company/$slug` | Company profile | public fns | live | unchanged |

## Legacy mock-backed admin routes (not in reuse path)

| route | current purpose | backend source | mock/live | future action |
|---|---|---|---|---|
| `/network` | Admin networking | `members-data`, `networking-data` (+`CURRENT_USER_ID`) | **mock** | MUST_REPLACE later; never import into `/connect-app` (ESLint blocks) |
| `/opportunities`, `/opportunities/$id` | Admin opportunities | `networking-data` (+`CURRENT_USER_ID`) | **mock** | MUST_REPLACE later |
| `/fees*` | Fee admin | `fees-data` | mock | out of scope |
| `/segments` | Segmentation | `members-data` | mock | out of scope |
| `/news` | Admin news | `extra-data` (types only) | mock | out of scope |
