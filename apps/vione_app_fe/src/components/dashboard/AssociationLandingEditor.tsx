import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { useT } from "@/lib/i18n";
import {
  getActiveAssociationFn,
  getAssociationBrandingFn,
  updateAssociationBrandingFn,
  type ActiveAssociation,
} from "@/lib/associations.functions";

export function AssociationLandingEditor() {
  const t = useT();
  const fetchActive = useServerFn(getActiveAssociationFn);
  const fetchBranding = useServerFn(getAssociationBrandingFn);
  const saveBranding = useServerFn(updateAssociationBrandingFn);

  const { data: assoc } = useServerData<ActiveAssociation | null>(() => fetchActive(), null);

  const [brandPrimary, setBrandPrimary] = useState("#c9a227");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [published, setPublished] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const associationId = assoc?.associationId ?? null;

  useEffect(() => {
    if (!associationId) return;
    let active = true;
    fetchBranding({ data: { associationId } })
      .then((b) => {
        if (!active || !b) return;
        if (b.brandPrimary) setBrandPrimary(b.brandPrimary);
        setTagline(b.tagline ?? "");
        setAbout(b.about ?? "");
        setContactEmail(b.contactEmail ?? "");
        setPublished(b.landingPublished);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associationId]);

  const publicUrl = useMemo(() => {
    if (!assoc?.slug || typeof window === "undefined") return null;
    return `${window.location.origin}/h/${assoc.slug}`;
  }, [assoc?.slug]);

  const save = async () => {
    if (!associationId) return;
    setSaving(true);
    try {
      await saveBranding({
        data: {
          associationId,
          brandPrimary: /^#[0-9a-fA-F]{6}$/.test(brandPrimary) ? brandPrimary : null,
          tagline: tagline.trim() || null,
          about: about.trim() || null,
          contactEmail: contactEmail.trim() || null,
          landingPublished: published,
        },
      });
      toast.success(t("common.savedToast"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "DOMAIN_NOT_VERIFIED") toast.error(t("set.landing.domainNotVerified"));
      else toast.error(msg || t("common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!associationId) {
    return <p className="text-sm text-muted-foreground">{t("set.landing.noAssoc")}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-base font-semibold text-foreground">{t("set.landing.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("set.landing.desc")}</p>
      </div>

      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {publicUrl}
        </a>
      )}

      <label className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <div className="text-sm font-medium text-foreground">{t("set.landing.publish")}</div>
          <div className="text-[11px] text-muted-foreground">{t("set.landing.publishDesc")}</div>
        </div>
        <button
          type="button"
          onClick={() => setPublished((v) => !v)}
          className={`relative h-6 w-11 rounded-full transition ${published ? "bg-primary" : "bg-secondary"}`}
          aria-label={t("set.landing.publish")}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${published ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </label>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.landing.color")}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(brandPrimary) ? brandPrimary : "#c9a227"}
            onChange={(e) => setBrandPrimary(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
          />
          <input
            value={brandPrimary}
            onChange={(e) => setBrandPrimary(e.target.value)}
            placeholder="#c9a227"
            className="h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.landing.tagline")}
        </label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={200}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.landing.about")}
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={4000}
          rows={5}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.landing.contact")}
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          maxLength={200}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving || !loaded}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}
