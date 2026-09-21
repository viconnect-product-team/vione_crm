// BC-2.2 — Global Business Card builder (mobile-first).
// Platform-user-owned card editor. All data access goes through BusinessCardSDK;
// no direct table access, no member/association assumptions. Publish gating uses
// the shared pure validator.

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n";
import { BusinessCardSDK } from "@/lib/business-card";
import { validateCardForPublish } from "@/lib/business-card/publish-validation";
import type {
  BusinessCard,
  CardWriteInput,
  PublicMode,
  QrOptions,
} from "@/lib/business-card/business-card.types";
import { DEFAULT_QR_OPTIONS, normalizeQrOptions } from "@/lib/business-card/business-card.types";
import { GlobalCardPreview, type QrPreviewOptions } from "./GlobalCardPreview";
import { CardTemplateGallery } from "./CardTemplateGallery";
import { getTemplate } from "@/lib/card-templates";
import { Slider } from "@/components/ui/slider";
import { evaluateLogoPlacement, clampPlacement } from "@/lib/qr-safety";
import { autoOptimizeQr } from "@/lib/qr-optimize";
import { resolveTheme } from "@/lib/business-card/business-card.share";
import { AlertTriangle, Sparkles } from "lucide-react";
import { AiCardImportModal } from "./AiCardImportModal";
import type { CardAiSuggestion } from "@/lib/card-ai.functions";

type FormState = {
  slug: string;
  displayName: string;
  professionalTitle: string;
  headline: string;
  companyName: string;
  bio: string;
  // English side (optional). When any of these is non-empty the preview and
  // the exported card render a second EN face.
  displayNameEn: string;
  professionalTitleEn: string;
  headlineEn: string;
  companyNameEn: string;
  bioEn: string;
  avatarUrl: string;
  website: string;
  workEmail: string;
  workPhone: string;
  zaloUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  publicMode: PublicMode;
  showContact: boolean;
  showSocial: boolean;
  themeId: string | null;
};

function toForm(c: BusinessCard): FormState {
  return {
    slug: c.slug ?? "",
    displayName: c.displayName ?? "",
    professionalTitle: c.professionalTitle ?? "",
    headline: c.headline ?? "",
    companyName: c.companyName ?? "",
    bio: c.bio ?? "",
    displayNameEn: c.displayNameEn ?? "",
    professionalTitleEn: c.professionalTitleEn ?? "",
    headlineEn: c.headlineEn ?? "",
    companyNameEn: c.companyNameEn ?? "",
    bioEn: c.bioEn ?? "",
    avatarUrl: c.avatarUrl ?? "",
    website: c.website ?? "",
    workEmail: c.workEmail ?? "",
    workPhone: c.workPhone ?? "",
    zaloUrl: c.zaloUrl ?? "",
    linkedinUrl: c.linkedinUrl ?? "",
    facebookUrl: c.facebookUrl ?? "",
    youtubeUrl: c.youtubeUrl ?? "",
    tiktokUrl: c.tiktokUrl ?? "",
    publicMode: c.publicMode ?? "members_only",
    showContact: c.visibilitySettings?.showContact ?? true,
    showSocial: c.visibilitySettings?.showSocial ?? true,
    themeId: c.themeId ?? null,
  };
}

function toWriteInput(
  id: string,
  card: BusinessCard,
  f: FormState,
): CardWriteInput & { id: string } {
  const trimOrNull = (s: string) => (s.trim() ? s.trim() : null);
  return {
    id,
    scope: "global",
    slug: f.slug.trim(),
    cardKind: card.cardKind,
    publicMode: f.publicMode,
    visibilitySettings: {
      showContact: f.showContact,
      showSocial: f.showSocial,
      showServices: card.visibilitySettings?.showServices ?? true,
      showNeeds: card.visibilitySettings?.showNeeds ?? true,
    },
    displayName: trimOrNull(f.displayName),
    professionalTitle: trimOrNull(f.professionalTitle),
    headline: trimOrNull(f.headline),
    companyName: trimOrNull(f.companyName),
    bio: trimOrNull(f.bio),
    displayNameEn: trimOrNull(f.displayNameEn),
    professionalTitleEn: trimOrNull(f.professionalTitleEn),
    headlineEn: trimOrNull(f.headlineEn),
    companyNameEn: trimOrNull(f.companyNameEn),
    bioEn: trimOrNull(f.bioEn),
    avatarUrl: trimOrNull(f.avatarUrl),
    website: trimOrNull(f.website),
    workEmail: trimOrNull(f.workEmail),
    workPhone: trimOrNull(f.workPhone),
    zaloUrl: trimOrNull(f.zaloUrl),
    linkedinUrl: trimOrNull(f.linkedinUrl),
    facebookUrl: trimOrNull(f.facebookUrl),
    youtubeUrl: trimOrNull(f.youtubeUrl),
    tiktokUrl: trimOrNull(f.tiktokUrl),
    themeId: f.themeId ?? card.themeId,
    customBrandColor: card.customBrandColor,
    companyLogoUrl: card.companyLogoUrl,
    coverUrl: card.coverUrl,
    address: card.address,
    mapUrl: card.mapUrl,
    skills: card.skills.map((s) => ({ label: s.label })),
    services: card.services,
    needs: card.needs,
  };
}

