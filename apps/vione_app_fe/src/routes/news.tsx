import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Eye, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill, StatCard } from "@/components/dashboard/PageKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { type NewsArticle } from "@/lib/extra-data";
import { createNewsFn, deleteNewsFn, listNewsFn, updateNewsFn } from "@/lib/news.functions";
import { useFmt, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/news")({
  ssr: false,
  loader: () => listNewsFn(),
  component: NewsPage,
});

const STATUS_KEY: Record<NewsArticle["status"], TKey> = {
  published: "news.status.published",
  scheduled: "news.status.scheduled",
  draft: "news.status.draft",
};
const STATUS_COLOR: Record<NewsArticle["status"], "success" | "info" | "neutral"> = {
  published: "success",
  scheduled: "info",
  draft: "neutral",
};

function NewsPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const NEWS = Route.useLoaderData() as NewsArticle[];
  const published = NEWS.filter((n) => n.status === "published");
  const totalViews = published.reduce((s, n) => s + n.views, 0);

  const createFn = useServerFn(createNewsFn);
  const updateFn = useServerFn(updateNewsFn);
  const deleteFn = useServerFn(deleteNewsFn);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fields: CrudField[] = [
    { name: "title", label: t("news.col.title"), type: "text", required: true, placeholder: "Nhập tiêu đề bài viết tin tức..." },
    { name: "category", label: t("news.col.category"), type: "text", required: true, placeholder: "VD: Hoạt động CLB, Giao thương B2B, Thông báo..." },
    { name: "author", label: t("news.col.author"), type: "text", required: true, placeholder: "VD: Ban Thư Ký, Ban Truyền Thông..." },
    { name: "publishedAt", label: t("news.col.date"), type: "text", placeholder: "YYYY-MM-DD (VD: 2026-09-27)" },
    {
      name: "status",
      label: t("events.col.status"),
      type: "select",
      options: [
        { value: "draft", label: t("news.status.draft") },
        { value: "scheduled", label: t("news.status.scheduled") },
        { value: "published", label: t("news.status.published") },
      ],
    },
    {
      name: "image",
      label: "Ảnh đại diện bài viết",
      type: "image",
      placeholder: "Tải ảnh lên từ máy tính hoặc dán link ảnh...",
    },
    { name: "excerpt", label: t("news.col.excerpt"), type: "textarea", placeholder: "Nhập đoạn tóm lược nội dung chính hiển thị ngoài danh sách tin tức..." },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateFn({ data: { id: editing.id, ...(v as object) } as never });
        toast.success(t("common.updated"));
      } else {
        await createFn({ data: v as never });
        toast.success(t("common.created"));
      }
      setOpen(false);
      setEditing(null);
      await router.invalidate();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (n: NewsArticle) => {
    if (!window.confirm(t("common.confirmDelete", { name: n.title }))) return;
    setDeletingId(n.id);
    try {
      await deleteFn({ data: { id: n.id } });
      toast.success(t("common.deletedToast"));
      await router.invalidate();
    } catch {
      toast.error(t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={t("news.title")}
        subtitle={t("news.subtitle")}
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("news.create")}
          </button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("news.kpi.total")}
          value={NEWS.length}
          icon={<Newspaper className="h-4 w-4" />}
        />
        <StatCard
          label={t("news.kpi.published")}
          value={published.length}
          tone="success"
          icon={<Newspaper className="h-4 w-4" />}
        />
        <StatCard
          label={t("news.kpi.views")}
          value={fmt.num(totalViews)}
          tone="info"
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {NEWS.map((n: any) => (
          <Card key={n.id} className="group overflow-hidden transition hover:shadow-[var(--shadow-glow)]">
            {n.image ? (
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <img
                  src={n.image}
                  alt={n.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div
                className="flex h-36 w-full items-center justify-center text-primary-foreground/40"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Newspaper className="h-10 w-10 opacity-30" />
              </div>
            )}
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {n.category}
                </span>
                <Pill color={STATUS_COLOR[n.status as NewsArticle["status"]]}>{t(STATUS_KEY[n.status as NewsArticle["status"]])}</Pill>
              </div>
              <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground">
                {n.title}
              </h3>
              <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{n.excerpt}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {n.author} · {fmt.date(n.publishedAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {fmt.num(n.views)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
                <button
                  onClick={() => {
                    setEditing(n);
                    setOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => onDelete(n)}
                  disabled={deletingId === n.id}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={open}
        title={editing ? t("common.editTitle") : t("news.create")}
        fields={fields}
        initial={editing ? (editing as unknown as CrudValues) : undefined}
        submitting={submitting}
        submitLabel={editing ? t("common.save") : t("common.create")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
    </AppShell>
  );
}
