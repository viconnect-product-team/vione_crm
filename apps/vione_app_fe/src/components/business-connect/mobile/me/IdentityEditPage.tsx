// BC-Mobile — /connect-app/me/edit: full-page canonical identity editor.
// Same server contract as the edit sheet (bcIdentityUpsertFn): the actor is
// derived server-side, the client only sends owner-editable fields. Saving
// returns the canonical payload so the identity card re-syncs on return.

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { fetchNestApi } from "@/lib/api-client";
import { useInvalidateMyIdentity } from "@/hooks/use-my-identity";
import { AvatarUploadField } from "@/components/business-connect/mobile/me/AvatarUploadField";
import { identityUpdateSchema } from "@/lib/business-connect/mobile/identity.validation";

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

type Field = { key: FieldKey; labelKey: TKey; type: string; multiline?: boolean };

const GROUPS: Array<{ titleKey: TKey; fields: Field[] }> = [
  {
    titleKey: "bc.mobile.me.edit.groupIdentity",
    fields: [
      { key: "displayName", labelKey: "bc.mobile.me.field.displayName", type: "text" },
      { key: "headline", labelKey: "bc.mobile.me.field.headline", type: "text" },
      { key: "avatarUrl", labelKey: "bc.mobile.me.field.avatar", type: "url" },
    ],
  },
  {
    titleKey: "bc.mobile.me.edit.groupWork",
    fields: [
      { key: "jobTitle", labelKey: "bc.mobile.me.field.jobTitle", type: "text" },
      { key: "companyName", labelKey: "bc.mobile.me.field.companyName", type: "text" },
    ],
  },
  {
    titleKey: "bc.mobile.me.edit.groupContact",
    fields: [
      { key: "primaryEmail", labelKey: "bc.mobile.me.field.primaryEmail", type: "email" },
      { key: "primaryPhone", labelKey: "bc.mobile.me.field.primaryPhone", type: "tel" },
      { key: "website", labelKey: "bc.mobile.me.field.website", type: "url" },
      { key: "linkedinUrl", labelKey: "bc.mobile.me.field.linkedinUrl", type: "url" },
      { key: "address", labelKey: "bc.mobile.me.field.address", type: "text" },
      { key: "city", labelKey: "bc.mobile.me.field.city", type: "text" },
    ],
  },
  {
    titleKey: "bc.mobile.me.edit.groupAbout",
    fields: [{ key: "bio", labelKey: "bc.mobile.me.field.bio", type: "text", multiline: true }],
  },
];

const EMPTY: Record<FieldKey, string> = {
  displayName: "",
  headline: "",
  jobTitle: "",
  companyName: "",
  bio: "",
  avatarUrl: "",
  primaryEmail: "",
  primaryPhone: "",
  website: "",
  linkedinUrl: "",
  address: "",
  city: "",
};

