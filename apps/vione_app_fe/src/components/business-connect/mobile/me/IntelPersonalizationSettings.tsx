// BC-Mobile-6C — "V · Gợi ý & cá nhân hóa" settings page (Me tab leaf).
//
// Explicit, transparent controls: master switch, type-level reconnect
// switch, cadence, preferred contact action, behavioral learning switch,
// and a full reset. Saves immediately; conservative defaults; nothing here
// touches relationship facts, authorization, or person identity.

import { Link } from "@tanstack/react-router";
import { ChevronLeft, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT, type TKey } from "@/lib/i18n";
import {
  useRelationshipPersonalization,
  useResetRelationshipPersonalization,
  useUpdateRelationshipIntelPreferences,
} from "@/hooks/use-relationship-personalization";
import { trackRelationshipIntel } from "@/lib/business-connect/mobile/relationship-intelligence.telemetry";
import type {
  RelationshipPreferredContactAction,
  RelationshipReconnectCadence,
  UpdateRelationshipIntelPreferencesInput,
} from "@/lib/business-connect/mobile/relationship-personalization.types";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]";
const CARD = "rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)]";

const CADENCE_OPTIONS: { value: RelationshipReconnectCadence; label: TKey; desc: TKey }[] = [
  {
    value: "auto",
    label: "bc.mobile.intelSettings.cadence.auto",
    desc: "bc.mobile.intelSettings.cadence.autoDesc",
  },
  {
    value: "more_often",
    label: "bc.mobile.intelSettings.cadence.more",
    desc: "bc.mobile.intelSettings.cadence.moreDesc",
  },
  {
    value: "normal",
    label: "bc.mobile.intelSettings.cadence.normal",
    desc: "bc.mobile.intelSettings.cadence.normalDesc",
  },
  {
    value: "less_often",
    label: "bc.mobile.intelSettings.cadence.less",
    desc: "bc.mobile.intelSettings.cadence.lessDesc",
  },
];

const ACTION_OPTIONS: { value: RelationshipPreferredContactAction; label: TKey }[] = [
  { value: "auto", label: "bc.mobile.intelSettings.action.auto" },
  { value: "call", label: "bc.mobile.intelSettings.action.call" },
  { value: "email", label: "bc.mobile.intelSettings.action.email" },
];

function ToggleRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[var(--bc-mobile-text)]">{label}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-[var(--bc-mobile-muted)]">{desc}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
        className="shrink-0"
      />
    </div>
  );
}

