import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  FolderOpen,
  Pencil,
  Tag,
  Trash2,
  User,
  Weight,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { EmptyState } from "@/components/dashboard/StateKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useRole } from "@/hooks/use-role";
import { useFmt, useT } from "@/lib/i18n";
import {
  deleteDocumentFn,
  listDocumentsFn,
  updateDocumentFn,
  type Document,
} from "@/lib/documents.functions";

export const Route = createFileRoute("/documents/$docId")({
  ssr: false,
  loader: async ({ params }) => {
    const docs = await listDocumentsFn();
    const doc = docs.find((d) => d.id === params.docId);
    if (!doc) throw notFound();
    return doc;
  },
  component: DocDetailPage,
  notFoundComponent: DocNotFound,
  errorComponent: ({ error }) => (
    <AppShell>
      <div role="alert" className="p-6 text-sm text-destructive">
        {error.message}
      </div>
    </AppShell>
  ),
});

const TYPE_COLOR: Record<Document["type"], string> = {
  pdf: "oklch(0.62 0.18 25)",
  docx: "oklch(0.55 0.16 240)",
  xlsx: "oklch(0.55 0.16 145)",
  pptx: "oklch(0.62 0.18 50)",
};

function DocNotFound() {
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <h2 className="mb-2 text-xl font-bold text-foreground">{t("doc.notFound")}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{t("doc.notFound.desc")}</p>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("doc.back")}
        </Link>
      </div>
    </AppShell>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 break-words text-sm text-foreground">{value || "—"}</div>
      </div>
    </div>
  );
}

function DocDetailPage() {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const { isAdmin, isModerator, isPlatformAdmin } = useRole();
  const canWrite = isAdmin || isModerator || isPlatformAdmin;

  const doc = Route.useLoaderData() as Document;

  const updateFn = useServerFn(updateDocumentFn);
  const deleteFn = useServerFn(deleteDocumentFn);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fields: CrudField[] = [
    { name: "name", label: t("doc.col.name"), type: "text", required: true },
    { name: "category", label: t("doc.col.cat"), type: "text", required: true },
    {
      name: "type",
      label: t("doc.col.type"),
      type: "select",
      options: [
        { value: "pdf", label: "PDF" },
        { value: "docx", label: "DOCX" },
        { value: "xlsx", label: "XLSX" },
        { value: "pptx", label: "PPTX" },
      ],
    },
    { name: "size", label: t("doc.col.size"), type: "text", placeholder: "2.4 MB" },
    { name: "uploadedBy", label: t("doc.col.uploader"), type: "text" },
  ];

  const onSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      await updateFn({ data: { id: doc.id, ...(v as object) } as never });
      toast.success(t("common.updated"));
      setOpen(false);
      await router.invalidate();
    } catch {
      toast.error(t("common.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(t("common.confirmDelete", { name: doc.name }))) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { id: doc.id } });
      toast.success(t("common.deletedToast"));
      router.navigate({ to: "/documents" });
    } catch {
      toast.error(t("common.deleteError"));
      setDeleting(false);
    }
  };

  const subtitle = [doc.category, doc.type?.toUpperCase(), doc.size].filter(Boolean).join(" · ");

  return (
    <AppShell>
      <Link
        to="/documents"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("doc.back")}
      </Link>

      {/* Header */}
      <div
        className="relative mb-5 overflow-hidden rounded-2xl border border-border p-6 shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold uppercase text-primary-foreground shadow-[var(--shadow-md)]"
            style={{ background: TYPE_COLOR[doc.type] }}
            aria-hidden="true"
          >
            {doc.type}
          </div>
          <div className="min-w-0 flex-1 text-primary-foreground">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-card/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold backdrop-blur">
              {doc.id}
            </div>
            <h1 className="break-words text-2xl font-bold tracking-tight">{doc.name}</h1>
            <p className="mt-1.5 text-sm text-primary-foreground/80">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Desktop actions */}
      <div className="mb-5 hidden flex-wrap items-center gap-2 sm:flex">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("common.download")}
        </button>
        {canWrite && (
          <>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {t("doc.edit")}
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("doc.delete")}
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-5 pb-24 sm:pb-0 lg:grid-cols-3">
        {/* Preview */}
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-base font-semibold text-foreground">{t("doc.preview.title")}</h2>
            </div>
            <EmptyState
              title={t("doc.preview.unavailable")}
              description={t("doc.preview.unavailableDesc")}
              icon={<FileText className="h-6 w-6" />}
            />
          </section>
        </div>

        {/* Metadata */}
        <div>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="mb-2 text-base font-semibold text-foreground">{t("doc.meta.title")}</h2>
            <div className="divide-y divide-border">
              <MetaRow icon={Tag} label={t("doc.col.cat")} value={doc.category} />
              <MetaRow
                icon={FolderOpen}
                label={t("doc.col.type")}
                value={doc.type?.toUpperCase()}
              />
              <MetaRow icon={Weight} label={t("doc.col.size")} value={doc.size} />
              <MetaRow icon={User} label={t("doc.col.uploader")} value={doc.uploadedBy} />
              <MetaRow icon={Calendar} label={t("doc.col.date")} value={fmt.date(doc.uploadedAt)} />
            </div>
          </section>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
        <button
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {t("common.download")}
        </button>
        {canWrite && (
          <>
            <button
              onClick={() => setOpen(true)}
              aria-label={t("doc.edit")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              aria-label={t("doc.delete")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-destructive disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <CrudModal
        open={open}
        title={t("common.editTitle")}
        fields={fields}
        initial={doc as unknown as CrudValues}
        submitting={submitting}
        submitLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
        onSubmit={onSubmit}
        onClose={() => setOpen(false)}
      />
    </AppShell>
  );
}
