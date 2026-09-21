// BC-Mobile-8A — Màn quản lý nhóm nhãn khách hàng.
//
// Hai việc trong một màn: (1) tạo / đổi tên / xóa nhóm, (2) gán một nhóm cho
// nhiều khách hàng cùng lúc (có thể lặp lại nhiều lần cho nhiều nhóm).
// Toàn bộ dữ liệu riêng tư theo chủ tài khoản.

import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n";
import { useCustomerTags, useCustomers } from "@/hooks/use-customers";
import { CUSTOMER_MAX_TAGS_PER_CUSTOMER } from "@/lib/business-connect/mobile/customer.types";

export function CustomerTagManagerSheet({ onClose }: { onClose: () => void }) {
  const t = useT();
  const { tags, create, rename, remove } = useCustomerTags();
  const { customers, setTags } = useCustomers();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [assignTagId, setAssignTagId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const assignTag = tags.find((tg) => tg.id === assignTagId) ?? null;

  useEffect(() => {
    if (!assignTag) return;
    setSelected(new Set(customers.filter((c) => c.tagIds.includes(assignTag.id)).map((c: any) => c.id)));
  }, [assignTagId, assignTag, customers]);

  const listed = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.displayName ?? ""} ${c.companyName ?? ""}`.toLowerCase().includes(q),
    );
  }, [customers, term]);

  const namesOf = (ids: string[]) =>
    ids.map((id: any) => tags.find((tg) => tg.id === id)?.name).filter((n): n is string => Boolean(n));

  const handleCreateTag = async () => {
    const val = newName.trim();
    if (!val) return;
    try {
      await create.mutateAsync(val);
      setNewName("");
      toast.success(`Đã tạo nhóm nhãn "${val}"`);
    } catch (err) {
      toast.error("Không thể tạo nhãn, vui lòng thử lại");
    }
  };

  const handleRenameTag = async (tagId: string) => {
    const val = editingName.trim();
    if (!val) return;
    try {
      await rename.mutateAsync({ tagId, name: val });
      setEditingId(null);
      toast.success(`Đã đổi tên nhãn thành "${val}"`);
    } catch (err) {
      toast.error("Không thể đổi tên nhãn");
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    try {
      await remove.mutateAsync(tagId);
      toast.success(`Đã xóa nhóm nhãn "${tagName}"`);
    } catch (err) {
      toast.error("Không thể xóa nhóm nhãn");
    }
  };

  const applyAssignment = async () => {
    if (!assignTag) return;
    setSaving(true);
    try {
      for (const c of customers) {
        const has = c.tagIds.includes(assignTag.id);
        const want = selected.has(c.id);
        if (has === want) continue;
        const next = want
          ? [...namesOf(c.tagIds), assignTag.name].slice(0, CUSTOMER_MAX_TAGS_PER_CUSTOMER)
          : namesOf(c.tagIds.filter((id) => id !== assignTag.id));
        await setTags.mutateAsync({ customerId: c.id, names: next });
      }
      toast.success(`Đã cập nhật gán nhãn "${assignTag.name}"`);
      setAssignTagId(null);
    } catch (err) {
      toast.error("Lỗi khi gán nhóm nhãn");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.customers.tagManager.title" as TKey)}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bc-app max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] backdrop-blur-xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[var(--bc-mobile-text)]">
            <Tag className="h-4.5 w-4.5 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} aria-hidden="true" />
            {assignTag
              ? `${t("bc.mobile.customers.tagManager.assignTo" as TKey)} · ${assignTag.name}`
              : t("bc.mobile.customers.tagManager.title" as TKey)}
          </h2>
          <button
            type="button"
            disabled={saving}
            onClick={() => (assignTag ? setAssignTagId(null) : onClose())}
            aria-label={t("bc.mobile.customers.close" as TKey)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] disabled:opacity-50"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.8} />
          </button>
        </div>

        {assignTag ? (
          <>
            <div className="mt-4 flex h-12 items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5">
              <Search className="h-[18px] w-[18px] text-[var(--bc-mobile-muted)]" strokeWidth={1.8} aria-hidden="true" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-label={t("bc.mobile.customers.search.label")}
                placeholder={t("bc.mobile.customers.search.placeholder")}
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--bc-mobile-text)] outline-none"
              />
            </div>

            <ul className="mt-3 space-y-2">
              {listed.map((c: any) => {
                const on = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Set(selected);
                        if (on) next.delete(c.id);
                        else next.add(c.id);
                        setSelected(next);
                      }}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                        on
                          ? "border-[var(--bc-mobile-accent)]"
                          : "border-[var(--bc-mobile-border)]"
                      }`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                          on
                            ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                            : "border-[var(--bc-mobile-border)]"
                        }`}
                      >
                        {on ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-medium text-[var(--bc-mobile-text)]">
                          {c.displayName ?? t("bc.mobile.customers.unnamed" as TKey)}
                        </span>
                        {c.companyName ? (
                          <span className="block truncate text-[12.5px] text-[var(--bc-mobile-muted)]">
                            {c.companyName}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              disabled={saving}
              onClick={() => void applyAssignment()}
              className="bc-cta-gold mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60"
            >
              <Check className="h-4.5 w-4.5" strokeWidth={2} />
              {t("bc.mobile.customers.tagManager.applyAssign" as TKey)}
            </button>
          </>
        ) : (
          <>
            {/* Tạo nhóm mới */}
            <div className="mt-4 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newName.trim()) {
                    e.preventDefault();
                    void handleCreateTag();
                  }
                }}
                aria-label={t("bc.mobile.customers.tagManager.create" as TKey)}
                placeholder={t("bc.mobile.customers.tags.addPlaceholder")}
                className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[15px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)]"
              />
              <button
                type="button"
                disabled={create.isPending || !newName.trim()}
                onClick={() => void handleCreateTag()}
                aria-label={t("bc.mobile.customers.tagManager.create" as TKey)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-accent)] text-slate-950 hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            {tags.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.customers.tags.empty")}
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3"
                  >
                    {editingId === tag.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editingName.trim()) {
                              e.preventDefault();
                              void handleRenameTag(tag.id);
                            }
                          }}
                          aria-label={t("bc.mobile.customers.tagManager.rename" as TKey)}
                          className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] px-3 text-[14.5px] text-[var(--bc-mobile-text)] outline-none"
                        />
                        <button
                          type="button"
                          disabled={rename.isPending || !editingName.trim()}
                          onClick={() => void handleRenameTag(tag.id)}
                          aria-label={t("bc.mobile.customers.tagManager.rename" as TKey)}
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-accent)] text-slate-950 disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="h-4 w-4" strokeWidth={2.4} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-medium text-[var(--bc-mobile-text)]">
                            {tag.name}
                          </p>
                          <p className="text-[12px] text-[var(--bc-mobile-muted)]">
                            {tag.count} {t("bc.mobile.customers.tagManager.customersSuffix" as TKey)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAssignTagId(tag.id)}
                          className="min-h-9 shrink-0 rounded-lg border border-[var(--bc-mobile-accent)] px-3 text-[12.5px] font-semibold text-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-accent)]/15 transition-colors cursor-pointer"
                        >
                          {t("bc.mobile.customers.tagManager.assign" as TKey)}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(tag.id);
                            setEditingName(tag.name);
                          }}
                          aria-label={t("bc.mobile.customers.tagManager.rename" as TKey)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          disabled={remove.isPending}
                          onClick={() => void handleDeleteTag(tag.id, tag.name)}
                          aria-label={t("bc.mobile.customers.tagManager.delete" as TKey)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.tagManager.hint" as TKey)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
