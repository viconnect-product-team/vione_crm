// BC-Mobile-8A — "Khách hàng của tôi" (tab con trong Network).
//
// Nhóm riêng tư, tách khỏi Cộng đồng: danh sách khách hàng theo giai đoạn,
// tổng giá trị dự kiến, cảnh báo quá hạn chăm sóc và lối tạo khách hàng từ
// một người bất kỳ trong Network.

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Plus, RefreshCw, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useCustomerTags, useCustomers } from "@/hooks/use-customers";
import { useBusinessConnectNetwork } from "@/hooks/use-business-connect-network";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import {
  CUSTOMER_MAX_TAGS_PER_CUSTOMER,
  CUSTOMER_STAGES,
  isCustomerOverdue,
  type BcCustomer,
  type BcCustomerStage,
} from "@/lib/business-connect/mobile/customer.types";
import { CustomerDetailSheet } from "./CustomerDetailSheet";
import { CustomerTasksPanel } from "./CustomerTasksPanel";
import { CustomerTagManagerSheet } from "./CustomerTagManagerSheet";
import { MobileSearchBar } from "../MobileSearchBar";

export const STAGE_TKEY = {
  prospect: "bc.mobile.customers.stage.prospect",
  consulting: "bc.mobile.customers.stage.consulting",
  won: "bc.mobile.customers.stage.won",
  nurturing: "bc.mobile.customers.stage.nurturing",
  inactive: "bc.mobile.customers.stage.inactive",
} as const;

const STAGE_TONE: Record<BcCustomerStage, string> = {
  prospect: "text-[var(--bc-mobile-muted)]",
  consulting: "text-[var(--bc-mobile-accent)]",
  won: "text-emerald-400",
  nurturing: "text-amber-500",
  inactive: "text-[var(--bc-mobile-muted)]",
};

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === "USD" ? "en-US" : "vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value}`;
  }
}

function initialsOf(name: string | null): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : ""))
    .toUpperCase();
}

