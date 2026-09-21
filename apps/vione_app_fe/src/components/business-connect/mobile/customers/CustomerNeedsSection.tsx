// BC-Mobile-8A — Điểm đau & nhu cầu của khách hàng (riêng tư tuyệt đối).
//
// Chỉ chủ tài khoản thấy; không thông báo cho người được ghi nhận.

import { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCustomerNeeds } from "@/hooks/use-customers";
import {
  CUSTOMER_NEED_MAX_BODY_LEN,
  CUSTOMER_MAX_NEEDS_PER_CUSTOMER,
  type BcCustomerNeed,
  type BcCustomerNeedKind,
  type BcCustomerNeedPriority,
} from "@/lib/business-connect/mobile/customer.types";
import type { TKey } from "@/lib/i18n";

const PRIORITY_TKEY: Record<BcCustomerNeedPriority, string> = {
  low: "bc.mobile.customers.needs.priority.low",
  medium: "bc.mobile.customers.needs.priority.medium",
  high: "bc.mobile.customers.needs.priority.high",
};

const PRIORITY_TONE: Record<BcCustomerNeedPriority, string> = {
  low: "text-[var(--bc-mobile-muted)]",
  medium: "text-amber-500",
  high: "text-amber-400",
};

export function CustomerNeedsSection({ customerId }: { customerId: string }) {
  const t = useT();
  const { needs, add, update, remove } = useCustomerNeeds(customerId);
  const [kind, setKind] = useState<BcCustomerNeedKind>("pain");
  const [priority, setPriority] = useState<BcCustomerNeedPriority>("medium");
  const [body, setBody] = useState("");

  const groups = useMemo(
    () => ({
      pain: needs.filter((n) => n.kind === "pain"),
      need: needs.filter((n) => n.kind === "need"),
    }),
    [needs],
  );

  const busy = add.isPending || update.isPending || remove.isPending;
  const full = needs.length >= CUSTOMER_MAX_NEEDS_PER_CUSTOMER;

  const submit = async () => {
    const text = body.trim();
    if (!text || full) return;
    setBody("");
    await add.mutateAsync({ kind, body: text.slice(0, CUSTOMER_NEED_MAX_BODY_LEN), priority });
  };

  return (
    <section className="mt-5" aria-label={t("bc.mobile.customers.needs.title")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.customers.needs.title")}
      </p>

      {/* Nhập nhanh */}
      <div className="mt-2 flex gap-2">
        {(["pain", "need"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`min-h-9 flex-1 rounded-full border px-3 text-[13px] font-medium ${
              kind === k
                ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
            }`}
          >
            {t(
              (k === "pain"
                ? "bc.mobile.customers.needs.kind.pain"
                : "bc.mobile.customers.needs.kind.need") as TKey,
            )}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={CUSTOMER_NEED_MAX_BODY_LEN}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          aria-label={t("bc.mobile.customers.needs.add" as TKey)}
          placeholder={t("bc.mobile.customers.needs.placeholder" as TKey)}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[14.5px] text-[var(--bc-mobile-text)] outline-none"
        />
        <select
          aria-label={t("bc.mobile.customers.needs.priorityLabel" as TKey)}
          value={priority}
          onChange={(e) => setPriority(e.target.value as BcCustomerNeedPriority)}
          className="h-11 shrink-0 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2.5 text-[13px] text-[var(--bc-mobile-text)]"
        >
          {(["low", "medium", "high"] as const).map((p) => (
            <option key={p} value={p}>
              {t(PRIORITY_TKEY[p] as TKey)}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !body.trim() || full}
          onClick={() => void submit()}
          aria-label={t("bc.mobile.customers.needs.add" as TKey)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)] disabled:opacity-50"
        >
          <Plus className="h-4.5 w-4.5" strokeWidth={2} />
        </button>
      </div>

      {needs.length === 0 ? (
        <p className="mt-2.5 text-[13px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.needs.empty" as TKey)}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {(["pain", "need"] as const).map((k) =>
            groups[k].length ? (
              <div key={k}>
                <p className="text-[12px] font-semibold text-[var(--bc-mobile-text)]">
                  {t(
                    (k === "pain"
                      ? "bc.mobile.customers.needs.kind.pain"
                      : "bc.mobile.customers.needs.kind.need") as TKey,
                  )}
                </p>
                <ul className="mt-1.5 space-y-2">
                  {groups[k].map((n: any) => (
                    <NeedRow
                      key={n.id}
                      need={n}
                      busy={busy}
                      onToggle={() =>
                        void update.mutateAsync({
                          needId: n.id,
                          status: n.status === "open" ? "resolved" : "open",
                        })
                      }
                      onDelete={() => void remove.mutateAsync(n.id)}
                    />
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}

function NeedRow({
  need,
  busy,
  onToggle,
  onDelete,
}: {
  need: BcCustomerNeed;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const resolved = need.status === "resolved";
  return (
    <li className="flex items-start gap-2.5 rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3">
      <div className="min-w-0 flex-1">
        <p
          className={`text-[14px] leading-relaxed ${
            resolved
              ? "text-[var(--bc-mobile-muted)] line-through"
              : "text-[var(--bc-mobile-text)]"
          }`}
        >
          {need.body}
        </p>
        <p className={`mt-1 text-[12px] ${PRIORITY_TONE[need.priority]}`}>
          {t(PRIORITY_TKEY[need.priority] as TKey)}
          {resolved ? ` · ${t("bc.mobile.customers.needs.resolved" as TKey)}` : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onToggle}
        aria-label={t(
          (resolved
            ? "bc.mobile.customers.needs.reopen"
            : "bc.mobile.customers.needs.markResolved") as TKey,
        )}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-accent)] disabled:opacity-50"
      >
        {resolved ? (
          <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
        ) : (
          <Check className="h-4 w-4" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        aria-label={t("bc.mobile.customers.needs.delete" as TKey)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </li>
  );
}
