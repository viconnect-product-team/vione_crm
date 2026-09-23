// BC-Mobile-2E — /connect-app/moment/$personId (Meeting Moment composer).
// Authorization is enforced server-side on prepare/finalize; the composer
// itself fail-closes through the frozen 2C person resolution.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { MomentComposer } from "@/components/business-connect/mobile/MomentComposer";

export function sanitizePersonId(personId: string): string {
  if (!personId || personId === "general" || personId === "all") return "general";
  let decoded = String(personId).trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}
  if (/^([ucg]):[0-9a-fA-F-]{36}$/.test(decoded)) {
    return decoded;
  }
  if (/^[0-9a-fA-F-]{36}$/.test(decoded)) {
    return `u:${decoded}`;
  }
  const match = decoded.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (match) {
    return `u:${match[0]}`;
  }
  return "general";
}

export const Route = createFileRoute("/connect-app/moment/$personId")({
  head: () => ({
    meta: [{ title: "Lưu khoảnh khắc — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: MomentComposerPage,
});

function MomentComposerPage() {
  const { personId: rawPersonId } = Route.useParams();
  const navigate = useNavigate();
  const cleanPersonId = useMemo(() => sanitizePersonId(rawPersonId), [rawPersonId]);

  useEffect(() => {
    if (rawPersonId && cleanPersonId && rawPersonId !== cleanPersonId) {
      void navigate({
        to: "/connect-app/moment/$personId",
        params: { personId: cleanPersonId },
        replace: true,
      });
    }
  }, [rawPersonId, cleanPersonId, navigate]);

  return <MomentComposer personId={cleanPersonId} />;
}