const FIELD_PLACEHOLDERS: Record<FieldKey, string> = {
  displayName: "Ví dụ: Phạm Văn Vũ",
  headline: "Ví dụ: Chủ tịch & Nhà sáng lập Tập đoàn ViOne",
  jobTitle: "Ví dụ: Tổng Giám Đốc / CEO",
  companyName: "Ví dụ: Công ty Cổ phần Công nghệ ViOne",
  bio: "Mô tả ngắn gọn về hành trình, thế mạnh chuyên môn, quy mô doanh nghiệp và định hướng hợp tác B2B...",
  avatarUrl: "Hoặc dán liên kết URL ảnh đại diện (https://...)",
  primaryEmail: "contact@vione.vn",
  primaryPhone: "0912 345 678",
  website: "https://vione.vn",
  linkedinUrl: "https://linkedin.com/in/username",
  address: "Số 123 Phố Trần Duy Hưng, Cầu Giấy",
  city: "Hà Nội",
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3.5 text-[14.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] focus-visible:border-[#D8B282]";

export function IdentityEditPage() {
  const t = useT();
  const navigate = useNavigate();
  const invalidateIdentity = useInvalidateMyIdentity();

  const [values, setValues] = useState<Record<FieldKey, string>>(EMPTY);
  const [meta, setMeta] = useState<{ countryCode: string; preferredLocale: string }>({
    countryCode: "",
    preferredLocale: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      // Try direct API call first (bypass serverFn middleware)
      let payload: any = null;
      try {
        payload = await fetchNestApi<any>("/connect-app/me/identity");
      } catch {
        // ignore — loadFailed set below
      }
      const identity = payload?.identity ?? null;
      setValues({
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
      setMeta({
        countryCode: (identity as { countryCode?: string | null } | null)?.countryCode ?? "",
        preferredLocale:
          (identity as { preferredLocale?: string | null } | null)?.preferredLocale ?? "",
      });
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function set(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
    setSaved(false);
  }

  async function handleSave() {
    if (saving) return;
    const parsed = identityUpdateSchema.safeParse({
      ...values,
      countryCode: meta.countryCode,
      preferredLocale: meta.preferredLocale,
    });
    if (!parsed.success) {
      const fieldErrors: Partial<Record<FieldKey, boolean>> = {};
      let mapped = false;
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && path in EMPTY) {
          fieldErrors[path as FieldKey] = true;
          mapped = true;
        }
      }
      setErrors(fieldErrors);
      setSaveFailed(!mapped);
      return;
    }
    setSaving(true);
    setSaveFailed(false);
    try {
      // Direct API call bypasses requireSupabaseAuth middleware
      await fetchNestApi("/connect-app/me/identity", {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      // Đồng bộ ảnh đại diện/hồ sơ ở mọi màn (Trang chủ, V-Sheet, Tôi, thẻ).
      await invalidateIdentity();
      setSaved(true);
      void navigate({ to: "/connect-app/me" });
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BusinessConnectTopBar
        title={t("bc.mobile.me.form.title")}
        back
        onBack={() => void navigate({ to: "/connect-app/me" })}
      />
      <MobilePage>
        <div className="grid gap-4 pt-4">
          <p className="text-[12.5px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.me.edit.syncNote")}
          </p>

          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2
                aria-hidden="true"
                className="h-6 w-6 animate-spin text-[var(--bc-mobile-muted)] motion-reduce:animate-none"
                strokeWidth={1.8}
              />
            </div>
          ) : loadFailed ? (
            <section className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 text-center">
              <p role="alert" className="text-[13.5px] text-[var(--bc-mobile-text)]">
                {t("bc.mobile.me.loadError")}
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 min-h-11 rounded-full border border-[var(--bc-mobile-border)] px-5 text-[14px] font-medium text-[var(--bc-mobile-text)]"
              >
                {t("bc.mobile.me.retry")}
              </button>
            </section>
          ) : (
            <>
              {GROUPS.map((group) => (
                <section
                  key={group.titleKey}
                  className="rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5 shadow-[var(--bc-mobile-shadow-v)]"
                >
                  <h2 className="text-[15px] font-semibold tracking-tight text-[var(--bc-mobile-text)]">
                    {t(group.titleKey)}
                  </h2>
                  <div className="mt-3 grid gap-4">
                    {group.fields.map((field) => (
                      <div key={field.key}>
                        <label
                          htmlFor={`me-edit-page-${field.key}`}
                          className="mb-1.5 block text-[13px] font-medium text-[var(--bc-mobile-text)]"
                        >
                          {t(field.labelKey)}
                        </label>
                        {field.key === "avatarUrl" ? (
                          <div className="grid gap-2">
                            <AvatarUploadField
                              value={values.avatarUrl}
                              onChange={(url) => set("avatarUrl", url)}
                              disabled={saving}
                            />
                            <input
                              id={`me-edit-page-${field.key}`}
                              type="url"
                              value={values[field.key]}
                              onChange={(e) => set(field.key, e.target.value)}
                              disabled={saving}
                              placeholder={FIELD_PLACEHOLDERS[field.key] || ""}
                              aria-invalid={errors[field.key] || undefined}
                              className={inputClass}
                            />
                          </div>
                        ) : field.multiline ? (
                          <textarea
                            id={`me-edit-page-${field.key}`}
                            value={values[field.key]}
                            onChange={(e) => set(field.key, e.target.value)}
                            disabled={saving}
                            placeholder={FIELD_PLACEHOLDERS[field.key] || ""}
                            rows={4}
                            aria-invalid={errors[field.key] || undefined}
                            className={`${inputClass} min-h-24 resize-y py-2.5`}
                          />
                        ) : (
                          <input
                            id={`me-edit-page-${field.key}`}
                            type={field.type}
                            value={values[field.key]}
                            onChange={(e) => set(field.key, e.target.value)}
                            disabled={saving}
                            placeholder={FIELD_PLACEHOLDERS[field.key] || ""}
                            aria-invalid={errors[field.key] || undefined}
                            className={inputClass}
                          />
                        )}
                        {errors[field.key] && (
                          <p
                            role="alert"
                            className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]"
                          >
                            {t("bc.mobile.me.field.invalidValue")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <div className="grid gap-2 pt-1">
                {saveFailed && (
                  <p
                    role="alert"
                    className="text-center text-[12.5px] text-[var(--bc-mobile-muted)]"
                  >
                    {t("bc.mobile.me.saveError")}
                  </p>
                )}
                {saved && !saveFailed && (
                  <p
                    role="status"
                    className="flex items-center justify-center gap-1.5 text-center text-[12.5px] text-[var(--bc-mobile-muted)]"
                  >
                    <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
                    {t("bc.mobile.me.edit.saved")}
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
                  onClick={() => void navigate({ to: "/connect-app/me" })}
                  disabled={saving}
                  className="min-h-11 w-full rounded-full text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
                >
                  {t("bc.mobile.me.cancel")}
                </button>
              </div>
            </>
          )}
        </div>
      </MobilePage>
    </>
  );
}
