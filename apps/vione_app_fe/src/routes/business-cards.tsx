import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  IdCard,
  Inbox,
  BarChart3,
  Loader2,
  ExternalLink,
  Star,
  Link2,
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Save,
  X,
  Download,
  QrCode,
  Search,
} from "lucide-react";
import { CardPreviewModal } from "@/components/member/CardPreviewModal";
import { ConfirmDialog } from "@/components/member/ConfirmDialog";
import { performWithUndo } from "@/lib/undo-action";
import { cardPermissionErrorKey } from "@/lib/card-permission-error";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { useServerData } from "@/hooks/use-server-data";
import { LinkMemberProfile } from "@/components/dashboard/LinkMemberProfile";
import { LinkMemberModal } from "@/components/dashboard/LinkMemberModal";
import { useT, type TKey } from "@/lib/i18n";
import { AvatarUploadField } from "@/components/business-connect/mobile/me/AvatarUploadField";
import {
  listMyBusinessCardsFn,
  getMyBusinessCardFn,
  saveBusinessCardFn,
  setBusinessCardStatusFn,
  setPrimaryBusinessCardFn,
  deleteBusinessCardFn,
  listMyBusinessCardLeadsFn,
  getBusinessCardStatsFn,
  DEFAULT_VISIBILITY,
  type BusinessCardSummary,
  type BusinessCardLead,
  type BusinessCardStats,
  type BusinessCard,
  type CardKind,
  type CardStatus,
  type PublicMode,
  type VisibilitySettings,
} from "@/lib/business-card.functions";

export const Route = createFileRoute("/business-cards")({
  component: BusinessCardsPage,
});

type Tab = "cards" | "leads" | "stats";

const STATUS_KEY: Record<CardStatus, TKey> = {
  draft: "bc.st.draft",
  published: "bc.st.published",
  hidden: "bc.st.hidden",
  suspended: "bc.st.suspended",
  archived: "bc.st.archived",
  rejected: "bc.st.rejected",
};

// ── Draft model (shared shape with mobile editor) ───────────────────────────
type Draft = {
  id: string | null;
  slug: string;
  cardKind: CardKind;
  publicMode: PublicMode;
  visibility: VisibilitySettings;
  displayName: string;
  professionalTitle: string;
  companyName: string;
  avatarUrl: string;
  headline: string;
  bio: string;
  website: string;
  workEmail: string;
  workPhone: string;
  address: string;
  zaloUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  skills: string[];
  services: { title: string; description: string }[];
  needs: { title: string; description: string }[];
};

function emptyDraft(): Draft {
  return {
    id: null,
    slug: "",
    cardKind: "primary",
    publicMode: "members_only",
    visibility: { ...DEFAULT_VISIBILITY },
    displayName: "",
    professionalTitle: "",
    companyName: "",
    avatarUrl: "",
    headline: "",
    bio: "",
    website: "",
    workEmail: "",
    workPhone: "",
    address: "",
    zaloUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    skills: [],
    services: [],
    needs: [],
  };
}

function fromCard(c: BusinessCard): Draft {
  return {
    id: c.id,
    slug: c.slug,
    cardKind: c.cardKind,
    publicMode: c.publicMode,
    visibility: c.visibilitySettings,
    displayName: c.displayName ?? "",
    professionalTitle: c.professionalTitle ?? "",
    companyName: c.companyName ?? "",
    avatarUrl: c.avatarUrl ?? "",
    headline: c.headline ?? "",
    bio: c.bio ?? "",
    website: c.website ?? "",
    workEmail: c.workEmail ?? "",
    workPhone: c.workPhone ?? "",
    address: c.address ?? "",
    zaloUrl: c.zaloUrl ?? "",
    linkedinUrl: c.linkedinUrl ?? "",
    facebookUrl: c.facebookUrl ?? "",
    youtubeUrl: c.youtubeUrl ?? "",
    tiktokUrl: c.tiktokUrl ?? "",
    skills: c.skills.map((s) => s.label),
    services: c.services.map((s) => ({ title: s.title, description: s.description ?? "" })),
    needs: c.needs.map((s) => ({ title: s.title, description: s.description ?? "" })),
  };
}

function BusinessCardsPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("cards");

  return (
    <AppShell>
      <PageHeader title={t("bc.title")} subtitle={t("bc.subtitle")} />

      <div className="mb-6 flex gap-2">
        {(["cards", "leads", "stats"] as const).map((tk) => {
          const active = tab === tk;
          const label: TKey =
            tk === "cards" ? "bc.tab.cards" : tk === "leads" ? "bc.tab.leads" : "bc.tab.stats";
          return (
            <button
              key={tk}
              onClick={() => setTab(tk)}
              aria-pressed={active}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t(label)}
            </button>
          );
        })}
      </div>

      {tab === "cards" ? <CardsTab /> : tab === "leads" ? <LeadsTab /> : <StatsTab />}
    </AppShell>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-primary">{icon}</div>
      <p className="text-sm font-medium text-foreground">{message}</p>
    </Card>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function CardsTab() {
  const t = useT();
  const listFn = useServerFn(listMyBusinessCardsFn);
  const getFn = useServerFn(getMyBusinessCardFn);
  const [cards, setCards] = useState<BusinessCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHighlight, setLinkHighlight] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "unpublished">("all");
  const linkSectionRef = useRef<HTMLDivElement>(null);

  const goToLinkSection = useCallback(() => {
    const el = linkSectionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setLinkHighlight(true);
    window.setTimeout(() => {
      const focusable = el.querySelector<HTMLElement>(
        "input, button:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus({ preventScroll: true });
    }, 350);
    window.setTimeout(() => setLinkHighlight(false), 2200);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await listFn());
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setLoading(false);
    }
  }, [listFn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openEdit = async (id: string) => {
    try {
      const card = await getFn({ data: { id } });
      setEditing(fromCard(card));
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    }
  };

  if (editing) {
    return (
      <CardEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
      />
    );
  }

  if (loading) return <Spinner />;

  if (cards.length === 0)
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <IdCard className="h-7 w-7" />
          </div>
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-foreground">{t("bc.empty.title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("bc.empty.guide")}
            </p>
          </div>
          <div className="w-full max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("bc.empty.steps")}
            </p>
            <ol className="grid gap-3 text-left sm:grid-cols-3">
              {([1, 2, 3] as const).map((n: any) => (
                <li
                  key={n}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {n}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {t(`bc.empty.step${n}.title` as TKey)}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {t(`bc.empty.step${n}.desc` as TKey)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setEditing(emptyDraft())}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
              {t("bc.new")}
            </button>
            <button
              onClick={goToLinkSection}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Link2 className="h-4 w-4" />
              {t("bc.link.search.open")}
            </button>
          </div>
        </Card>
        <div
          id="link-member-profile"
          ref={linkSectionRef}
          tabIndex={-1}
          className={
            "scroll-mt-24 rounded-2xl transition-all duration-500 " +
            (linkHighlight ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "")
          }
        >
          <LinkMemberProfile onLinked={refresh} />
        </div>
        <LinkMemberModal
          open={linkOpen}
          onOpenChange={setLinkOpen}
          onLinked={() => {
            void refresh();
            setEditing(emptyDraft());
          }}
        />
      </div>
    );

  const q = query.trim().toLowerCase();
  const filtered = cards.filter((c) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? c.status === "published" : c.status !== "published");
    if (!matchesStatus) return false;
    if (!q) return true;
    return [c.displayName, c.slug, c.professionalTitle, c.companyName]
      .filter(Boolean)
      .some((v) => (v as string).toLowerCase().includes(q));
  });

  const FILTERS = [
    { key: "all", label: t("bc.filter.all") },
    { key: "published", label: t("bc.filter.published") },
    { key: "unpublished", label: t("bc.filter.unpublished") },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setLinkOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Link2 className="h-4 w-4" />
          {t("bc.link.search.open")}
        </button>
        <button
          onClick={() => setEditing(emptyDraft())}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
          {t("bc.new")}
        </button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bc.search.placeholder")}
            aria-label={t("bc.search.placeholder")}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("bc.filter.all")}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              aria-pressed={statusFilter === f.key}
              className={
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
                (statusFilter === f.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-muted")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("bc.filter.count", { n: filtered.length })}
      </p>
      {filtered.length === 0 ? (
        <Card className="px-6 py-10 text-center text-sm text-muted-foreground">
          {t("bc.filter.empty")}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <CardTile key={c.id} card={c} onEdit={() => void openEdit(c.id)} onChanged={refresh} />
          ))}
        </div>
      )}

      <LinkMemberModal
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onLinked={() => {
          void refresh();
          setEditing(emptyDraft());
        }}
      />
    </div>
  );
}