export function GlobalCardBuilder({
  card,
  onSaved,
}: {
  card: BusinessCard;
  onSaved?: (c: BusinessCard) => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<BusinessCard>(card);
  const [form, setForm] = useState<FormState>(() => toForm(card));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [qrOptions, setQrOptions] = useState<QrOptions>(() =>
    card.qrOptions ? normalizeQrOptions(card.qrOptions) : DEFAULT_QR_OPTIONS,
  );
  const setQr = <K extends keyof QrOptions>(key: K, value: QrOptions[K]) =>
    setQrOptions((q) => ({ ...q, [key]: value }));
  const setQrPlacement = (patch: Partial<QrOptions>) =>
    setQrOptions((q) => {
      const next = { ...q, ...patch };
      const safe = clampPlacement({
        logoScale: next.logoScale,
        logoOffsetX: next.logoOffsetX,
        logoOffsetY: next.logoOffsetY,
      });
      return { ...next, ...safe };
    });
  const qrSafety = useMemo(
    () =>
      evaluateLogoPlacement({
        logoScale: qrOptions.logoScale,
        logoOffsetX: qrOptions.logoOffsetX,
        logoOffsetY: qrOptions.logoOffsetY,
      }),
    [qrOptions.logoScale, qrOptions.logoOffsetX, qrOptions.logoOffsetY],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const issues = useMemo(
    () =>
      validateCardForPublish({
        displayName: form.displayName,
        professionalTitle: form.professionalTitle,
        headline: form.headline,
        slug: form.slug,
        status: current.status,
        website: form.website,
        workEmail: form.workEmail,
        workPhone: form.workPhone,
        zaloUrl: form.zaloUrl,
        linkedinUrl: form.linkedinUrl,
        facebookUrl: form.facebookUrl,
        youtubeUrl: form.youtubeUrl,
        tiktokUrl: form.tiktokUrl,
        publicMode: form.publicMode,
        visibilitySettings: {
          showContact: form.showContact,
          showSocial: form.showSocial,
          showServices: current.visibilitySettings?.showServices ?? true,
          showNeeds: current.visibilitySettings?.showNeeds ?? true,
        },
      }),
    [form, current],
  );
  const canPublish = issues.length === 0;

  async function save(): Promise<boolean> {
    setSaving(true);
    try {
      await BusinessCardSDK.update({
        ...toWriteInput(current.id, current, form),
        qrOptions,
      });
      const fresh = await BusinessCardSDK.getGlobal(current.id);
      setCurrent(fresh);
      setForm(toForm(fresh));
      if (fresh.qrOptions) setQrOptions(normalizeQrOptions(fresh.qrOptions));
      onSaved?.(fresh);
      toast.success(t("connect.builder.saved"));
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function withBusy(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      const fresh = await BusinessCardSDK.getGlobal(current.id);
      setCurrent(fresh);
      onSaved?.(fresh);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!(await save())) return;
    await withBusy(() => BusinessCardSDK.publish(current.id));
    toast.success(t("connect.status.published"));
  }

  const isPublished = current.status === "published";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/connect/cards" })}>
          <ArrowLeft className="size-4" />
          <span>{t("connect.builder.back")}</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiOpen(true)}
            title={t("connect.ai.import.title")}
          >
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">{t("connect.ai.import.button")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>{saving ? t("connect.builder.saving") : t("connect.builder.save")}</span>
          </Button>
          {isPublished ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void withBusy(() => BusinessCardSDK.unpublish(current.id))}
            >
              {t("connect.card.unpublish")}
            </Button>
          ) : (
            <Button size="sm" disabled={busy || !canPublish} onClick={() => void publish()}>
              {t("connect.card.publish")}
            </Button>
          )}
        </div>
      </div>

      {!canPublish && (
        <div
          className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
          role="status"
        >
          <p className="font-medium text-foreground">{t("connect.publish.blocked")}</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {issues.map((i) => (
              <li key={i.code}>{t(`connect.publish.issue.${i.code}` as never)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionBasics")}
            </legend>
            <Field label={t("connect.field.displayName")}>
              <Input
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </Field>
            <Field label={t("connect.field.professionalTitle")}>
              <Input
                value={form.professionalTitle}
                onChange={(e) => set("professionalTitle", e.target.value)}
              />
            </Field>
            <Field label={t("connect.field.headline")}>
              <Input value={form.headline} onChange={(e) => set("headline", e.target.value)} />
            </Field>
            <Field label={t("connect.field.companyName")}>
              <Input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </Field>
            <Field label={t("connect.field.bio")}>
              <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
            </Field>
            <Field label={t("connect.field.slug")}>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionEnglish")}
            </legend>
            <p className="text-xs text-muted-foreground">{t("connect.builder.englishHint")}</p>
            <Field label={t("connect.field.displayNameEn")}>
              <Input
                value={form.displayNameEn}
                onChange={(e) => set("displayNameEn", e.target.value)}
                placeholder={form.displayName}
              />
            </Field>
            <Field label={t("connect.field.professionalTitleEn")}>
              <Input
                value={form.professionalTitleEn}
                onChange={(e) => set("professionalTitleEn", e.target.value)}
                placeholder={form.professionalTitle}
              />
            </Field>
            <Field label={t("connect.field.headlineEn")}>
              <Input
                value={form.headlineEn}
                onChange={(e) => set("headlineEn", e.target.value)}
                placeholder={form.headline}
              />
            </Field>
            <Field label={t("connect.field.companyNameEn")}>
              <Input
                value={form.companyNameEn}
                onChange={(e) => set("companyNameEn", e.target.value)}
                placeholder={form.companyName}
              />
            </Field>
            <Field label={t("connect.field.bioEn")}>
              <Textarea
                rows={3}
                value={form.bioEn}
                onChange={(e) => set("bioEn", e.target.value)}
                placeholder={form.bio}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionTemplate")}
            </legend>
            <TemplateChooser currentId={form.themeId} onSelect={(id) => set("themeId", id)} />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionQr")}
            </legend>
            <p className="text-xs text-muted-foreground">{t("connect.builder.qrHint")}</p>
            <Field label={t("connect.qr.background")}>
              <Select
                value={qrOptions.background}
                onValueChange={(v) =>
                  setQr("background", v as QrPreviewOptions["background"] & string)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">{t("connect.qr.bg.white")}</SelectItem>
                  <SelectItem value="template">{t("connect.qr.bg.template")}</SelectItem>
                  <SelectItem value="transparent">{t("connect.qr.bg.transparent")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label={`${t("connect.qr.logoSize")} · ${Math.round(qrOptions.logoScale * 100)}%`}
            >
              <Slider
                min={14}
                max={30}
                step={1}
                value={[Math.round(qrOptions.logoScale * 100)]}
                onValueChange={([v]) => setQrPlacement({ logoScale: (v ?? 22) / 100 })}
                aria-label={t("connect.qr.logoSize")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={`${t("connect.qr.offsetX")} · ${Math.round(qrOptions.logoOffsetX * 100)}%`}
              >
                <Slider
                  min={-25}
                  max={25}
                  step={1}
                  value={[Math.round(qrOptions.logoOffsetX * 100)]}
                  onValueChange={([v]) => setQrPlacement({ logoOffsetX: (v ?? 0) / 100 })}
                  aria-label={t("connect.qr.offsetX")}
                />
              </Field>
              <Field
                label={`${t("connect.qr.offsetY")} · ${Math.round(qrOptions.logoOffsetY * 100)}%`}
              >
                <Slider
                  min={-25}
                  max={25}
                  step={1}
                  value={[Math.round(qrOptions.logoOffsetY * 100)]}
                  onValueChange={([v]) => setQrPlacement({ logoOffsetY: (v ?? 0) / 100 })}
                  aria-label={t("connect.qr.offsetY")}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const theme = resolveTheme(form.themeId);
                  const result = autoOptimizeQr(qrOptions, {
                    text: theme.text,
                    surface: theme.surface,
                    accent: theme.accent,
                  });
                  if (!result.changed) {
                    toast.success(t("connect.qr.autoOptimize.noop"));
                    return;
                  }
                  setQrOptions(result.next);
                  toast.success(
                    t("connect.qr.autoOptimize.applied", {
                      ratio: result.contrastRatio.toFixed(1),
                    }),
                  );
                }}
              >
                <Sparkles className="mr-1.5 size-4" aria-hidden />
                {t("connect.qr.autoOptimize")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQrOptions(DEFAULT_QR_OPTIONS)}
              >
                {t("connect.qr.reset")}
              </Button>
            </div>
            {!qrSafety.safe && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-warning bg-warning p-3 text-xs text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="flex-1 space-y-2">
                  <ul className="space-y-1">
                    {qrSafety.issues.map((k) => (
                      <li key={k}>{t(`connect.qr.safety.${k}` as never)}</li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setQrPlacement(qrSafety.suggestion)}
                  >
                    {t("connect.qr.safety.autoFix")}
                  </Button>
                </div>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionContact")}
            </legend>
            <Field label={t("connect.field.workPhone")}>
              <Input value={form.workPhone} onChange={(e) => set("workPhone", e.target.value)} />
            </Field>
            <Field label={t("connect.field.workEmail")}>
              <Input value={form.workEmail} onChange={(e) => set("workEmail", e.target.value)} />
            </Field>
            <Field label={t("connect.field.website")}>
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionSocial")}
            </legend>
            <Field label={t("connect.field.linkedinUrl")}>
              <Input
                value={form.linkedinUrl}
                onChange={(e) => set("linkedinUrl", e.target.value)}
              />
            </Field>
            <Field label={t("connect.field.facebookUrl")}>
              <Input
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
              />
            </Field>
            <Field label={t("connect.field.zaloUrl")}>
              <Input value={form.zaloUrl} onChange={(e) => set("zaloUrl", e.target.value)} />
            </Field>
            <Field label={t("connect.field.youtubeUrl")}>
              <Input value={form.youtubeUrl} onChange={(e) => set("youtubeUrl", e.target.value)} />
            </Field>
            <Field label={t("connect.field.tiktokUrl")}>
              <Input value={form.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("connect.builder.sectionVisibility")}
            </legend>
            <Field label={t("connect.field.publicMode")}>
              <Select
                value={form.publicMode}
                onValueChange={(v) => set("publicMode", v as PublicMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("connect.mode.public")}</SelectItem>
                  <SelectItem value="members_only">{t("connect.mode.members_only")}</SelectItem>
                  <SelectItem value="private">{t("connect.mode.private")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <span className="text-sm text-foreground">{t("connect.vis.showContact")}</span>
              <Switch checked={form.showContact} onCheckedChange={(v) => set("showContact", v)} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <span className="text-sm text-foreground">{t("connect.vis.showSocial")}</span>
              <Switch checked={form.showSocial} onCheckedChange={(v) => set("showSocial", v)} />
            </label>
          </fieldset>
        </form>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <p className="text-sm font-semibold text-foreground">{t("connect.builder.preview")}</p>
          <GlobalCardPreview
            state={{
              displayName: form.displayName,
              professionalTitle: form.professionalTitle,
              headline: form.headline,
              companyName: form.companyName,
              bio: form.bio,
              displayNameEn: form.displayNameEn,
              professionalTitleEn: form.professionalTitleEn,
              headlineEn: form.headlineEn,
              companyNameEn: form.companyNameEn,
              bioEn: form.bioEn,
              avatarUrl: form.avatarUrl,
              website: form.website,
              workEmail: form.workEmail,
              workPhone: form.workPhone,
              themeId: form.themeId ?? current.themeId,
              slug: current.slug,
              showContact: form.showContact,
              qrOptions,
            }}
          />

          <div className="flex flex-wrap gap-2">
            {isPublished && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/b/${current.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  <span>{t("connect.card.view")}</span>
                </a>
              </Button>
            )}
            {current.cardKind !== "primary" && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void withBusy(() => BusinessCardSDK.setPrimary(current.id))}
              >
                <Star className="size-4" />
                <span>{t("connect.card.setPrimary")}</span>
              </Button>
            )}
          </div>
        </aside>
      </div>

      <AiCardImportModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        onApply={(s: CardAiSuggestion) => {
          setForm((f) => ({
            ...f,
            displayName: s.displayName ?? f.displayName,
            professionalTitle: s.professionalTitle ?? f.professionalTitle,
            companyName: s.companyName ?? f.companyName,
            headline: s.headline ?? f.headline,
            website: s.website ?? f.website,
            workEmail: s.workEmail ?? f.workEmail,
            workPhone: s.workPhone ?? f.workPhone,
            themeId: s.templateId ?? f.themeId,
          }));
          setQrOptions((q) => ({ ...q, background: s.qrBackground }));
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TemplateChooser({
  currentId,
  onSelect,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const tpl = getTemplate(currentId);
  return (
    <div className="rounded-lg border p-3 flex items-center gap-3">
      <div
        className="h-16 w-24 rounded-md border shrink-0"
        style={{ background: tpl?.surface ?? "hsl(var(--muted))" }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {tpl?.label ?? t("connect.template.chooseCta")}
        </p>
        {tpl && (
          <p className="text-xs text-muted-foreground truncate">
            {tpl.industries.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
      <CardTemplateGallery
        currentId={currentId}
        onSelect={onSelect}
        trigger={
          <Button variant="outline" size="sm" type="button">
            {tpl ? t("connect.template.change") : t("connect.template.chooseCta")}
          </Button>
        }
      />
    </div>
  );
}
