// BC-Mobile-3B — anonymous guest share-contact endpoint:
//   POST /api/public/card/<slug>/contact
//
// A guest on the public card shares their OWN contact back with the card
// owner — no account required. The request carries NO owner id, card id, or
// guest id: the share_guest_contact RPC resolves slug → published+public
// card → owner independently server-side. The response is the bounded,
// leak-free GuestShareResponse (never internal identifiers).
//
// Abuse controls: per-IP + per-card rate limits, a silent-drop honeypot
// (bots get a fake success; nothing persists), and triple-layer validation
// (client → this route → the SQL function).

import { createFileRoute } from "@tanstack/react-router";
import { isValidPublicSlug } from "@/lib/business-card/public-card";
import {
  GUEST_CONSENT_VERSION,
  guestShareError,
  guestShareSuccess,
  validateGuestContactSubmission,
  type GuestShareResponse,
} from "@/lib/business-card/guest-contact";
import { allowPublicRequest, clientKey } from "@/lib/public-rate-limit";

// ~8 submissions/min per client IP (a real guest submits once) and 20/min
// per card (protects one owner from a coordinated flood).
const CONTACT_RATE_LIMIT_PER_IP = 8;
const CONTACT_RATE_LIMIT_PER_CARD = 20;
const RATE_WINDOW_MS = 60_000;

function json(body: GuestShareResponse, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export const Route = createFileRoute("/api/public/card/$slug/contact")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        if (!allowPublicRequest(clientKey(request), CONTACT_RATE_LIMIT_PER_IP, RATE_WINDOW_MS)) {
          return json(guestShareError("rate_limited"), 429);
        }

        const slug = params.slug ?? "";
        if (!isValidPublicSlug(slug)) {
          return json(guestShareError("card_unavailable"), 404);
        }
        if (
          !allowPublicRequest(`card-contact:${slug}`, CONTACT_RATE_LIMIT_PER_CARD, RATE_WINDOW_MS)
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

        const validated = validateGuestContactSubmission(body);
        if (!validated.ok) {
          return json(guestShareError("invalid_payload", validated.detail), 400);
        }
        const d = validated.data;

        try {
          const nestApiUrl =
            (typeof process !== "undefined" &&
              (process.env?.NEST_API_URL || process.env?.VITE_API_URL)) ||
            "http://localhost:4000";

          const res = await fetch(
            `${nestApiUrl}/api/public/card/${encodeURIComponent(slug)}/contact`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                displayName: d.displayName,
                phone: d.phone,
                email: d.email,
                companyName: d.companyName,
                title: d.title,
                consentVersion: GUEST_CONSENT_VERSION,
                clientToken: d.clientToken,
              }),
            },
          );

          if (!res.ok) {
            console.error("[guest-contact] nestapi failed:", res.status);
            return json(guestShareError("submission_failed"), 500);
          }

          // Rebuild the response from scratch — the RPC payload is never
          // passed through verbatim (future-proof leak guard).
          const rpc = (await res.json()) as {
            ok?: boolean;
            result?: string;
            error?: string;
          } | null;
          if (
            rpc?.ok === true &&
            (rpc.result === "created" || rpc.result === "replay" || rpc.result === "merged")
          ) {
            return json(guestShareSuccess(rpc.result), 200);
          }
          if (rpc?.error === "card_unavailable")
            return json(guestShareError("card_unavailable"), 404);
          if (rpc?.error === "exchange_disabled")
            return json(guestShareError("exchange_disabled"), 403);
          if (rpc?.error === "invalid_payload")
            return json(guestShareError("invalid_payload"), 400);
          console.error("[guest-contact] unexpected nestapi payload");
          return json(guestShareError("submission_failed"), 500);
        } catch (e) {
          console.error("[guest-contact] unexpected failure:", e);
          return json(guestShareError("submission_failed"), 500);
        }
      },
    },
  },
});