function CardTile({
  card,
  onEdit,
  onChanged,
}: {
  card: BusinessCardSummary;
  onEdit: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const t = useT();
  const setStatus = useServerFn(setBusinessCardStatusFn);
  const setPrimary = useServerFn(setPrimaryBusinessCardFn);
  const del = useServerFn(deleteBusinessCardFn);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<null | "delete" | "primary">(null);
  const published = card.status === "published";

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await onChanged();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const commit = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = () => setConfirmKind("primary");
  const togglePublish = () =>
    run(
      () =>
        setStatus({
          data: { id: card.id, status: published ? "hidden" : "published" },
        }),
      published ? t("bc.unpublish") : t("bc.published"),
    );
  const remove = () => setConfirmKind("delete");

  const onConfirm = () => {
    const kind = confirmKind;
    setConfirmKind(null);
    if (kind === "delete") {
      performWithUndo({
        message: t("bc.deleteScheduled"),
        undoLabel: t("bc.undo"),
        commit: () => commit(() => del({ data: { id: card.id } })),
      });
    } else if (kind === "primary") {
      performWithUndo({
        message: t("bc.primaryScheduled"),
        undoLabel: t("bc.undo"),
        commit: () => commit(() => setPrimary({ data: { id: card.id } })),
      });
    }
  };

  return (
    <Card className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between">
        <span className="truncate text-base font-semibold text-foreground">
          {card.displayName ?? card.slug}
        </span>
        {card.cardKind === "primary" && (
          <Star className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        )}
      </div>
      {card.professionalTitle && (
        <span className="truncate text-sm text-muted-foreground">{card.professionalTitle}</span>
      )}
      {card.companyName && (
        <span className="truncate text-xs text-muted-foreground">{card.companyName}</span>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>/b/{card.slug}</span>
        <span>·</span>
        <span className={published ? "font-medium text-primary" : ""}>
          {t(STATUS_KEY[card.status])}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ActionBtn
          onClick={onEdit}
          icon={<Pencil className="h-3.5 w-3.5" />}
          label={t("bc.edit")}
        />
        <ActionBtn
          onClick={() => setPreviewOpen(true)}
          icon={<QrCode className="h-3.5 w-3.5" />}
          label={t("bc.preview")}
        />
        {card.cardKind !== "primary" && (
          <ActionBtn
            onClick={() => void makePrimary()}
            disabled={busy}
            icon={<Star className="h-3.5 w-3.5" />}
            label={t("bc.setPrimary")}
          />
        )}
        <ActionBtn
          onClick={() => void togglePublish()}
          disabled={busy}
          icon={published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          label={published ? t("bc.unpublish") : t("bc.publish")}
        />
        {published && (
          <a
            href={`/b/${card.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("bc.viewPublic")}
          </a>
        )}
        <button
          onClick={() => void remove()}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("bc.delete")}
        </button>
      </div>
      {previewOpen && (
        <CardPreviewModal
          slug={card.slug}
          name={card.displayName || card.slug}
          title={card.professionalTitle || undefined}
          company={card.companyName || undefined}
          avatarUrl={card.avatarUrl}
          published={published}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      <ConfirmDialog
        open={confirmKind !== null}
        onOpenChange={(o) => !o && setConfirmKind(null)}
        title={t(confirmKind === "delete" ? "bc.confirmDelete.title" : "bc.confirmPrimary.title")}
        description={t(
          confirmKind === "delete" ? "bc.confirmDelete.desc" : "bc.confirmPrimary.desc",
        )}
        confirmLabel={t(confirmKind === "delete" ? "bc.delete" : "bc.setPrimary")}
        destructive={confirmKind === "delete"}
        onConfirm={onConfirm}
      />
    </Card>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
function CardEditor({
  draft,
  onClose,
  onSaved,
}: {
  draft: Draft;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const save = useServerFn(saveBusinessCardFn);
  const [d, setD] = useState<Draft>(draft);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    set("skills", [...d.skills, v]);
    setSkillInput("");
  };

  const submit = async () => {
    if (d.slug.trim().length < 2) {
      toast.error(t("bc.required"));
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: d.id,
          slug: d.slug.trim(),
          cardKind: d.cardKind,
          publicMode: d.publicMode,
          visibilitySettings: {
            showContact: d.visibility.showContact,
            showSocial: d.visibility.showSocial,
            showServices: d.visibility.showServices,
            showNeeds: d.visibility.showNeeds,
          },
          displayName: d.displayName || null,
          professionalTitle: d.professionalTitle || null,
          companyName: d.companyName || null,
          avatarUrl: d.avatarUrl || null,
          headline: d.headline || null,
          bio: d.bio || null,
          website: d.website || null,
          workEmail: d.workEmail || null,
          workPhone: d.workPhone || null,
          address: d.address || null,
          zaloUrl: d.zaloUrl || null,
          linkedinUrl: d.linkedinUrl || null,
          facebookUrl: d.facebookUrl || null,
          youtubeUrl: d.youtubeUrl || null,
          tiktokUrl: d.tiktokUrl || null,
          skills: d.skills.map((label) => ({ label })),
          services: d.services
            .filter((s) => s.title.trim())
            .map((s) => ({ title: s.title, description: s.description || null, category: null })),
          needs: d.needs
            .filter((s) => s.title.trim())
            .map((s) => ({ title: s.title, description: s.description || null, category: null })),
        },
      });
      toast.success(t("bc.saved"));
      onSaved();
    } catch (e) {
      toast.error(t(cardPermissionErrorKey(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {d.id ? t("bc.edit") : t("bc.new")}
        </h2>
        <button
          onClick={onClose}
          aria-label={t("bc.cancel")}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <Section title={t("bc.sec.identity")}>
        <Field label={t("bc.f.slug")}>
          <Input value={d.slug} onChange={(v) => set("slug", v)} placeholder={t("bc.f.slug.ph")} />
        </Field>
        <Field label={t("bc.f.kind")}>
          <Segmented
            value={d.cardKind}
            options={[
              { value: "primary", label: t("bc.f.kind.primary") },
              { value: "secondary", label: t("bc.f.kind.secondary") },
            ]}
            onChange={(v) => set("cardKind", v as CardKind)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("bc.f.kind.hint")}</p>
        </Field>
        <Field label={t("bc.f.displayName")}>
          <Input value={d.displayName} onChange={(v) => set("displayName", v)} />
        </Field>
        <Field label={t("bc.f.title")}>
          <Input value={d.professionalTitle} onChange={(v) => set("professionalTitle", v)} />
        </Field>
        <Field label={t("bc.f.company")}>
          <Input value={d.companyName} onChange={(v) => set("companyName", v)} />
        </Field>
        <Field label={t("bc.f.avatar")}>
          <AvatarUploadField
            value={d.avatarUrl}
            onChange={(url) => set("avatarUrl", url)}
          />
          <Input
            value={d.avatarUrl}
            onChange={(v) => set("avatarUrl", v)}
            placeholder="https://..."
          />
        </Field>
        <Field label={t("bc.f.headline")}>
          <Input value={d.headline} onChange={(v) => set("headline", v)} />
        </Field>
        <Field label={t("bc.f.bio")}>
          <Textarea value={d.bio} onChange={(v) => set("bio", v)} />
        </Field>
      </Section>

      <Section title={t("bc.sec.contact")}>
        <Field label={t("bc.f.website")}>
          <Input value={d.website} onChange={(v) => set("website", v)} />
        </Field>
        <Field label={t("bc.f.email")}>
          <Input value={d.workEmail} onChange={(v) => set("workEmail", v)} type="email" />
        </Field>
        <Field label={t("bc.f.phone")}>
          <Input value={d.workPhone} onChange={(v) => set("workPhone", v)} />
        </Field>
        <Field label={t("bc.f.address")}>
          <Input value={d.address} onChange={(v) => set("address", v)} />
        </Field>
      </Section>

      <Section title={t("bc.sec.social")}>
        <Field label={t("bc.f.zalo")}>
          <Input value={d.zaloUrl} onChange={(v) => set("zaloUrl", v)} />
        </Field>
        <Field label={t("bc.f.linkedin")}>
          <Input value={d.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} />
        </Field>
        <Field label={t("bc.f.facebook")}>
          <Input value={d.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
        </Field>
        <Field label={t("bc.f.youtube")}>
          <Input value={d.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
        </Field>
        <Field label={t("bc.f.tiktok")}>
          <Input value={d.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
        </Field>
      </Section>

      <Section title={t("bc.sec.skills")}>
        <div className="flex flex-wrap gap-2">
          {d.skills.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {s}
              <button
                onClick={() =>
                  set(
                    "skills",
                    d.skills.filter((_, j) => j !== i),
                  )
                }
                aria-label={t("bc.delete")}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill();
              }
            }}
            placeholder={t("bc.skillPlaceholder")}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            onClick={addSkill}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            {t("bc.add")}
          </button>
        </div>
      </Section>

      <ItemListSection
        title={t("bc.sec.services")}
        items={d.services}
        onChange={(items) => set("services", items)}
      />
      <ItemListSection
        title={t("bc.sec.needs")}
        items={d.needs}
        onChange={(items) => set("needs", items)}
      />

      <Section title={t("bc.sec.visibility")}>
        <Field label={t("bc.f.public")}>
          <Segmented
            value={d.publicMode}
            options={[
              { value: "public", label: t("bc.pm.public") },
              { value: "members_only", label: t("bc.pm.members_only") },
              { value: "private", label: t("bc.pm.private") },
            ]}
            onChange={(v) => set("publicMode", v as PublicMode)}
          />
        </Field>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          {t(`bc.pm.${d.publicMode}.desc` as TKey)}
        </p>
        {d.publicMode !== "private" && (
          <div className="mt-1 space-y-1.5">
            <p className="text-sm font-medium text-foreground">{t("bc.vis.rules")}</p>
            <VisToggle
              label={t("bc.vis.showContact")}
              checked={d.visibility.showContact}
              onChange={(b) => set("visibility", { ...d.visibility, showContact: b })}
            />
            <VisToggle
              label={t("bc.vis.showSocial")}
              checked={d.visibility.showSocial}
              onChange={(b) => set("visibility", { ...d.visibility, showSocial: b })}
            />
            <VisToggle
              label={t("bc.vis.showServices")}
              checked={d.visibility.showServices}
              onChange={(b) => set("visibility", { ...d.visibility, showServices: b })}
            />
            <VisToggle
              label={t("bc.vis.showNeeds")}
              checked={d.visibility.showNeeds}
              onChange={(b) => set("visibility", { ...d.visibility, showNeeds: b })}
            />
          </div>
        )}
      </Section>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t("bc.cancel")}
        </button>
        <button
          disabled={saving}
          onClick={() => void submit()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("bc.saving") : t("bc.save")}
        </button>
      </div>
    </div>
  );
}

function ItemListSection({
  title,
  items,
  onChange,
}: {
  title: string;
  items: { title: string; description: string }[];
  onChange: (items: { title: string; description: string }[]) => void;
}) {
  const t = useT();
  const update = (i: number, patch: Partial<{ title: string; description: string }>) =>
    onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <Section title={title}>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={it.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder={t("bc.itemTitle")}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={t("bc.delete")}
                className="grid h-9 w-9 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder={t("bc.itemDesc")}
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...items, { title: "", description: "" }])}
        className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
        {t("bc.add")}
      </button>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{title}</h3>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function VisToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

const LEAD_CSV_HEADERS = [
  "id",
  "name",
  "email",
  "phone",
  "card",
  "type",
  "status",
  "message",
  "preferredTime",
  "createdAt",
  "updatedAt",
  "repliesCount",
];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function leadToCsvRow(l: BusinessCardLead): string {
  return [
    l.id,
    l.requesterName,
    l.requesterEmail,
    l.requesterPhone,
    l.cardName,
    l.leadType,
    l.status,
    l.message,
    l.preferredTime,
    l.createdAt,
    l.updatedAt,
    l.replies.length,
  ]
    .map(csvCell)
    .join(",");
}

function downloadLeadsCsv(leads: BusinessCardLead[], filename: string) {
  const lines = [LEAD_CSV_HEADERS.join(","), ...leads.map(leadToCsvRow)];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LeadsTab() {
  const t = useT();
  const { data, loading } = useServerData<BusinessCardLead[]>(
    () => listMyBusinessCardLeadsFn(),
    [],
  );

  if (loading) return <Spinner />;
  if (data.length === 0)
    return <EmptyState icon={<Inbox className="h-9 w-9" />} message={t("bc.leads.empty")} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() =>
            downloadLeadsCsv(data, `leads-${new Date().toISOString().slice(0, 10)}.csv`)
          }
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" />
          {t("bc.leads.exportCsv")}
        </button>
      </div>
      {data.map((lead) => (
        <Card key={lead.id} className="flex flex-col gap-1 p-4">
          <span className="text-sm font-semibold text-foreground">{lead.requesterName}</span>
          {lead.requesterEmail && (
            <span className="text-xs text-muted-foreground">{lead.requesterEmail}</span>
          )}
          {lead.message && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{lead.message}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

function StatsTab() {
  const t = useT();
  const { data, loading } = useServerData<BusinessCardStats | null>(
    () => getBusinessCardStatsFn({ data: { days: 30 } }),
    null,
  );

  if (loading) return <Spinner />;
  if (!data)
    return <EmptyState icon={<BarChart3 className="h-9 w-9" />} message={t("bc.stats.empty")} />;

  const kpis: { key: TKey; value: number | string }[] = [
    { key: "bc.stats.kpi.leads", value: data.totalLeads },
    { key: "bc.stats.kpi.interactions", value: data.totalInteractions },
    { key: "bc.stats.kpi.uniqueViews", value: data.uniqueViews },
    { key: "bc.stats.kpi.responseRate", value: `${Math.round(data.responseRate * 100)}%` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.key} className="flex flex-col gap-1 p-5">
          <span className="text-xs text-muted-foreground">{t(k.key)}</span>
          <span className="text-2xl font-semibold text-foreground">{k.value}</span>
        </Card>
      ))}
    </div>
  );
}
