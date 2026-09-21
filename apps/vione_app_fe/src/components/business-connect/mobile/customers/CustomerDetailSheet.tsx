// BC-Mobile-8A — Chi tiết khách hàng: giai đoạn, giá trị, nhắc chăm sóc,
// ghi chú riêng và nhật ký chăm sóc. Toàn bộ dữ liệu chỉ chủ sở hữu thấy.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, Check, Plus, Sparkles, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  useCustomerLogs,
  useCustomerTagSuggestions,
  useCustomerTagSuggestionFeedback,
  useCustomerTagSuggestionHistory,
  useCustomerTags,
  useCustomers,
} from "@/hooks/use-customers";
import { CustomerNeedsSection } from "./CustomerNeedsSection";
import {
  CUSTOMER_MAX_TAGS_PER_CUSTOMER,
  CUSTOMER_STAGES,
  type BcCustomer,
  type BcCustomerLogKind,
  type BcCustomerStage,
} from "@/lib/business-connect/mobile/customer.types";
import { STAGE_TKEY, formatMoney } from "./CustomersPanel";

const LOG_TKEY = {
  call: "bc.mobile.customers.log.call",
  meeting: "bc.mobile.customers.log.meeting",
  email: "bc.mobile.customers.log.email",
  message: "bc.mobile.customers.log.message",
  note: "bc.mobile.customers.log.note",
  stage_change: "bc.mobile.customers.log.stageChange",
} as const;

type LogChoice = Exclude<BcCustomerLogKind, "stage_change">;
const LOG_CHOICES: LogChoice[] = ["call", "meeting", "message", "email", "note"];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : "";
}

