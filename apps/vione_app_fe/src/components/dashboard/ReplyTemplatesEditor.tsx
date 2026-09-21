import { useCallback, useEffect, useState } from "react";
import { GripVertical, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useT, useLang } from "@/lib/i18n";
import { useServerData } from "@/hooks/use-server-data";
import { getActiveAssociationFn, type ActiveAssociation } from "@/lib/associations.functions";
import {
  listAllReplyTemplatesFn,
  upsertReplyTemplateFn,
  deleteReplyTemplateFn,
  type ReplyTemplateRow,
  type ReplyTemplateChannel,
} from "@/lib/reply-templates.functions";

type Draft = {
  id?: string;
  channel: ReplyTemplateChannel;
  labelVi: string;
  labelEn: string;
  subjectVi: string;
  subjectEn: string;
  bodyVi: string;
  bodyEn: string;
  priority: number;
  isActive: boolean;
};

const emptyDraft = (priority: number): Draft => ({
  channel: "email",
  labelVi: "",
  labelEn: "",
  subjectVi: "",
  subjectEn: "",
  bodyVi: "",
  bodyEn: "",
  priority,
  isActive: true,
});

const CHANNELS: ReplyTemplateChannel[] = ["email", "phone", "note"];

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20";

export function ReplyTemplatesEditor() {
  const t = useT();
  const { lang } = useLang();
  const { data: assoc } = useServerData<ActiveAssociation | null>(
    () => getActiveAssociationFn(),
    null,
  );
  const listAll = useServerFn(listAllReplyTemplatesFn);
  const upsert = useServerFn(upsertReplyTemplateFn);
  const remove = useServerFn(deleteReplyTemplateFn);

  const [rows, setRows] = useState<ReplyTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listAll());
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, [listAll]);

  useEffect(() => {
    void load();
  }, [load]);

  const canEdit = assoc?.isAdmin ?? false;

  const startAdd = () => {
    const maxPriority = rows.reduce((m, r) => Math.max(m, r.priority), 0);
    setDraft(emptyDraft(maxPriority + 10));
  };

  const startEdit = (r: ReplyTemplateRow) => {
    setDraft({
      id: r.id,
      channel: r.channel,
      labelVi: r.labelVi,
      labelEn: r.labelEn,
      subjectVi: r.subjectVi ?? "",
      subjectEn: r.subjectEn ?? "",
      bodyVi: r.bodyVi,
      bodyEn: r.bodyEn,
      priority: r.priority,
      isActive: r.isActive,
    });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.labelVi.trim()) {
      toast.error(t("set.tpl.labelRequired"));
      return;
    }
    setBusy(true);
    try {
      await upsert({
        data: {
          id: draft.id,
          channel: draft.channel,
          labelVi: draft.labelVi.trim(),
          labelEn: draft.labelEn.trim(),
          subjectVi: draft.subjectVi.trim() || null,
          subjectEn: draft.subjectEn.trim() || null,
          bodyVi: draft.bodyVi,
          bodyEn: draft.bodyEn,
          priority: draft.priority,
          isActive: draft.isActive,
        },
      });
      toast.success(t("set.tpl.saved"));
      setDraft(null);
      await load();
    } catch {
      toast.error(t("set.tpl.error"));
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!window.confirm(t("set.tpl.deleteConfirm"))) return;
    try {
      await remove({ data: { id } });
      toast.success(t("set.tpl.deleted"));
      await load();
    } catch {
      toast.error(t("set.tpl.error"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-semibold text-foreground">{t("set.tpl.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("set.tpl.desc")}</p>
        </div>
        {canEdit && !draft ? (
          <button
            onClick={startAdd}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" />
            {t("set.tpl.add")}
          </button>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          {t("set.tpl.adminOnly")}
        </p>
      ) : null}

      {draft ? (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              {draft.id ? t("set.tpl.edit") : t("set.tpl.new")}
            </span>
            <button
              onClick={() => setDraft(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("set.tpl.cancel")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.channel")}
              </label>
              <select
                value={draft.channel}
                onChange={(e) =>
                  setDraft({ ...draft, channel: e.target.value as ReplyTemplateChannel })
                }
                className={inputCls}
              >
                {CHANNELS.map((c: any) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.priority")}
              </label>
              <input
                type="number"
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) || 0 })}
                className={inputCls}
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                {t("set.tpl.active")}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.labelVi")}
              </label>
              <input
                value={draft.labelVi}
                onChange={(e) => setDraft({ ...draft, labelVi: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.labelEn")}
              </label>
              <input
                value={draft.labelEn}
                onChange={(e) => setDraft({ ...draft, labelEn: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {draft.channel === "email" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("set.tpl.subjectVi")}
                </label>
                <input
                  value={draft.subjectVi}
                  onChange={(e) => setDraft({ ...draft, subjectVi: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("set.tpl.subjectEn")}
                </label>
                <input
                  value={draft.subjectEn}
                  onChange={(e) => setDraft({ ...draft, subjectEn: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.bodyVi")}
              </label>
              <textarea
                value={draft.bodyVi}
                onChange={(e) => setDraft({ ...draft, bodyVi: e.target.value })}
                rows={5}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                {t("set.tpl.bodyEn")}
              </label>
              <textarea
                value={draft.bodyEn}
                onChange={(e) => setDraft({ ...draft, bodyEn: e.target.value })}
                rows={5}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDraft(null)}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              {t("set.tpl.cancel")}
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("set.tpl.save")}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("set.tpl.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r: any) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {lang === "en" ? r.labelEn || r.labelVi : r.labelVi}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {r.channel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">#{r.priority}</span>
                  {!r.isActive ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {t("set.tpl.active")}: off
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {lang === "en" ? r.bodyEn || r.bodyVi : r.bodyVi}
                </p>
              </div>
              {canEdit ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => startEdit(r)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {t("set.tpl.edit")}
                  </button>
                  <button
                    onClick={() => del(r.id)}
                    className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                    aria-label={t("set.tpl.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
