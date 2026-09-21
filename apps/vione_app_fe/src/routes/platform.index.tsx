import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader, Pill, StatCard, fmtDate } from "@/components/dashboard/PageKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useT } from "@/lib/i18n";
import {
  createAssociationFn,
  deleteAssociationFn,
  listAssociationsFn,
  updateAssociationFn,
  type PlatformAssociation,
} from "@/lib/platform.functions";

export const Route = createFileRoute("/platform/")({
  component: PlatformAssociationsPage,
});

function PlatformAssociationsPage() {
  const t = useT();
  const { isPlatformAdmin, loading: roleLoading } = useRole();

  const fetchAssocs = useServerFn(listAssociationsFn);
  const createAssoc = useServerFn(createAssociationFn);
  const updateAssoc = useServerFn(updateAssociationFn);
  const deleteAssoc = useServerFn(deleteAssociationFn);

  const {
    data: assocs,
    loading: aLoading,
    reload: reloadAssocs,
  } = useServerData<PlatformAssociation[]>(
    () => (isPlatformAdmin ? fetchAssocs() : Promise.resolve([])),
    [],
  );

  const [assocOpen, setAssocOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformAssociation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) reloadAssocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin]);

  if (!roleLoading && !isPlatformAdmin) {
    return (
      <PlatformShell>
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          {t("platform.forbidden")}
        </Card>
      </PlatformShell>
    );
  }

  const assocFields: CrudField[] = [
    { name: "name", label: t("platform.assoc.name"), type: "text", required: true },
    {
      name: "slug",
      label: t("platform.assoc.slug"),
      type: "text",
      placeholder: "vd: hiep-hoi-abc",
    },
  ];

  const onAssocSubmit = async (v: CrudValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateAssoc({ data: { id: editing.id, ...(v as object) } as never });
        toast.success(t("common.updated"));
      } else {
        await createAssoc({ data: v as never });
        toast.success(t("common.created"));
      }
      setAssocOpen(false);
      setEditing(null);
      reloadAssocs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteAssoc = async (a: PlatformAssociation) => {
    if (!confirm(`${a.name}?`)) return;
    try {
      await deleteAssoc({ data: { id: a.id } });
      toast.success(t("common.deletedToast"));
      reloadAssocs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <PlatformShell>
      <PageHeader
        title={t("platform.tab.assoc")}
        subtitle={t("platform.subtitle")}
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setAssocOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-4 w-4" /> {t("platform.assoc.new")}
          </button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("platform.assoc.count")}
          value={assocs.length}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          label={t("platform.assoc.admins")}
          value={assocs.reduce((s, a) => s + a.adminCount, 0)}
          tone="info"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label={t("platform.assoc.members")}
          value={assocs.reduce((s, a) => s + a.memberCount, 0)}
          tone="success"
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">{t("platform.assoc.name")}</th>
              <th className="px-5 py-3">{t("platform.assoc.slug")}</th>
              <th className="px-5 py-3">{t("platform.assoc.members")}</th>
              <th className="px-5 py-3">{t("platform.assoc.admins")}</th>
              <th className="px-5 py-3">{t("platform.assoc.created")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {aLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                  …
                </td>
              </tr>
            ) : (
              assocs.map((a: any) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{a.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{a.slug ?? "—"}</td>
                  <td className="px-5 py-3">{a.memberCount}</td>
                  <td className="px-5 py-3">
                    <Pill color="info">{a.adminCount}</Pill>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(a.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setAssocOpen(true);
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDeleteAssoc(a)}
                        className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-accent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {assocOpen && (
        <CrudModal
          open={assocOpen}
          title={editing ? t("platform.assoc.name") : t("platform.assoc.new")}
          fields={assocFields}
          initial={editing ? { name: editing.name, slug: editing.slug ?? "" } : {}}
          submitting={submitting}
          submitLabel={t("common.save")}
          cancelLabel={t("common.cancel")}
          onSubmit={onAssocSubmit}
          onClose={() => {
            setAssocOpen(false);
            setEditing(null);
          }}
        />
      )}
    </PlatformShell>
  );
}
