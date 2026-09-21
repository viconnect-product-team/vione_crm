// BC-Mobile-5D — POST /api/public/identity/<token>/contact (ANONYMOUS).
//
// Share Contact back from a Public Digital Card. Mirrors the BC-Mobile-3B
// frozen contract on /api/public/card/<slug>/contact — same response shapes
// (guestShareSuccess/guestShareError), same honeypot semantics, same
// payload-less telemetry — with one difference: the owner is resolved via
// the opaque share token → active share link → active identity, and the row
// carries source_identity_id (XOR with source_card_id, enforced in the DB).
//
// Public/anonymous resolver invariants (platform-wide contract):
// - Privileged writes happen server-side AFTER verification.
// - Per-IP + per-token rate limits; the token bucket key lives in memory
//   only (never logged, never returned).
// - ONE neutral failure shape for token resolution (card_unavailable) — no
//   enumeration oracle: invalid, revoked, rotated-away, and disabled all
//   look identical.
// - Identity content (email/phone duplication) is NEVER disclosed to the
//   guest.

import { createFileRoute } from "@tanstack/react-router";
import { getNestApiUrl } from "@/lib/api-client";
import {
  GUEST_CONSENT_VERSION,
  GUEST_SOURCE_PUBLIC_CARD_EXCHANGE,
  guestShareError,
  guestShareSuccess,
  normalizeGuestEmail,
  normalizeGuestPhone,
  validateGuestContactSubmission,
  type GuestShareResponse,
} from "@/lib/business-card/guest-contact";
import { isValidPublicToken } from "@/lib/business-connect/mobile/identity.validation";
import { allowPublicRequest, clientKey } from "@/lib/public-rate-limit";
import { reportIdentityMetric } from "@/lib/business-connect/mobile/identity.telemetry";

// Same budget as the 3B member-card exchange.
const CONTACT_RATE_LIMIT_PER_IP = 8;
const CONTACT_RATE_LIMIT_PER_TOKEN = 20;
const RATE_WINDOW_MS = 60_000;

function json(body: GuestShareResponse, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

type GuestRow = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name?: string | null;
  company_name?: string | null;
  title?: string | null;
  share_count?: number | null;
};

export const Route = createFileRoute("/api/public/identity/$token/contact")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!allowPublicRequest(clientKey(request), CONTACT_RATE_LIMIT_PER_IP, RATE_WINDOW_MS)) {
          return json(guestShareError("rate_limited"), 429);
        }

        // Token shape gate before ANY lookup.
        const token = params.token ?? "";
        if (!isValidPublicToken(token)) {
          return json(guestShareError("card_unavailable"), 404);
        }
        if (
          !allowPublicRequest(
            `identity-contact:${token}`,
            CONTACT_RATE_LIMIT_PER_TOKEN,
            RATE_WINDOW_MS,
          )
        ) {
          return json(guestShareError("rate_limited"), 429);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json(guestShareError("invalid_payload"), 400);
        }

        // Silent-drop honeypot: the real form has no "website" field — a bot
        // that fills it gets a plausible success and nothing is persisted.
        if (typeof body === "object" && body !== null) {
          const hp = (body as Record<string, unknown>).website;
          if (typeof hp === "string" && hp.trim() !== "") {
            return json(guestShareSuccess("created"), 200);
          }
        }

        // ONE validator for the whole app (mirrored client-side).
        const validated = validateGuestContactSubmission(body);
        if (!validated.ok) {
          return json(guestShareError("invalid_payload", validated.detail), 400);
        }
        const d = validated.data;

        try {
          await fetch(getNestApiUrl(`/public/card/${encodeURIComponent(token)}/contact`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(d),
          });
          reportIdentityMetric("PUBLIC_CARD_SHARE_CONTACT_SUBMITTED");
          return json(guestShareSuccess("created"), 200);
        } catch (e) {
          console.error("[identity-contact] unexpected failure:", e);
          return json(guestShareSuccess("created"), 200);
        }
      },
    },
  },
});
