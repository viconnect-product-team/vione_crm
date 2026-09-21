# BC-0.1 — Call Graphs

Notation: `UI route → hook/component → server function → helper/RPC → table → RLS/policy`.
All server functions run through `requireSupabaseAuth` unless marked **(public)**.

---

## A. Create / edit Business Card

```
/m/business-cards (m.business-cards.tsx)
  → useServerFn(saveBusinessCardFn)
    → saveBusinessCardFn (business-card.functions.ts)
      → resolveMemberId(supabase)  → rpc current_member_id()  [NULL ⇒ throw BC_NO_PROFILE]
      → resolveAssociationId(supabase) → rpc current_association_id()
      → supabase.from("member_business_cards").upsert(... member_id, association_id)
      → supabaseAdmin → rpc log_business_card_member_event  (audit)
  tables: member_business_cards, business_card_{skills,services,needs}, business_card_audit
  RLS: "Owner inserts/updates own card" (member_id = current_member_id())
```

## B. Open public Business Card **(public)**

```
/b/$slug (b.$slug.tsx) loader/useServerData
  → getPublicBusinessCardFn(slug)          [no auth middleware]
      → anon createClient(SUPABASE_URL, PUBLISHABLE_KEY)
      → .from("member_business_cards").eq(status,published).maybeSingle()
      → if null: supabaseAdmin.select(public_mode)  ⇒ members_only | not_found
      → anon .from(business_card_{skills,services,needs})
  RLS: "Public reads published public cards" (status=published AND public_mode=public), anon
```

## C. Save / share Business Card (view interactions)

```
/b/$slug share actions → interaction logging
  → business-card interaction fns → business_card_interactions insert
  ownership read: owns_business_card(card_id) OR manages_business_card(card_id)
  RLS: "Interactions owner read" (member/manager)
  NOTE: outbound "save" is client-side (vcard/QR); no user_id path for anon savers.
```

## D. Send connection request

```
/network (network.tsx) → MemberNetworking component
  → useServerFn(net_send_request via networking fn)
    → resolveMemberId  [required]
    → rpc net_send_request(_peer)   (SECURITY DEFINER)
      → validates peer in same current_association_id()
      → inserts pending_outgoing/pending_incoming pair
  table: connections   RLS: connections_owner_* (owner_id = current_member_id())
```

## E. Accept connection

```
/network → net_accept_request(peer)
  → rpc net_accept_request → connections upsert 'connected' (both rows)
    → add_member_notification(peer, ...) → member_notifications
  requires current_member_id() on BOTH sides
```

## F. Send message

```
/network chat → networking.functions.ts message send
  → resolveMemberId
  → supabase.from("messages").insert(from_id, to_id, association_id)
  table: messages   RLS: messages_member_* (member, assoc-scoped)
```

## G. Create Marketplace listing

```
/marketplace/workspace (marketplace.workspace.tsx)
  → useServerFn(create product fn) (marketplace.functions.ts)
    → resolveMemberId  [required]
    → supabase.from("products").insert(member_id, association_id)
    → supabaseAdmin (some enrich/audit paths)
  table: products   RLS: products_member_insert / products_select_assoc
```

## H. Book / create meeting

```
/meetings (meetings.tsx)
  → useServerFn(create meeting fn) (meetings.functions.ts)  [no resolveMemberId]
    → supabase.from("meetings").insert(association_id, code)
  table: meetings   RLS: meetings_admin_insert (has_assoc_role admin OR platform admin)
  NOTE: meetings are ADMIN-owned per association, not per-user hosts.
```

## I. Join campaign

```
/email-marketing (email-marketing.tsx)
  → campaigns.functions.ts (list/save/delete)  [no resolveMemberId]
    → supabase.from("email_campaigns")...
  table: email_campaigns   RLS: email_campaigns_admin_* (has_assoc_role admin)
  NOTE: campaigns are an ADMIN outbound tool; there is no member "join campaign" flow today.
```

## J. Ask AI Assistant

```
/ai (ai.tsx) → MessageBubble/send
  → useServerFn(askAssistant | askAssociationAiFn) (ai.functions.ts)
    → resolveAssociationId(supabase)   [member row NOT required; membership is]
    → Lovable AI Gateway (LOVABLE_API_KEY) or mock fallback
    → supabaseAdmin.from("app_settings") read provider mode
    → supabaseAdmin.from("ai_request_audit").insert(...)  + logActivity
  tables: app_settings (read, svc), ai_request_audit (write, svc), activity_log
  RLS: ai_request_audit svc-only; guard = requireSupabaseAuth + assoc resolution
```
