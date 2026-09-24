// BC-Mobile-5A — field-level privacy controls.
// Every identity field is an explicit PRIVATE/SHARED toggle. Toggles update
// local state immediately; a single Save commits the full visibility batch
// atomically server-side. The public projection is recomputed at every read,
// so changes take effect on the very next public request.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import { bcIdentityUpdateVisibilityFn } from "@/lib/business-connect/mobile/identity.functions";
import {
  IDENTITY_FIELD_KEYS,
  type IdentityFieldKey,
} from "@/lib/business-connect/mobile/identity.projection";
import type {
  IdentityVisibilityState,
  MyIdentityPayload,
} from "@/lib/business-connect/mobile/identity.types";

type VisibilityMap = Record<IdentityFieldKey, IdentityVisibilityState>;

const FIELD_LABEL_KEYS: Record<IdentityFieldKey, TKey> = {
  display_name: "bc.mobile.me.field.displayName",
  headline: "bc.mobile.me.field.headline",
  job_title: "bc.mobile.me.field.jobTitle",
  company_name: "bc.mobile.me.field.companyName",
  bio: "bc.mobile.me.field.bio",
  avatar: "bc.mobile.me.field.avatar",
  primary_email: "bc.mobile.me.field.primaryEmail",
  primary_phone: "bc.mobile.me.field.primaryPhone",
  website: "bc.mobile.me.field.website",
  linkedin_url: "bc.mobile.me.field.linkedinUrl",
  address: "bc.mobile.me.field.address",
  city: "bc.mobile.me.field.city",
};

export function IdentityPrivacySheet({
  visibility,
  onSaved,
  onClose,
}: {
  visibility: VisibilityMap;
  onSaved: (payload: MyIdentityPayload) => void;
  onClose: () => void;
}) {
  const t = useT();
  const updateVisibility = useServerFn(bcIdentityUpdateVisibilityFn);
  const [pending, setPending] = useState<VisibilityMap>(visibility);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  function toggle(field: IdentityFieldKey) {
    setPending((prev) => ({
      ...prev,
      [field]: prev[field] === "SHARED" ? "PRIVATE" : "SHARED",
    }));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const saved = await updateVisibility({
        data: IDENTITY_FIELD_KEYS.map((fieldKey) => ({
          fieldKey,
          visibility: pending[fieldKey],
        })),
      });
      onSaved(saved);
      onClose();
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MeSheet
      title={t("bc.mobile.me.privacy.title")}
      subtitle={t("bc.mobile.me.privacy.subtitle")}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          {saveFailed && (
            <p role="alert" className="text-center text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.saveError")}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] px-6 text-[15px] font-black uppercase tracking-wider shadow-md hover:brightness-105 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] motion-reduce:transition-none cursor-pointer"
          >
            {saving && (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-[#050c15] motion-reduce:animate-none"
                strokeWidth={2}
              />
            )}
            <span className="tracking-wide">{saving ? t("bc.mobile.me.saving") : t("bc.mobile.me.save")}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
          >
            {t("bc.mobile.me.cancel")}
          </button>
        </>
      }
    >
      <ul className="grid gap-1 pb-1">
        {IDENTITY_FIELD_KEYS.map((field) => {
          const shared = pending[field] === "SHARED";
          return (
            <li
              key={field}
              className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl px-2"
            >
              <span className="text-[14px] font-medium text-[var(--bc-mobile-text)]">
                {t(FIELD_LABEL_KEYS[field])}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={shared}
                aria-label={`${t(FIELD_LABEL_KEYS[field])}: ${shared ? t("bc.mobile.me.privacy.shared") : t("bc.mobile.me.privacy.private")}`}
                onClick={() => toggle(field)}
                disabled={saving}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-50 motion-reduce:transition-none ${
                  shared ? "bg-[#D8B282] dark:bg-[#D8B282] ring-1 ring-[#B38954]/50" : "bg-[var(--bc-mobile-border)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white dark:bg-[#121214] shadow-md transition-[left] motion-reduce:transition-none ${
                    shared ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </MeSheet>
  );
}
