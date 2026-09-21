// BC-Mobile-5A — identity edit sheet.
// Canonical identity fields only (no scanned-card merge, no import in 5A).
// Client-side Zod validation mirrors the server contract; the server remains
// authoritative. Escape/backdrop are inert while a save is in flight.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useInvalidateMyIdentity } from "@/hooks/use-my-identity";
import { Loader2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { MeSheet } from "./MeSheet";
import { bcIdentityUpsertFn } from "@/lib/business-connect/mobile/identity.functions";
import { identityUpdateSchema } from "@/lib/business-connect/mobile/identity.validation";
import type { MyIdentityPayload } from "@/lib/business-connect/mobile/identity.types";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

type FieldKey =
  | "displayName"
  | "headline"
  | "jobTitle"
  | "companyName"
  | "bio"
  | "avatarUrl"
  | "primaryEmail"
  | "primaryPhone"
  | "website"
  | "linkedinUrl"
  | "address"
  | "city";

const TEXT_FIELDS: Array<{ key: FieldKey; labelKey: TKey; type: string }> = [
  { key: "displayName", labelKey: "bc.mobile.me.field.displayName", type: "text" },
  { key: "headline", labelKey: "bc.mobile.me.field.headline", type: "text" },
  { key: "jobTitle", labelKey: "bc.mobile.me.field.jobTitle", type: "text" },
  { key: "companyName", labelKey: "bc.mobile.me.field.companyName", type: "text" },
  { key: "primaryEmail", labelKey: "bc.mobile.me.field.primaryEmail", type: "email" },
  { key: "primaryPhone", labelKey: "bc.mobile.me.field.primaryPhone", type: "tel" },
  { key: "website", labelKey: "bc.mobile.me.field.website", type: "url" },
  { key: "linkedinUrl", labelKey: "bc.mobile.me.field.linkedinUrl", type: "url" },
  { key: "avatarUrl", labelKey: "bc.mobile.me.field.avatar", type: "url" },
  { key: "address", labelKey: "bc.mobile.me.field.address", type: "text" },
  { key: "city", labelKey: "bc.mobile.me.field.city", type: "text" },
];

const FIELD_PLACEHOLDERS: Record<FieldKey, string> = {
  displayName: "Ví dụ: Phạm Văn Vũ",
  headline: "Ví dụ: Chủ tịch & Nhà sáng lập Tập đoàn ViOne",
  jobTitle: "Ví dụ: Tổng Giám Đốc / CEO",
  companyName: "Ví dụ: Công ty Cổ phần Công nghệ ViOne",
  bio: "Mô tả ngắn gọn về hành trình, thế mạnh chuyên môn và định hướng hợp tác...",
  avatarUrl: "https://example.com/avatar.jpg",
  primaryEmail: "contact@vione.vn",
  primaryPhone: "0912 345 678",
  website: "https://vione.vn",
  linkedinUrl: "https://linkedin.com/in/username",
  address: "Số 123 Phố Trần Duy Hưng, Cầu Giấy",
  city: "Hà Nội",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[14.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]";

export function IdentityEditSheet({
  identity,
  onSaved,
  onClose,
}: {
  identity: BusinessIdentity | null;
  onSaved: (payload: MyIdentityPayload) => void;
  onClose: () => void;
}) {
  const t = useT();
  const upsert = useServerFn(bcIdentityUpsertFn);
  const invalidateIdentity = useInvalidateMyIdentity();
  const [values, setValues] = useState<Record<FieldKey, string>>({
    displayName: identity?.displayName ?? "",
    headline: identity?.headline ?? "",
    jobTitle: identity?.jobTitle ?? "",
    companyName: identity?.companyName ?? "",
    bio: identity?.bio ?? "",
    avatarUrl: identity?.avatarUrl ?? "",
    primaryEmail: identity?.primaryEmail ?? "",
    primaryPhone: identity?.primaryPhone ?? "",
    website: identity?.website ?? "",
    linkedinUrl: identity?.linkedinUrl ?? "",
    address: identity?.address ?? "",
    city: identity?.city ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  function set(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  }

  async function handleSave() {
    if (saving) return;
    // Empty string means "clear the field" — the server contract treats
    // null as clear and undefined as untouched.
    const payload: Record<string, string | null> = {
      countryCode: (identity as { countryCode?: string | null } | null)?.countryCode ?? "",
      preferredLocale:
        (identity as { preferredLocale?: string | null } | null)?.preferredLocale ?? "",
    };
    for (const [k, v] of Object.entries(values)) {
      payload[k] = v;
    }
    const parsed = identityUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<FieldKey, boolean>> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") fieldErrors[path as FieldKey] = true;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      const saved = await upsert({ data: parsed.data });
      await invalidateIdentity();
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
      title={t("bc.mobile.me.form.title")}
      subtitle={t("bc.mobile.me.form.subtitle")}
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
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#121214] dark:bg-[#0A0A0C] px-6 text-[15px] font-bold text-[#F5E0A3] shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all hover:border-[#D4AF37] hover:shadow-[0_4px_25px_rgba(212,175,55,0.3)] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] motion-reduce:transition-none cursor-pointer"
          >
            {saving && (
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-[#F5E0A3] motion-reduce:animate-none"
                strokeWidth={1.8}
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
      <div className="grid gap-4 pb-1">
        {TEXT_FIELDS.map(({ key, labelKey, type }) => (
          <div key={key}>
            <label
              htmlFor={`me-edit-${key}`}
              className="mb-1.5 block text-[13px] font-medium text-[var(--bc-mobile-text)]"
            >
              {t(labelKey)}
            </label>
            <input
              id={`me-edit-${key}`}
              type={type}
              value={values[key]}
              onChange={(e) => set(key, e.target.value)}
              disabled={saving}
              placeholder={FIELD_PLACEHOLDERS[key] || ""}
              aria-invalid={errors[key] || undefined}
              className={inputClass}
            />
            {errors[key] && (
              <p role="alert" className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.me.field.invalidValue")}
              </p>
            )}
          </div>
        ))}
        <div>
          <label
            htmlFor="me-edit-bio"
            className="mb-1.5 block text-[13px] font-medium text-[var(--bc-mobile-text)]"
          >
            {t("bc.mobile.me.field.bio")}
          </label>
          <textarea
            id="me-edit-bio"
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            disabled={saving}
            placeholder={FIELD_PLACEHOLDERS.bio}
            rows={3}
            aria-invalid={errors.bio || undefined}
            className={`${inputClass} min-h-24 resize-y py-2.5`}
          />
          {errors.bio && (
            <p role="alert" className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.me.field.invalidValue")}
            </p>
          )}
        </div>
      </div>
    </MeSheet>
  );
}
