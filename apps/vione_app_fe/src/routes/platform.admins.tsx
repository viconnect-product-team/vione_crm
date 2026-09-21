import { createFileRoute } from "@tanstack/react-router";
import { Bot, Loader2, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { CrudModal, type CrudField, type CrudValues } from "@/components/dashboard/CrudModal";
import { useServerData } from "@/hooks/use-server-data";
import { useRole } from "@/hooks/use-role";
import { useT } from "@/lib/i18n";
import {
  createAssociationAdminFn,
  listAssociationAdminsFn,
  listAssociationsFn,
  removeAssociationAdminFn,
  updateAssociationAdminFn,
  type AssociationAdmin,
  type PlatformAssociation,
} from "@/lib/platform.functions";
import { Switch } from "@/components/ui/switch";
import {
  getAiProviderSettingFn,
  setAiProviderSettingFn,
  type AiProviderSetting,
} from "@/lib/ai-settings.functions";

export const Route = createFileRoute("/platform/admins")({
  component: PlatformAdminsPage,
});

function PlatformAdminsPage() {
  const t = useT();
  const { isPlatformAdmin, loading: roleLoading } = useRole();

  const fetchAssocs = useServerFn(listAssociationsFn);
  const fetchAdmins = useServerFn(listAssociationAdminsFn);
  const createAdmin = useServerFn(createAssociationAdminFn);
  const updateAdmin = useServerFn(updateAssociationAdminFn);
  const removeAdmin = useServerFn(removeAssociationAdminFn);

  const { data: assocs, reload: reloadAssocs } = useServerData<PlatformAssociation[]>(
    () => (isPlatformAdmin ? fetchAssocs() : Promise.resolve([])),
    [],
  );
  const {
    data: admins,
    loading: adLoading,
    reload: reloadAdmins,
  } = useServerData<AssociationAdmin[]>(
    () => (isPlatformAdmin ? fetchAdmins() : Promise.resolve([])),
    [],
  );

  const [adminOpen, setAdminOpen] = useState(false);
  const [editing, setEditing] = useState<AssociationAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin) {
      reloadAssocs();
      reloadAdmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin]);

  const assocName = (id: string) => assocs.find((a) => a.id === id)?.name ?? "—";

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

  const adminFields: CrudField[] = [
    {
      name: "associationId",
      label: t("platform.admin.assoc"),
      type: "select",
      required: true,
      options: assocs.map((a: any) => ({ value: a.id, label: a.name })),
    },
    { name: "fullName", label: t("platform.admin.fullName"), type: "text", required: true },
    { name: "email", label: t("platform.admin.email"), type: "text", required: true },
    { name: "password", label: t("platform.admin.password"), type: "text", required: true },
  ];

  const editFields: CrudField[] = [
    {
      name: "associationId",
      label: t("platform.admin.assoc"),
      type: "select",
      required: true,
      options: assocs.map((a: any) => ({ value: a.id, label: a.name })),
    },
    { name: "fullName", label: t("platform.admin.fullName"), type: "text", required: true },
    { name: "password", label: t("platform.admin.passwordEdit"), type: "text" },
  ];

  const onAdminSubmit = async (v: CrudValues) => {
    if (String((v as Record<string, unknown>).password ?? "").length < 8) {
      toast.error(t("platform.admin.passwordHint"));
      return;
    }
    setSubmitting(true);
    try {
      await createAdmin({ data: v as never });
      toast.success(t("common.created"));
      setAdminOpen(false);
      reloadAdmins();
      reloadAssocs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (v: CrudValues) => {
    if (!editing) return;
    const pwd = String((v as Record<string, unknown>).password ?? "");
    if (pwd.length > 0 && pwd.length < 8) {
      toast.error(t("platform.admin.passwordHint"));
      return;
    }
    setSubmitting(true);
    try {
      await updateAdmin({
        data: {
          membershipId: editing.membershipId,
          userId: editing.userId,
          associationId: String(v.associationId),
          fullName: String(v.fullName),
          password: pwd || undefined,
        } as never,
      });
      toast.success(t("common.updated"));
      setEditing(null);
      reloadAdmins();
      reloadAssocs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const onRemoveAdmin = async (m: AssociationAdmin) => {
    if (!confirm(`${m.email ?? m.fullName ?? ""}?`)) return;
    try {
      await removeAdmin({ data: { membershipId: m.membershipId } });
      toast.success(t("common.deletedToast"));
      reloadAdmins();
      reloadAssocs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <PlatformShell>
      <PageHeader
        title={t("platform.tab.admins")}
        subtitle={t("platform.subtitle")}
        actions={
          <button
            onClick={() => setAdminOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <UserPlus className="h-4 w-4" /> {t("platform.admin.new")}
          </button>
        }
      />

      <AiProviderToggle enabled={isPlatformAdmin} />

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">{t("platform.admin.fullName")}</th>
              <th className="px-5 py-3">{t("platform.admin.email")}</th>
              <th className="px-5 py-3">{t("platform.admin.assoc")}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {adLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  …
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  {t("platform.admin.empty")}
                </td>
              </tr>
            ) : (
              admins.map((m) => (
                <tr key={m.membershipId} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{m.fullName ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{m.email ?? "—"}</td>
                  <td className="px-5 py-3">{assocName(m.associationId)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditing(m)}
                        className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveAdmin(m)}
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

      {adminOpen && (
        <CrudModal
          open={adminOpen}
          title={t("platform.admin.new")}
          fields={adminFields}
          initial={{}}
          submitting={submitting}
          submitLabel={t("common.save")}
          cancelLabel={t("common.cancel")}
          onSubmit={onAdminSubmit}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {editing && (
        <CrudModal
          open={!!editing}
          title={t("platform.admin.edit")}
          fields={editFields}
          initial={{
            associationId: editing.associationId,
            fullName: editing.fullName ?? "",
            password: "",
          }}
          submitting={submitting}
          submitLabel={t("common.save")}
          cancelLabel={t("common.cancel")}
          onSubmit={onEditSubmit}
          onClose={() => setEditing(null)}
        />
      )}
    </PlatformShell>
  );
}

function AiProviderToggle({ enabled }: { enabled: boolean }) {
  const getSetting = useServerFn(getAiProviderSettingFn);
  const setSetting = useServerFn(setAiProviderSettingFn);
  const { data, loading, reload } = useServerData<AiProviderSetting | null>(
    () => (enabled ? getSetting() : Promise.resolve(null)),
    null,
  );
  const [saving, setSaving] = useState(false);

  if (!enabled) return null;

  const isReal = data?.mode === "real";

  const onToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      await setSetting({ data: { mode: checked ? "real" : "mock" } });
      toast.success(checked ? "Đã bật mô hình AI thật" : "Đã chuyển về mô hình mô phỏng");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-4 flex items-start justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Nhà cung cấp AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Chuyển giữa mô hình mô phỏng (mock) và mô hình thật qua gateway. Áp dụng riêng cho môi
            trường hiện tại, không cần sửa code.
          </p>
          <p className="mt-1 text-xs">
            <span
              className={isReal ? "font-medium text-primary" : "font-medium text-muted-foreground"}
            >
              {loading ? "Đang tải…" : isReal ? "Đang dùng mô hình thật" : "Đang dùng mô phỏng"}
            </span>
            {data && !data.overridden && !loading ? (
              <span className="text-muted-foreground"> · theo cấu hình môi trường (env)</span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        {(saving || loading) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch checked={isReal} disabled={loading || saving} onCheckedChange={onToggle} />
      </div>
    </Card>
  );
}
