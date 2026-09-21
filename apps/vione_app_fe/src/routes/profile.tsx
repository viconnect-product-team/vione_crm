import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useT, type TKey } from "@/lib/i18n";
import { AvatarUploadField } from "@/components/business-connect/mobile/me/AvatarUploadField";
import { fetchNestApi } from "@/lib/api-client";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Hồ sơ cá nhân — ViOne" }] }),
  component: ProfilePage,
});

type Form = {
  full_name: string;
  phone: string;
  title: string;
  location: string;
  bio: string;
  avatar_url: string;
};

const FIELDS: { key: keyof Form; labelKey: TKey; type?: "textarea" }[] = [
  { key: "full_name", labelKey: "profile.fullName" },
  { key: "phone", labelKey: "profile.phone" },
  { key: "title", labelKey: "profile.titleField" },
  { key: "location", labelKey: "profile.location" },
  { key: "bio", labelKey: "profile.bio", type: "textarea" },
];

function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Form>({
    full_name: "",
    phone: "",
    title: "",
    location: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    let active = true;
    const token = typeof window !== 'undefined' ? localStorage.getItem('vibe_token') : null;
    if (!token) {
      navigate({ to: "/auth" });
      return;
    }

    let decodedUser: any = null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      decodedUser = JSON.parse(window.atob(base64));
      setEmail(decodedUser.username || "");
      setUserId(decodedUser.sub);
    } catch (e) {
      navigate({ to: "/auth" });
      return;
    }

    fetchNestApi("/profile")
      .then((prof) => {
        if (!active) return;
        const p = prof || {};
        setForm({
          full_name: p.display_name || decodedUser.name || "",
          phone: p.phone || "",
          title: p.professional_title || "",
          location: p.region || "",
          bio: p.bio || "",
          avatar_url: p.avatar_url || "",
        });
        setLoading(false);
      })
      .catch((e) => {
        console.error("Error loading profile:", e);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await fetchNestApi("/profile", {
        method: "POST",
        body: JSON.stringify({
          display_name: form.full_name.trim(),
          professional_title: form.title.trim() || null,
          region: form.location.trim() || null,
          bio: form.bio.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          phone: form.phone.trim() || null,
        }),
      });
      toast.success(t("profile.saved"));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={t("profile.page.title")}
        subtitle={t("profile.page.subtitle")}
        actions={
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> {t("profile.back")}
          </button>
        }
      />

      <Card className="max-w-2xl p-5">
        <h2 className="text-base font-semibold text-foreground">{t("profile.section.basic")}</h2>

        {loading ? (
          <div className="mt-4 text-sm text-muted-foreground">{t("profile.loading")}</div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Avatar upload */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {t("profile.avatar")}
              </label>
              <AvatarUploadField
                value={form.avatar_url}
                onChange={(url) => set("avatar_url", url)}
                disabled={saving}
              />
            </div>
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {t(f.labelKey)}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    value={form[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                  />
                ) : (
                  <input
                    value={form[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-ring focus:outline-none"
                  />
                )}
              </div>
            ))}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t("profile.email")}
              </label>
              <input
                value={email}
                disabled
                className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("profile.emailHint")}</p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        )}
      </Card>
    </AppShell>
  );
}

