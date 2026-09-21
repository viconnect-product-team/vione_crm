// BC-Mobile-8A — Việc cần làm & nhắc lịch chăm sóc khách hàng.
//
// Nhịp chăm sóc được suy ra từ giai đoạn (Tiềm năng 3 ngày, Đang tư vấn 7,
// Đã chốt 30, Chăm sóc lại 45, Ngừng không nhắc). Panel chỉ hiển thị việc
// đang tới hạn hoặc quá hạn — không tạo dữ liệu mới, không thông báo cho
// người được chăm sóc.

import { useMemo, useState } from "react";
import { BellRing, CalendarClock, Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useCustomers } from "@/hooks/use-customers";
import { bcMobileCustomerLogAddFn } from "@/lib/business-connect/mobile/customer.functions";
import {
  CUSTOMER_STAGE_TASK_TKEY,
  daysUntilNextAction,
  isCustomerTaskDue,
  nextActionForStage,
  type BcCustomer,
} from "@/lib/business-connect/mobile/customer.types";
import type { TKey } from "@/lib/i18n";

const SNOOZE_DAYS = 7;

export function CustomerTasksPanel({ onOpen }: { onOpen: (customerId: string) => void }) {
  const t = useT();
  const { customers, update } = useCustomers();
  const [busyId, setBusyId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    const now = Date.now();
    return customers
      .filter((c) => isCustomerTaskDue(c, now))
      .sort((a, b) => (daysUntilNextAction(a, now) ?? -999) - (daysUntilNextAction(b, now) ?? -999))
      .slice(0, 5);
  }, [customers]);

  if (tasks.length === 0) return null;

  const done = async (customer: BcCustomer) => {
    setBusyId(customer.id);
    try {
      await bcMobileCustomerLogAddFn({
        data: { customerId: customer.id, kind: "note", body: t("bc.mobile.customers.task.doneLog") },
      });
      await update.mutateAsync({
        customerId: customer.id,
        nextActionAt: nextActionForStage(customer.stage),
      });
    } finally {
      setBusyId(null);
    }
  };

  const snooze = async (customer: BcCustomer) => {
    setBusyId(customer.id);
    try {
      await update.mutateAsync({
        customerId: customer.id,
        nextActionAt: new Date(Date.now() + SNOOZE_DAYS * 86_400_000).toISOString(),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      className="mt-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3.5"
      aria-label={t("bc.mobile.customers.tasks.title")}
    >
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-[var(--bc-mobile-accent)]" strokeWidth={1.8} aria-hidden="true" />
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.tasks.title")}
        </h3>
      </div>

      <ul className="mt-3 space-y-2.5">
        {tasks.map((c: any) => {
          const days = daysUntilNextAction(c);
          const late = days !== null && days < 0;
          return (
            <li
              key={c.id}
              className="rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3"
            >
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="block w-full text-left"
              >
                <p className="truncate text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
                  {c.displayName ?? t("bc.mobile.customers.unnamed")}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-[var(--bc-mobile-muted)]">
                  {t((CUSTOMER_STAGE_TASK_TKEY as any)[c.stage] as TKey)}
                </p>
              </button>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[12.5px] ${
                    late ? "text-amber-400" : "text-[var(--bc-mobile-muted)]"
                  }`}
                >
                  <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {days === null
                    ? t("bc.mobile.customers.tasks.noDate")
                    : late
                      ? `${t("bc.mobile.customers.tasks.late")} ${Math.abs(days)}${t("bc.mobile.customers.tasks.dayShort")}`
                      : days === 0
                        ? t("bc.mobile.customers.tasks.today")
                        : `${t("bc.mobile.customers.tasks.inDays")} ${days}${t("bc.mobile.customers.tasks.dayShort")}`}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => void snooze(c)}
                    className="min-h-9 rounded-lg border border-[var(--bc-mobile-border)] px-3 text-[12.5px] text-[var(--bc-mobile-text)] disabled:opacity-50"
                  >
                    {t("bc.mobile.customers.tasks.snooze")}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => void done(c)}
                    className="bc-cta-gold inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    {t("bc.mobile.customers.tasks.done")}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