export function IntelPersonalizationSettings() {
  const t = useT();
  const { preferences, initialLoading, error, retry } = useRelationshipPersonalization();
  const update = useUpdateRelationshipIntelPreferences();
  const reset = useResetRelationshipPersonalization();
  const [confirmReset, setConfirmReset] = useState(false);

  const save = (input: UpdateRelationshipIntelPreferencesInput) => {
    update.mutate(input, {
      onSuccess: () => trackRelationshipIntel("PERSONALIZATION_SETTINGS_UPDATED", {}),
      onError: () => toast.error(t("bc.mobile.intelSettings.saveError")),
    });
  };

  const doReset = () => {
    reset.mutate(undefined, {
      onSuccess: () => {
        trackRelationshipIntel("PERSONALIZATION_RESET", {});
        toast.success(t("bc.mobile.intelSettings.reset.done"));
        setConfirmReset(false);
      },
      onError: () => toast.error(t("bc.mobile.intelSettings.saveError")),
    });
  };

  const recsOff = preferences ? !preferences.recommendationsEnabled : false;
  const reconnectOff = preferences ? recsOff || !preferences.reconnectEnabled : false;

  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.intelSettings.title")} back />
      <div className="pt-4 pb-8">

      {initialLoading ? (
        <div
          aria-busy="true"
          role="status"
          aria-label={t("bc.mobile.intelSettings.loading")}
          className="mt-6 space-y-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-[var(--bc-mobile-surface-2)] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : error || !preferences ? (
        <div role="alert" className="mt-6 flex items-center gap-3">
          <p className="text-[13px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.intelSettings.error")}
          </p>
          <button
            type="button"
            onClick={retry}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            {t("bc.mobile.intel.retry")}
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {/* Recommendations */}
          <section aria-labelledby="bc6c-recs">
            <h2
              id="bc6c-recs"
              className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.intelSettings.section.recs")}
            </h2>
            <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.intelSettings.recs.desc")}
            </p>
            <div className={`mt-2 divide-y divide-[var(--bc-mobile-border)] ${CARD}`}>
              <ToggleRow
                label={t("bc.mobile.intelSettings.toggle.recs")}
                desc={t("bc.mobile.intelSettings.toggle.recsDesc")}
                checked={preferences.recommendationsEnabled}
                onChange={(v) => save({ recommendationsEnabled: v })}
              />
              <ToggleRow
                label={t("bc.mobile.intelSettings.toggle.reconnect")}
                desc={t("bc.mobile.intelSettings.toggle.reconnectDesc")}
                checked={preferences.reconnectEnabled}
                disabled={recsOff}
                onChange={(v) => save({ reconnectEnabled: v })}
              />
            </div>
          </section>

          {/* Cadence */}
          <section aria-labelledby="bc6c-cadence" aria-disabled={reconnectOff}>
            <h2
              id="bc6c-cadence"
              className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.intelSettings.section.cadence")}
            </h2>
            <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.intelSettings.cadence.desc")}
            </p>
            <div
              role="radiogroup"
              aria-label={t("bc.mobile.intelSettings.section.cadence")}
              className={`mt-2 divide-y divide-[var(--bc-mobile-border)] ${CARD} ${reconnectOff ? "opacity-50" : ""}`}
            >
              {CADENCE_OPTIONS.map((opt) => {
                const selected = preferences.reconnectCadence === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={reconnectOff}
                    onClick={() => save({ reconnectCadence: opt.value })}
                    className={`flex min-h-[44px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:cursor-not-allowed ${FOCUS}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[var(--bc-mobile-navy)]" : "border-[var(--bc-mobile-border)]"}`}
                    >
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-[var(--bc-mobile-navy)]" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-[var(--bc-mobile-text)]">
                        {t(opt.label)}
                      </span>
                      <span className="block text-[12px] text-[var(--bc-mobile-muted)]">
                        {t(opt.desc)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Preferred action */}
          <section aria-labelledby="bc6c-action">
            <h2
              id="bc6c-action"
              className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.intelSettings.section.action")}
            </h2>
            <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.intelSettings.action.desc")}
            </p>
            <div
              role="radiogroup"
              aria-label={t("bc.mobile.intelSettings.section.action")}
              className={`mt-2 flex gap-2 ${CARD} p-2`}
            >
              {ACTION_OPTIONS.map((opt) => {
                const selected = preferences.preferredContactAction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => save({ preferredContactAction: opt.value })}
                    className={`min-h-[44px] flex-1 rounded-lg px-3 text-[13px] font-medium transition-colors ${FOCUS} ${
                      selected
                        ? "bg-[var(--bc-mobile-navy)] text-[var(--bc-mobile-on-navy)]"
                        : "text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
                    }`}
                  >
                    {t(opt.label)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Behavioral learning */}
          <section aria-labelledby="bc6c-learning">
            <h2
              id="bc6c-learning"
              className="text-[13px] font-semibold uppercase tracking-wide text-[var(--bc-mobile-muted)]"
            >
              {t("bc.mobile.intelSettings.section.learning")}
            </h2>
            <div className={`mt-2 ${CARD}`}>
              <ToggleRow
                label={t("bc.mobile.intelSettings.toggle.learning")}
                desc={t("bc.mobile.intelSettings.learning.desc")}
                checked={preferences.behavioralAdaptationEnabled}
                onChange={(v) => save({ behavioralAdaptationEnabled: v })}
              />
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.intelSettings.learning.note")}
            </p>
          </section>

          {/* Reset */}
          <section aria-labelledby="bc6c-reset">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--bc-mobile-border)] px-4 text-[13px] font-medium text-[var(--bc-mobile-text)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] ${FOCUS}`}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              {t("bc.mobile.intelSettings.reset")}
            </button>
          </section>
        </div>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bc.mobile.intelSettings.reset.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bc.mobile.intelSettings.reset.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={doReset} disabled={reset.isPending}>
              {t("bc.mobile.intelSettings.reset.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MobilePage>
  );
}

