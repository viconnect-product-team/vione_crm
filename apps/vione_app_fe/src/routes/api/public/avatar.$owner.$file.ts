// BC-Mobile — public avatar delivery:
//   GET /api/public/avatar/<ownerId>/<file>
//
// The identity-avatars bucket is PRIVATE. Avatars must still render on the
// public digital card, so this route resolves an opaque, UUID-only path to a
// short-lived signed URL and redirects. Only strict `uuid/uuid.jpg` shapes
// are accepted (no traversal, no arbitrary object reads), and nothing about
// the owner is disclosed beyond the image bytes the owner published.

import { createFileRoute } from "@tanstack/react-router";

const AVATAR_BUCKET = "identity-avatars";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jpg$/i;

export const Route = createFileRoute("/api/public/avatar/$owner/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const owner = String(params.owner ?? "");
        const file = String(params.file ?? "");
        if (!UUID.test(owner) || !FILE.test(file)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Thử tạo signed URL (hoạt động với private bucket + service role key).
        const { data, error } = await supabaseAdmin.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(`${owner}/${file}`, 600);

        if (!error && data?.signedUrl) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: data.signedUrl,
              // Public image, but the signed target expires — keep the hop fresh.
              "Cache-Control": "public, max-age=300",
            },
          });
        }

        // Fallback: nếu bucket là public, thử lấy public URL trực tiếp.
        if (error) {
          console.warn("[avatar-route] createSignedUrl failed, trying public URL fallback:", error.message);
        }
        const { data: pubData } = supabaseAdmin.storage
          .from(AVATAR_BUCKET)
          .getPublicUrl(`${owner}/${file}`);

        if (pubData?.publicUrl) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: pubData.publicUrl,
              "Cache-Control": "public, max-age=300",
            },
          });
        }

        return new Response("Not found", { status: 404 });
      },
    },
  },
});
