// Kích hoạt Danh tính Doanh nghiệp sau khi tạo tài khoản.
// Wizard 2 bước, ghi vào domain danh tính chuẩn (bcIdentityUpsertFn).
// Không tạo domain song song, không tự suy diễn dữ liệu ngoài input người dùng.

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, ChevronLeft, Loader2, Shield } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import {
  bcIdentityGetMineFn,
  bcIdentityUpsertFn,
} from "@/lib/business-connect/mobile/identity.functions";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

export const Route = createFileRoute("/connect-app/activate")({
  head: () => ({
    meta: [
      { title: "Kích hoạt danh tính — Business Connect" },
      {
        name: "description",
        content: "Hoàn tất thông tin để kích hoạt danh tính doanh nghiệp và danh thiếp điện tử.",
      },
      { property: "og:title", content: "Kích hoạt danh tính — Business Connect" },
      {
        property: "og:description",
        content: "Thiết lập danh tính doanh nghiệp của bạn trên Business Connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivateIdentityPage,
});

const GOLD = "#f2b45a";

type Form = {
  displayName: string;
  jobTitle: string;
  companyName: string;
  headline: string;
  primaryEmail: string;
  primaryPhone: string;
  website: string;
};

const EMPTY: Form = {
  displayName: "",
  jobTitle: "",
  companyName: "",
  headline: "",
  primaryEmail: "",
  primaryPhone: "",
  website: "",
};

function ActivateIdentityPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const getMine = useServerFn(bcIdentityGetMineFn);
  const upsert = useServerFn(bcIdentityUpsertFn);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2 | "done">(1);
  const [form, setForm] = useState<Form>(EMPTY);
  const [existing, setExisting] = useState<BusinessIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const payload = await getMine({}).catch(() => null);
      if (!alive) return;
      const identity = payload?.identity ?? null;
      setExisting(identity);
      setForm({
        displayName:
          identity?.displayName ??
          (typeof user?.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "") ??
          "",
        jobTitle: identity?.jobTitle ?? "",
        companyName: identity?.companyName ?? "",
        headline: identity?.headline ?? "",
        primaryEmail: identity?.primaryEmail ?? user?.email ?? "",
        primaryPhone: identity?.primaryPhone ?? "",
        website: identity?.website ?? "",
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [getMine, user]);

  const canContinue = useMemo(() => form.displayName.trim().length > 0, [form.displayName]);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!canContinue) {
      setError(t("bc.mobile.activate.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsert({
        data: {
          displayName: form.displayName.trim(),
          headline: form.headline.trim() || null,
          jobTitle: form.jobTitle.trim() || null,
          companyName: form.companyName.trim() || null,
          bio: existing?.bio ?? null,
          avatarUrl: existing?.avatarUrl ?? null,
          primaryEmail: form.primaryEmail.trim() || null,
          primaryPhone: form.primaryPhone.trim() || null,
          website: form.website.trim() || null,
          linkedinUrl: existing?.linkedinUrl ?? null,
          address: existing?.address ?? null,
          city: existing?.city ?? null,
          countryCode: existing?.countryCode ?? null,
          preferredLocale: existing?.preferredLocale ?? null,
        },
      });
      setStep("done");
    } catch {
      setError(t("bc.mobile.activate.error"));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "h-12 w-full rounded-xl border bg-transparent px-4 text-[15px] outline-none placeholder:opacity-50 focus-visible:ring-1";
  const inputStyle = { borderColor: "#22384c", color: "#f5f7fa" } as const;

  const field = (
    key: keyof Form,
    label: string,
    opts?: { optional?: boolean; type?: string; inputMode?: "email" | "tel" | "url" },
  ) => (
    <div>
      <label className="mb-2 flex items-center justify-between text-[15px]" htmlFor={`act-${key}`}>
        <span>{label}</span>
        {opts?.optional ? (
          <span className="text-[13px]" style={{ color: "#7d8d9d" }}>
            {t("bc.mobile.activate.optional")}
          </span>
        ) : null}
      </label>
      <input
        id={`act-${key}`}
        className={inputCls}
        style={inputStyle}
        type={opts?.type ?? "text"}
        inputMode={opts?.inputMode}
        value={form[key]}
        disabled={saving}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <main
      className="relative min-h-[100dvh] w-full"
      style={{ background: "#0A0A0B", color: "#f5f7fa" }}
    >
      <div className="mx-auto w-full max-w-md px-6 pb-16 pt-6">
        {step !== "done" ? (
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : navigate({ to: "/connect-app" }))}
            className="inline-flex items-center gap-1 text-[15px]"
            style={{ color: "#8fa0b1" }}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            {t("bc.mobile.activate.back")}
          </button>
        ) : null}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: GOLD }} aria-hidden="true" />
          </div>
        ) : step === "done" ? (
          <section className="mt-16 flex flex-col items-center text-center" aria-live="polite">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(201,163,91,0.14)",
                border: "1px solid rgba(201,163,91,0.35)",
              }}
              aria-hidden="true"
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: GOLD }} />
            </span>
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight">
              {t("bc.mobile.activate.doneTitle")}
            </h1>
            <p className="mt-2 text-[15px]" style={{ color: "#a9b6c4" }}>
              {t("bc.mobile.activate.doneSubtitle")}
            </p>
            <Link
              to="/connect-app/me"
              className="mt-8 flex h-14 w-full items-center justify-center rounded-xl text-[17px] font-semibold text-[#1b1206]"
              style={{ background: "linear-gradient(135deg, #AB6D3C 0%, #FDE6B4 100%)" }}
            >
              {t("bc.mobile.activate.goToMe")}
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(201,163,91,0.14)",
                  border: "1px solid rgba(201,163,91,0.35)",
                }}
                aria-hidden="true"
              >
                <Shield className="h-5 w-5" style={{ color: GOLD }} />
              </span>
              <div>
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
                  {t("bc.mobile.activate.title")}
                </h1>
                <p className="text-[14px]" style={{ color: "#8fa0b1" }}>
                  {t("bc.mobile.activate.step")} {step} {t("bc.mobile.activate.of")} 2 ·{" "}
                  {step === 1
                    ? t("bc.mobile.activate.step1Title")
                    : t("bc.mobile.activate.step2Title")}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#a9b6c4" }}>
              {t("bc.mobile.activate.subtitle")}
            </p>

            <div className="mt-5 flex gap-2" aria-hidden="true">
              {[1, 2].map((n: any) => (
                <span
                  key={n}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: n <= step ? GOLD : "#1d3448" }}
                />
              ))}
            </div>

            {error ? (
              <p role="alert" className="mt-5 text-[14px]" style={{ color: "#ff9d95" }}>
                {error}
              </p>
            ) : null}

            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (saving) return;
                if (step === 1) {
                  if (!canContinue) {
                    setError(t("bc.mobile.activate.nameRequired"));
                    return;
                  }
                  setError(null);
                  setStep(2);
                } else {
                  void save();
                }
              }}
            >
              {step === 1 ? (
                <>
                  {field("displayName", t("bc.mobile.activate.displayName"))}
                  {field("jobTitle", t("bc.mobile.activate.jobTitle"), { optional: true })}
                  {field("companyName", t("bc.mobile.activate.companyName"), { optional: true })}
                  {field("headline", t("bc.mobile.activate.headline"), { optional: true })}
                </>
              ) : (
                <>
                  {field("primaryEmail", t("bc.mobile.activate.email"), {
                    optional: true,
                    type: "email",
                    inputMode: "email",
                  })}
                  {field("primaryPhone", t("bc.mobile.activate.phone"), {
                    optional: true,
                    type: "tel",
                    inputMode: "tel",
                  })}
                  {field("website", t("bc.mobile.activate.website"), {
                    optional: true,
                    inputMode: "url",
                  })}
                  <p className="text-[13px] leading-relaxed" style={{ color: "#7d8d9d" }}>
                    {t("bc.mobile.activate.privacyNote")}
                  </p>
                </>
              )}

              <button
                type="submit"
                disabled={saving}
                className="relative flex h-14 w-full items-center justify-center rounded-xl text-[17px] font-semibold text-[#1b1206] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #AB6D3C 0%, #FDE6B4 100%)" }}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    {t("bc.mobile.activate.saving")}
                  </>
                ) : (
                  <>
                    {step === 1 ? t("bc.mobile.activate.continue") : t("bc.mobile.activate.finish")}
                    <ArrowRight className="absolute right-6 h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>

              <Link
                to="/connect-app"
                className="block text-center text-[15px]"
                style={{ color: "#8fa0b1" }}
              >
                {t("bc.mobile.activate.skip")}
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
