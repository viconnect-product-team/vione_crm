import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AssociationLandingView } from "@/components/landing/AssociationLandingView";
import { getPublicAssociationFn, type PublicAssociation } from "@/lib/associations.functions";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/h/$slug")({
  ssr: true,
  loader: async ({ params }) => {
    try {
      const assoc = await getPublicAssociationFn({ data: { slug: params.slug } });
      if (assoc) return assoc;
    } catch {
      /* fallback below */
    }
    const direct = await fetchNestApi<PublicAssociation | null>(
      `/public/association/${encodeURIComponent(params.slug)}`
    ).catch(() => null);
    if (!direct) throw notFound();
    return direct;
  },
  head: ({ loaderData }) => {
    const a = loaderData as PublicAssociation | undefined;
    const title = a ? `${a.name} — Hội viên` : "Hiệp hội";
    const desc = a?.tagline ?? a?.about ?? "Trang giới thiệu Hiệp hội và ứng dụng hội viên.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        ...(a?.logoUrl ? [{ property: "og:image", content: a.logoUrl }] : []),
      ],
    };
  },
  notFoundComponent: NotFound,
  component: AssociationLanding,
});

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Không tìm thấy Hiệp hội</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang giới thiệu chưa được công bố hoặc đường dẫn không đúng.
        </p>
        <Link
          to="/landing"
          className="mt-6 inline-block text-sm font-medium text-primary underline"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

function AssociationLanding() {
  const a = Route.useLoaderData();
  return <AssociationLandingView a={a} />;
}
