# BC-Mobile-6B — UI/UX Contract: Relationship Intelligence Actions

## Philosophy
Calm, executive-minimal, human-controlled. Actions appear only where a
recommendation already exists; nothing pulses, nudges, or automates.

## Surfaces

### Home (`/connect-app` — Executive Home)
- Unchanged from 6A: suggestion rows remain one-tap navigation to Person
  Detail. No action buttons on Home rows (cognitive-load rule).

### Person Detail (`/connect-app/network/:personId`)
- The 6A "V · Gợi ý" section gains exactly ONE contextual entry:
  a secondary pill button **[ Liên hệ / Contact ]**
  (`data-testid="bc6b-contact"`), rendered ONLY when:
  1. a recommendation exists, and
  2. the person resolves through the current authorized DTO (2C
     fail-closed), and
  3. the deterministic resolver yields at least one available action.
- Blocked/unavailable/error person → button does not exist. A stale
  recommendation can never expose an action.

### RelationshipActionSheet
- Bottom sheet (vaul Drawer, 5C sheet semantics: Escape/backdrop close,
  explicit close button with `aria-label`).
- Header: avatar (or initial fallback), name, `role · company` context line,
  and the grounded suggestion text as the description.
- Body: list of available actions only — **omitted, never disabled**:
  | Action | Label VI / EN | Transport |
  | --- | --- | --- |
  | Call | Gọi / Call | `tel:` anchor — OS handoff |
  | Email | Email / Email | `mailto:` anchor — OS handoff |
  | Save meeting moment | Lưu khoảnh khắc / Save meeting moment | navigates to `/connect-app/moment/:personId` |
- Order is deterministic (call → email → moment), mapped from the
  `reconnect` recommendation type. Unknown types yield no actions.
- Every row ≥ 44px touch target, visible focus ring, per-action
  `aria-label` including the person's name.
- When no action is available the sheet shows one neutral line:
  "Không thể thực hiện hành động này lúc này. / This action isn't
  available right now."

## Truthful semantics
- Call/Email are *handoffs*: telemetry and UI say "opened", never
  "completed"/"sent". The OS owns the call/composer; the result is
  unknowable by design.
- Save meeting moment is a *canonical creation flow*: it opens the existing
  2E Moment composer; nothing is written until the user saves inside it.
- No drafts, no pre-filled messages, no background sending, no automation.

## Theming & i18n
- Semantic tokens only (`--bc-mobile-*`); axe-clean in light and dark.
- VI primary, EN full parity; all strings via typed `TKey`
  (`bc.mobile.intel.actions.*`).