export function CustomerDetailSheet({
  customer,
  onClose,
}: {
  customer: BcCustomer;
  onClose: () => void;
}) {
  const t = useT();
  const { update, remove, setTags } = useCustomers();
  const { tags } = useCustomerTags();
  const { logs, add } = useCustomerLogs(customer.id);

  const [stage, setStage] = useState<BcCustomerStage>(customer.stage);
  const [value, setValue] = useState(customer.expectedValue ? String(customer.expectedValue) : "");
  const [currency, setCurrency] = useState<"VND" | "USD">(
    customer.currency === "USD" ? "USD" : "VND",
  );
  const [source, setSource] = useState(customer.sourceLabel ?? "");
  const [note, setNote] = useState(customer.note ?? "");
  const [nextAction, setNextAction] = useState(toDateInput(customer.nextActionAt));
  const [logKind, setLogKind] = useState<LogChoice>("call");
  const [logBody, setLogBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(customer.tagIds);
  const [newTag, setNewTag] = useState("");
  const suggest = useCustomerTagSuggestions(customer.id);
  const [suggestions, setSuggestions] = useState<
    { name: string; reason: string; existing: boolean; confidence: number }[]
  >([]);
  const [sources, setSources] = useState({ note: true, logs: true, needs: true });
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [showSuggestHistory, setShowSuggestHistory] = useState(false);
  const suggestHistory = useCustomerTagSuggestionHistory(customer.id, showSuggestHistory);
  const suggestFeedback = useCustomerTagSuggestionFeedback(customer.id);
  const [runId, setRunId] = useState<string | null>(null);

  const FeedbackButtons = ({ name, runRef }: { name: string; runRef: string | null }) => {
    const verdict = suggestFeedback.verdictOf(name);
    const base =
      "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-50";
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={suggestFeedback.submit.isPending}
          aria-pressed={verdict === "good"}
          aria-label={t("bc.mobile.customers.tagSuggest.feedbackGood")}
          title={t("bc.mobile.customers.tagSuggest.feedbackGood")}
          onClick={() =>
            void suggestFeedback.submit.mutateAsync({ tagName: name, verdict: "good", runId: runRef })
          }
          className={`${base} ${
            verdict === "good"
              ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
              : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
          }`}
        >
          <ThumbsUp className="h-4 w-4" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          disabled={suggestFeedback.submit.isPending}
          aria-pressed={verdict === "bad"}
          aria-label={t("bc.mobile.customers.tagSuggest.feedbackBad")}
          title={t("bc.mobile.customers.tagSuggest.feedbackBad")}
          onClick={() =>
            void suggestFeedback.submit
              .mutateAsync({ tagName: name, verdict: "bad", runId: runRef })
              .then(() => setSuggestions((prev) => prev.filter((x: any) => x.name !== name)))
          }
          className={`${base} ${
            verdict === "bad"
              ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
              : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
          }`}
        >
          <ThumbsDown className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    );
  };

  const tagNamesOf = (ids: string[]) =>
    ids.map((id: any) => tags.find((tg) => tg.id === id)?.name).filter((n): n is string => Boolean(n));

  const toggleTag = async (tagId: string) => {
    const next = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId].slice(0, CUSTOMER_MAX_TAGS_PER_CUSTOMER);
    setTagIds(next);
    await setTags.mutateAsync({ customerId: customer.id, names: tagNamesOf(next) });
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    setNewTag("");
    const res = await setTags.mutateAsync({
      customerId: customer.id,
      names: [...tagNamesOf(tagIds), name],
    });
    if (res.ok) setTagIds(res.tagIds);
  };

  const runSuggest = async () => {
    setSuggestError(null);
    setSuggestions([]);
    if (!sources.note && !sources.logs && !sources.needs) {
      setSuggestError(t("bc.mobile.customers.tagSuggest.sourcesEmpty"));
      return;
    }
    const res = await suggest.mutateAsync(sources);
    if (res.ok) {
      setRunId(res.runId ?? null);
      setSuggestions(res.suggestions);
      if (res.suggestions.length === 0) {
        setSuggestError(t("bc.mobile.customers.tagSuggest.none"));
      }
      return;
    }
    setSuggestError(
      res.error === "invalid_input"
        ? t("bc.mobile.customers.tagSuggest.none")
        : t("bc.mobile.customers.tagSuggest.error"),
    );
  };

  const applyAllSuggestions = async () => {
    const names = suggestions.map((s) => s.name);
    if (names.length === 0) return;
    setSuggestions([]);
    const res = await setTags.mutateAsync({
      customerId: customer.id,
      names: [...tagNamesOf(tagIds), ...names],
    });
    if (res.ok) setTagIds(res.tagIds);
  };

  const confidenceLabel = (c: number) =>
    c >= 0.75
      ? t("bc.mobile.customers.tagSuggest.confHigh")
      : c >= 0.45
        ? t("bc.mobile.customers.tagSuggest.confMedium")
        : t("bc.mobile.customers.tagSuggest.confLow");

  const acceptSuggestion = async (name: string) => {
    setSuggestions((prev) => prev.filter((s) => s.name !== name));
    const res = await setTags.mutateAsync({
      customerId: customer.id,
      names: [...tagNamesOf(tagIds), name],
    });
    if (res.ok) setTagIds(res.tagIds);
  };

  const busy = update.isPending || remove.isPending || add.isPending || setTags.isPending;

  const save = async () => {
    const numeric = Number(value.replace(/[^\d.]/g, ""));
    await update.mutateAsync({
      customerId: customer.id,
      stage,
      currency,
      expectedValue: Number.isFinite(numeric) && numeric > 0 ? numeric : null,
      sourceLabel: source.trim() || null,
      note: note.trim() || null,
      nextActionAt: nextAction ? new Date(`${nextAction}T09:00:00`).toISOString() : null,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("bc.mobile.customers.detail.title")}
      className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!busy) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) onClose();
      }}
    >
      <div
        className="bc-app max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] backdrop-blur-xl p-5 shadow-2xl"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[18px] font-semibold text-[var(--bc-mobile-text)]">
              {customer.displayName ?? t("bc.mobile.network.unknownPerson")}
            </h2>
            {customer.companyName ? (
              <p className="truncate text-[13.5px] text-[var(--bc-mobile-muted)]">
                {customer.companyName}
              </p>
            ) : null}
            <Link
              to="/connect-app/network/$personId"
              params={{ personId: customer.personId }}
              className="mt-1 inline-block text-[13px] font-medium text-[var(--bc-mobile-accent)]"
            >
              {t("bc.mobile.customers.detail.openProfile")}
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("bc.mobile.customers.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)]"
          >
            <X className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Giai đoạn */}
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.field.stage")}
        </p>
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CUSTOMER_STAGES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStage(s)}
              aria-pressed={stage === s}
              className={`min-h-10 shrink-0 rounded-full border px-3.5 text-[13px] font-medium ${
                stage === s
                  ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                  : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
              }`}
            >
              {t(STAGE_TKEY[s])}
            </button>
          ))}
        </div>

        {/* Nhãn & nhóm */}
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.tags.title")}
        </p>
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={setTags.isPending}
                  onClick={() => void toggleTag(tag.id)}
                  aria-pressed={on}
                  className={`min-h-9 rounded-full border px-3.5 text-[13px] font-medium disabled:opacity-60 ${
                    on
                      ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                      : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.customers.tags.empty")}
          </p>
        )}
        <div className="mt-2.5 flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addTag();
              }
            }}
            aria-label={t("bc.mobile.customers.tags.add")}
            placeholder={t("bc.mobile.customers.tags.addPlaceholder")}
            className="h-11 min-w-0 flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[14.5px] text-[var(--bc-mobile-text)] outline-none"
          />
          <button
            type="button"
            disabled={setTags.isPending || !newTag.trim()}
            onClick={() => void addTag()}
            aria-label={t("bc.mobile.customers.tags.add")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)] disabled:opacity-50"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.tags.hint")}
        </p>

        {/* Nguồn dữ liệu dùng để gợi ý */}
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.customers.tagSuggest.sources")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(
              [
                ["note", "bc.mobile.customers.tagSuggest.sourceNote"],
                ["logs", "bc.mobile.customers.tagSuggest.sourceLogs"],
                ["needs", "bc.mobile.customers.tagSuggest.sourceNeeds"],
              ] as const
            ).map(([key, label]) => {
              const on = sources[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSources((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={`min-h-9 rounded-full border px-3 text-[12.5px] font-medium ${
                    on
                      ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                      : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
                  }`}
                >
                  {t(label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gợi ý nhãn tự động */}
        <button
          type="button"
          disabled={suggest.isPending || setTags.isPending}
          onClick={() => void runSuggest()}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--bc-mobile-accent)] text-[14px] font-semibold text-[var(--bc-mobile-accent)] disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          {suggest.isPending
            ? t("bc.mobile.customers.tagSuggest.loading")
            : t("bc.mobile.customers.tagSuggest.action")}
        </button>
        {suggestError ? (
          <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]" role="status">
            {suggestError}
          </p>
        ) : null}
        {suggestions.length > 0 ? (
          <button
            type="button"
            disabled={setTags.isPending}
            onClick={() => void applyAllSuggestions()}
            className="mt-2.5 min-h-10 w-full rounded-2xl bg-[var(--bc-mobile-accent)] text-[13.5px] font-semibold text-[var(--bc-mobile-accent-contrast,#04111F)] disabled:opacity-60"
          >
            {t("bc.mobile.customers.tagSuggest.applyAll")} ({suggestions.length})
          </button>
        ) : null}
        {suggestions.length > 0 ? (
          <ul className="mt-2.5 space-y-2" aria-label={t("bc.mobile.customers.tagSuggest.title")}>
            {suggestions.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[var(--bc-mobile-text)]">
                    {s.name}
                    {s.existing ? ` · ${t("bc.mobile.customers.tagSuggest.existing")}` : ""}
                  </p>
                  <p className="text-[11.5px] text-[var(--bc-mobile-accent)]">
                    {t("bc.mobile.customers.tagSuggest.confidence")}: {confidenceLabel(s.confidence)}{" "}
                    · {Math.round((s.confidence ?? 0) * 100)}%
                  </p>
                  {s.reason ? (
                    <p className="truncate text-[12px] text-[var(--bc-mobile-muted)]">{s.reason}</p>
                  ) : null}
                </div>
                <FeedbackButtons name={s.name} runRef={runId} />
                <button
                  type="button"
                  disabled={setTags.isPending}
                  onClick={() => void acceptSuggestion(s.name)}
                  className="min-h-9 shrink-0 rounded-lg border border-[var(--bc-mobile-accent)] px-3 text-[12.5px] font-semibold text-[var(--bc-mobile-accent)] disabled:opacity-50"
                >
                  {t("bc.mobile.customers.tagSuggest.apply")}
                </button>
                <button
                  type="button"
                  onClick={() => setSuggestions((prev) => prev.filter((x: any) => x.name !== s.name))}
                  aria-label={t("bc.mobile.customers.tagSuggest.dismiss")}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
                >
                  <X className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Lịch sử gợi ý nhãn */}
        <button
          type="button"
          onClick={() => setShowSuggestHistory((v) => !v)}
          aria-expanded={showSuggestHistory}
          className="mt-2.5 min-h-9 text-[12.5px] font-semibold text-[var(--bc-mobile-accent)] underline-offset-2 hover:underline"
        >
          {showSuggestHistory
            ? t("bc.mobile.customers.tagSuggest.historyHide")
            : t("bc.mobile.customers.tagSuggest.history")}
        </button>
        {showSuggestHistory ? (
          suggestHistory.loading ? (
            <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]" role="status">
              {t("bc.mobile.customers.tagSuggest.historyLoading")}
            </p>
          ) : suggestHistory.runs.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.tagSuggest.historyEmpty")}
            </p>
          ) : (
            <ul
              className="mt-2 space-y-2"
              aria-label={t("bc.mobile.customers.tagSuggest.history")}
            >
              {suggestHistory.runs.map((run) => (
                <li
                  key={run.id}
                  className="rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-2.5"
                >
                  <p className="text-[11.5px] uppercase tracking-[0.1em] text-[var(--bc-mobile-muted)]">
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {run.suggestions.map((s, i) => (
                      <li
                        key={`${run.id}-${i}`}
                        className="flex items-center gap-2 text-[13px] text-[var(--bc-mobile-text)]"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{s.name}</span>
                          {typeof s.confidence === "number" ? (
                            <span className="text-[var(--bc-mobile-accent)]">
                              {" "}
                              · {Math.round(s.confidence * 100)}%
                            </span>
                          ) : null}
                          {s.reason ? (
                            <span className="text-[var(--bc-mobile-muted)]"> · {s.reason}</span>
                          ) : null}
                        </span>
                        <FeedbackButtons name={s.name} runRef={run.id} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {/* Điểm đau & nhu cầu */}
        <CustomerNeedsSection customerId={customer.id} />

        {/* Giá trị dự kiến */}
        <label htmlFor="bc-customer-value" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.field.value")}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="bc-customer-value"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[15px] text-[var(--bc-mobile-text)] outline-none"
          />
          <select
            aria-label={t("bc.mobile.customers.field.currency")}
            value={currency}
            onChange={(e) => setCurrency(e.target.value === "USD" ? "USD" : "VND")}
            className="h-12 shrink-0 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 text-[15px] text-[var(--bc-mobile-text)]"
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* Nguồn + nhắc chăm sóc */}
        <label htmlFor="bc-customer-source" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.field.source")}
        </label>
        <input
          id="bc-customer-source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={t("bc.mobile.customers.field.sourcePlaceholder")}
          className="mt-2 h-12 w-full rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[15px] text-[var(--bc-mobile-text)] outline-none"
        />

        <label htmlFor="bc-customer-next" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.field.nextAction")}
        </label>
        <div className="mt-2 flex h-12 items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5">
          <CalendarClock aria-hidden="true" className="h-[18px] w-[18px] text-[var(--bc-mobile-muted)]" strokeWidth={1.8} />
          <input
            id="bc-customer-next"
            type="date"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--bc-mobile-text)] outline-none"
          />
        </div>

        {/* Ghi chú riêng */}
        <label htmlFor="bc-customer-note" className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.field.note")}
        </label>
        <textarea
          id="bc-customer-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={t("bc.mobile.customers.field.notePlaceholder")}
          className="mt-2 w-full rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3.5 text-[15px] text-[var(--bc-mobile-text)] outline-none"
        />
        <p className="mt-1.5 text-[12px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.customers.privacyNote")}
        </p>

        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="bc-cta-gold mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60"
        >
          <Check className="h-4.5 w-4.5" strokeWidth={2} />
          {t("bc.mobile.customers.save")}
        </button>

        {/* Nhật ký chăm sóc */}
        <h3 className="mt-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--bc-mobile-text)]">
          {t("bc.mobile.customers.log.title")}
        </h3>
        <div className="-mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LOG_CHOICES.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setLogKind(k)}
              aria-pressed={logKind === k}
              className={`min-h-9 shrink-0 rounded-full border px-3.5 text-[13px] ${
                logKind === k
                  ? "border-[var(--bc-mobile-accent)] text-[var(--bc-mobile-accent)]"
                  : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)]"
              }`}
            >
              {t(LOG_TKEY[k])}
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2">
          <input
            value={logBody}
            onChange={(e) => setLogBody(e.target.value)}
            aria-label={t("bc.mobile.customers.log.placeholder")}
            placeholder={t("bc.mobile.customers.log.placeholder")}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[15px] text-[var(--bc-mobile-text)] outline-none"
          />
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              await add.mutateAsync({ kind: logKind, body: logBody.trim() || null });
              setLogBody("");
            }}
            className="min-h-12 shrink-0 rounded-2xl border border-[var(--bc-mobile-accent)] px-4 text-[14px] font-semibold text-[var(--bc-mobile-accent)] disabled:opacity-60"
          >
            {t("bc.mobile.customers.log.add")}
          </button>
        </div>

        <ul className="mt-3.5 space-y-2.5">
          {logs.map((log) => (
            <li key={log.id} className="rounded-2xl border border-[var(--bc-mobile-border)] p-3">
              <p className="flex items-center justify-between gap-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
                <span className="font-medium text-[var(--bc-mobile-accent)]">{t(LOG_TKEY[log.kind])}</span>
                <span>{new Date(log.occurredAt).toLocaleDateString("vi-VN")}</span>
              </p>
              {log.kind === "stage_change" && log.toStage ? (
                <p className="mt-1 text-[14px] text-[var(--bc-mobile-text)]">
                  {log.fromStage ? `${t(STAGE_TKEY[log.fromStage])} → ` : ""}
                  {t(STAGE_TKEY[log.toStage])}
                </p>
              ) : null}
              {log.body ? (
                <p className="mt-1 whitespace-pre-wrap text-[14px] text-[var(--bc-mobile-text)]">
                  {log.body}
                </p>
              ) : null}
            </li>
          ))}
          {logs.length === 0 ? (
            <li className="py-4 text-center text-[13.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.customers.log.empty")}
            </li>
          ) : null}
        </ul>

        {/* Gỡ khỏi nhóm khách hàng */}
        {confirmDelete ? (
          <div className="mt-6 rounded-2xl border border-[var(--bc-mobile-border)] p-3.5">
            <p className="text-[13.5px] text-[var(--bc-mobile-text)]">
              {t("bc.mobile.customers.delete.confirm")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-11 flex-1 rounded-xl border border-[var(--bc-mobile-border)] text-[14px] text-[var(--bc-mobile-text)]"
              >
                {t("bc.mobile.customers.cancel")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await remove.mutateAsync(customer.id);
                  onClose();
                }}
                className="min-h-11 flex-1 rounded-xl border border-red-500/60 text-[14px] font-semibold text-red-400 disabled:opacity-60"
              >
                {t("bc.mobile.customers.delete.confirmAction")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] text-[var(--bc-mobile-muted)]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            {t("bc.mobile.customers.delete.action")}
          </button>
        )}

        {customer.expectedValue ? (
          <p className="mt-3 text-center text-[12px] text-[var(--bc-mobile-muted)]">
            {formatMoney(customer.expectedValue, customer.currency)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