export function CustomersPanel() {
  const t = useT();
  const { customers, initialLoading, error, retry, create, setTags } = useCustomers();
  const [term, setTerm] = useState("");
  const [stage, setStage] = useState<BcCustomerStage | "all">("all");
  const { tags } = useCustomerTags();
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [picking, setPicking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [managingTags, setManagingTags] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTagId, setBulkTagId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return customers.filter((c) => {
      if (stage !== "all" && c.stage !== stage) return false;
      if (tagFilter === "untagged" && c.tagIds.length > 0) return false;
      if (tagFilter !== "all" && tagFilter !== "untagged" && !c.tagIds.includes(tagFilter)) {
        return false;
      }
      if (!q) return true;
      return `${c.displayName ?? ""} ${c.companyName ?? ""} ${c.sourceLabel ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [customers, term, stage, tagFilter]);

  const totals = useMemo(() => {
    const vnd = customers
      .filter((c) => c.currency === "VND" && c.stage !== "inactive")
      .reduce((s, c) => s + (c.expectedValue ?? 0), 0);
    const overdue = customers.filter((c) => isCustomerOverdue(c)).length;
    return { vnd, overdue };
  }, [customers]);

  const open = customers.find((c) => c.id === openId) ?? null;

  const applyBulkTag = async (add: boolean) => {
    const tag = tags.find((tg) => tg.id === bulkTagId);
    if (!tag || selected.size === 0) return;
    setBulkBusy(true);
    try {
      for (const c of customers) {
        if (!selected.has(c.id)) continue;
        const has = c.tagIds.includes(tag.id);
        if (has === add) continue;
        const current = c.tagIds
          .map((id: any) => tags.find((tg) => tg.id === id)?.name)
          .filter((n: any): n is string => Boolean(n));
        const names = add
          ? [...current, tag.name].slice(0, CUSTOMER_MAX_TAGS_PER_CUSTOMER)
          : current.filter((n) => n !== tag.name);
        await setTags.mutateAsync({ customerId: c.id, names });
      }
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <section className="mt-4" aria-label={t("bc.mobile.customers.title")}>
      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-2.5">
        <SummaryTile label={t("bc.mobile.customers.summary.count")} value={String(customers.length)} />
        <SummaryTile
          label={t("bc.mobile.customers.summary.value")}
          value={totals.vnd > 0 ? formatMoney(totals.vnd, "VND") : "—"}
        />
        <SummaryTile
          label={t("bc.mobile.customers.summary.overdue")}
          value={String(totals.overdue)}
          tone={totals.overdue > 0 ? "text-amber-400" : undefined}
        />
      </div>

      {/* Việc cần làm theo mốc giai đoạn */}
      <CustomerTasksPanel onOpen={(id) => setOpenId(id)} />

      {/* Tìm kiếm + thêm */}
      <div className="mt-4 flex items-center gap-2">
        <MobileSearchBar
          id="bc-customer-search"
          value={term}
          onChange={setTerm}
          placeholder={t("bc.mobile.customers.search.placeholder")}
        />
        <button
          type="button"
          onClick={() => setPicking(true)}
          aria-label={t("bc.mobile.customers.add")}
          className="bc-cta-gold grid h-10 w-10 shrink-0 place-items-center rounded-full focus-visible:outline-none shadow-sm cursor-pointer"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Bộ lọc giai đoạn */}
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StageChip active={stage === "all"} onClick={() => setStage("all")}>
          {t("bc.mobile.customers.stage.all")}
        </StageChip>
        {CUSTOMER_STAGES.map((s) => (
          <StageChip key={s} active={stage === s} onClick={() => setStage(s)}>
            {t(STAGE_TKEY[s])}
          </StageChip>
        ))}
      </div>

      {/* Bộ lọc nhãn */}
      <div
        className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={t("bc.mobile.customers.tags.filterLabel")}
      >
        {tags.length > 0 ? (
          <>
            <StageChip active={tagFilter === "all"} onClick={() => setTagFilter("all")}>
              {t("bc.mobile.customers.tags.all")}
            </StageChip>
            {tags.map((tag) => (
              <StageChip
                key={tag.id}
                active={tagFilter === tag.id}
                onClick={() => setTagFilter(tagFilter === tag.id ? "all" : tag.id)}
              >
                {tag.name}
                {tag.count > 0 ? ` · ${tag.count}` : ""}
              </StageChip>
            ))}
            <StageChip active={tagFilter === "untagged"} onClick={() => setTagFilter("untagged")}>
              {t("bc.mobile.customers.tags.untagged")}
            </StageChip>
          </>
        ) : null}
        <StageChip active={false} onClick={() => setManagingTags(true)}>
          {t("bc.mobile.customers.tagManager.open")}
        </StageChip>
        <StageChip
          active={selectMode}
          onClick={() => {
            setSelectMode((v) => !v);
            setSelected(new Set());
          }}
        >
          {selectMode
            ? t("bc.mobile.customers.bulk.exit")
            : t("bc.mobile.customers.bulk.enter")}
        </StageChip>
      </div>


      {/* Danh sách */}
      {initialLoading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-[var(--bc-mobile-surface-2)]" />
          ))}
        </ul>
      ) : error ? (
        <button
          type="button"
          onClick={retry}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] py-4 text-[14px] text-[var(--bc-mobile-text)]"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> {t("bc.mobile.customers.retry")}
        </button>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--bc-mobile-border)] p-6 text-center">
          <p className="text-[15px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.customers.empty.title")}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.customers.empty.body")}
          </p>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="bc-cta-gold mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2} /> {t("bc.mobile.customers.add")}
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" aria-label={t("bc.mobile.customers.list.label")}>
          {filtered.map((c: any) => (
            <li key={c.id} className="flex items-center gap-2.5">
              {selectMode ? (
                <button
                  type="button"
                  onClick={() => toggleSelected(c.id)}
                  aria-pressed={selected.has(c.id)}
                  aria-label={c.displayName ?? t("bc.mobile.customers.unnamed")}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${
                    selected.has(c.id)
                      ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                      : "border-[var(--bc-mobile-border)] text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <CustomerRow
                  customer={c}
                  tagNames={c.tagIds
                    .map((id: any) => tags.find((tag) => tag.id === id)?.name)
                    .filter((n: any): n is string => Boolean(n))}
                  onOpen={() => (selectMode ? toggleSelected(c.id) : setOpenId(c.id))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectMode ? (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] z-20 mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-[var(--bc-mobile-text)]">
              {t("bc.mobile.customers.bulk.selected")}: {selected.size}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set(filtered.map((c: any) => c.id)))}
                className="min-h-9 rounded-lg border border-[var(--bc-mobile-border)] px-3 text-[12.5px] text-[var(--bc-mobile-text)]"
              >
                {t("bc.mobile.customers.bulk.selectAll")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="min-h-9 rounded-lg border border-[var(--bc-mobile-border)] px-3 text-[12.5px] text-[var(--bc-mobile-muted)]"
              >
                {t("bc.mobile.customers.bulk.clear")}
              </button>
            </div>
          </div>

          {tags.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.tags.empty")}
            </p>
          ) : (
            <>
              <div className="-mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tags.map((tag) => (
                  <StageChip
                    key={tag.id}
                    active={bulkTagId === tag.id}
                    onClick={() => setBulkTagId(bulkTagId === tag.id ? null : tag.id)}
                  >
                    {tag.name}
                  </StageChip>
                ))}
              </div>
              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  disabled={bulkBusy || !bulkTagId || selected.size === 0}
                  onClick={() => void applyBulkTag(true)}
                  className="bc-cta-gold min-h-11 flex-1 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                >
                  {t("bc.mobile.customers.bulk.apply")}
                </button>
                <button
                  type="button"
                  disabled={bulkBusy || !bulkTagId || selected.size === 0}
                  onClick={() => void applyBulkTag(false)}
                  className="min-h-11 flex-1 rounded-xl border border-[var(--bc-mobile-border)] text-[14px] font-semibold text-[var(--bc-mobile-text)] disabled:opacity-50"
                >
                  {t("bc.mobile.customers.bulk.remove")}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {picking ? (
        <CustomerPersonPicker
          existingPersonIds={new Set(customers.map((c: any) => c.personId))}
          busy={create.isPending}
          onClose={() => setPicking(false)}
          onPick={async (person) => {
            try {
              const res = await create.mutateAsync({
                personId: person.personId,
                displayName: person.displayName,
                companyName: person.companyName,
              });
              setPicking(false);
              const newCustomerId = (res as any)?.customer?.id || (res as any)?.id;
              if (newCustomerId) {
                setOpenId(newCustomerId);
                toast.success("Đã thêm khách hàng thành công!");
              } else {
                toast.success("Đã thêm khách hàng vào danh sách!");
              }
            } catch (err: any) {
              toast.error(err?.message || "Không thể thêm khách hàng. Vui lòng thử lại!");
            }
          }}
        />
      ) : null}

      {open ? <CustomerDetailSheet customer={open} onClose={() => setOpenId(null)} /> : null}
      {managingTags ? <CustomerTagManagerSheet onClose={() => setManagingTags(false)} /> : null}
    </section>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3">
      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-mobile-muted)]">
        {label}
      </p>
      <p className={`mt-1 truncate text-[15px] font-semibold ${tone ?? "text-[var(--bc-mobile-text)]"}`}>
        {value}
      </p>
    </div>
  );
}

function StageChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-all cursor-pointer ${
        active
          ? "bg-[var(--bc-mobile-accent-grad)] text-black border-[var(--bc-mobile-border-gold)] shadow-sm font-bold"
          : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:border-[var(--bc-mobile-accent)] hover:text-[var(--bc-mobile-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function CustomerRow({
  customer,
  tagNames = [],
  onOpen,
}: {
  customer: BcCustomer;
  tagNames?: string[];
  onOpen: () => void;
}) {
  const t = useT();
  const overdue = isCustomerOverdue(customer);
  const name = customer.displayName ?? t("bc.mobile.network.unknownPerson");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3 text-left transition-colors hover:border-[var(--bc-mobile-accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
    >
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[15px] font-semibold text-[var(--bc-mobile-text)]"
      >
        {initialsOf(customer.displayName)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
          {name}
        </span>
        {customer.companyName ? (
          <span className="block truncate text-[13px] text-[var(--bc-mobile-muted)]">
            {customer.companyName}
          </span>
        ) : null}
        <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px]">
          <span className={`font-medium ${STAGE_TONE[customer.stage]}`}>
            {t(STAGE_TKEY[customer.stage])}
          </span>
          {customer.expectedValue ? (
            <>
              <span aria-hidden="true" className="text-[var(--bc-mobile-muted)]">•</span>
              <span className="text-[var(--bc-mobile-text)]">
                {formatMoney(customer.expectedValue, customer.currency)}
              </span>
            </>
          ) : null}
          {overdue ? (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
              {t("bc.mobile.customers.overdue")}
            </span>
          ) : null}
        </span>
        {tagNames.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {tagNames.slice(0, 3).map((n: any) => (
              <span
                key={n}
                className="rounded-full border border-[var(--bc-mobile-border)] px-2 py-0.5 text-[11.5px] text-[var(--bc-mobile-muted)]"
              >
                {n}
              </span>
            ))}
            {tagNames.length > 3 ? (
              <span className="text-[11.5px] text-[var(--bc-mobile-muted)]">
                +{tagNames.length - 3}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--bc-mobile-muted)]" strokeWidth={1.8} />
    </button>
  );
}

function CustomerPersonPicker({
  existingPersonIds,
  busy,
  onClose,
  onPick,
}: {
  existingPersonIds: Set<string>;
  busy: boolean;
  onClose: () => void;
  onPick: (person: { personId: string; displayName: string | null; companyName: string | null }) => void;
}) {
  const t = useT();
  const viewerId = useViewerUserId();
  const [term, setTerm] = useState("");
  const network = useBusinessConnectNetwork(term);
  const people = network.people.filter((p) => {
    if (existingPersonIds.has(p.personId)) return false;
    if (viewerId && (p.personId === viewerId || p.personId === `u:${viewerId}`)) return false;
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.customers.picker.title")}
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) onClose();
      }}
    >
      <div
        className="bc-app max-h-[82vh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] backdrop-blur-xl p-5 shadow-2xl"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-[var(--bc-mobile-text)]">
              {t("bc.mobile.customers.picker.title")}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.picker.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t("bc.mobile.customers.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] hover:bg-[var(--bc-mobile-surface-2)]"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4 flex h-12 items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5">
          <Search aria-hidden="true" className="h-[18px] w-[18px] text-[var(--bc-mobile-muted)]" strokeWidth={1.8} />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label={t("bc.mobile.customers.picker.search")}
            placeholder={t("bc.mobile.customers.picker.search")}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)]"
          />
        </div>

        <ul className="mt-3 space-y-1">
          {people.map((p) => (
            <li key={p.personId}>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onPick({
                    personId: p.personId,
                    displayName: p.displayName,
                    companyName: p.companyName,
                  })
                }
                className="flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-2 py-2.5 text-left hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-60"
              >
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]">
                    <UserRound className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-[var(--bc-mobile-text)]">
                    {p.displayName ?? t("bc.mobile.network.unknownPerson")}
                  </span>
                  {p.companyName ? (
                    <span className="block truncate text-[13px] text-[var(--bc-mobile-muted)]">
                      {p.companyName}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
          {people.length === 0 ? (
            <li className="py-6 text-center text-[13.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.picker.empty")}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
