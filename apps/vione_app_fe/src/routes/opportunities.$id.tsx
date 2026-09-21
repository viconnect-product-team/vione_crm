import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { REVIEW_SEARCH_RESET } from "@/lib/review-search";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, Pill } from "@/components/dashboard/PageKit";
import { useFmt, useT } from "@/lib/i18n";
import { getPoster, type Opportunity, type OpportunityInterest } from "@/lib/opportunities-data";
import {
  getOpportunityFn,
  deleteOpportunityFn,
  expressInterestFn,
  toggleOpportunityStatusFn,
} from "@/lib/opportunities.functions";
import { CURRENT_USER_ID } from "@/lib/networking-data";
import { resolveMediaUrl } from "@/lib/api-client";
import { toast } from "sonner";

export const Route = createFileRoute("/opportunities/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const res = await getOpportunityFn({ data: { id: params.id } });
    if (!res) throw notFound();
    return res;
  },
  notFoundComponent: NotFound,
  component: OpportunityDetailPage,
});

function NotFound() {
  const t = useT();
  return (
    <AppShell>
      <Card className="p-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">{t("opp.detail.notFound")}</p>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("opp.detail.back")}
        </Link>
      </Card>
    </AppShell>
  );
}

function InterestModal({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const express = useServerFn(expressInterestFn);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !contact.trim()) return;
    await express({ data: { opportunityId: opp.id, message, contact } });
    await router.invalidate();
    toast.success(t("opp.toast.interest"));
    onClose();
    navigate({ to: "/network", search: { peer: opp.posterId } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Send className="h-5 w-5 text-primary" />
            {t("opp.interest.title")}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="rounded-lg bg-secondary/50 p-3 text-xs">
            <div className="text-muted-foreground">{t("opp.interest.about")}</div>
            <div className="font-semibold text-foreground">{opp.title}</div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              {t("opp.interest.contact")}
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
              placeholder="email@congty.vn / 0901..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">
              {t("opp.interest.message")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder={t("opp.interest.messagePh")}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("opp.form.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {t("opp.interest.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OpportunityDetailPage() {
  const t = useT();
  const fmt = useFmt();
  const navigate = useNavigate();
  const router = useRouter();
  const { opportunity: opp, interests } = Route.useLoaderData();
  const [showInterest, setShowInterest] = useState(false);

  const toggleStatus = useServerFn(toggleOpportunityStatusFn);
  const removeOpp = useServerFn(deleteOpportunityFn);

  const posterId = opp.posterId;
  const poster = getPoster(posterId);
  const isOwner = posterId === CURRENT_USER_ID;

  const budget =
    opp.budgetMin && opp.budgetMax
      ? `${fmt.money(opp.budgetMin)} – ${fmt.money(opp.budgetMax)}`
      : opp.budgetMin
        ? `${t("opp.fromLabel")} ${fmt.money(opp.budgetMin)}`
        : t("opp.budgetOpen");

  return (
    <AppShell>
      <div className="mb-4">
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("opp.detail.back")}
        </Link>
      </div>

      <PageHeader
        title={opp.title}
        subtitle={`${opp.industry} · ${opp.region}`}
        actions={
          <>
            <Link
              to="/opportunities/$id/edit"
              params={{ id: opp.id }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {t("opp.action.edit")}
            </Link>
            <button
              onClick={async () => {
                await toggleStatus({ data: { id: opp.id } });
                await router.invalidate();
              }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {opp.status === "open" ? t("opp.action.close") : t("opp.action.reopen")}
            </button>
            <button
              onClick={async () => {
                if (confirm(t("opp.confirmDelete"))) {
                  await removeOpp({ data: { id: opp.id } });
                  navigate({ to: "/opportunities" });
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> {t("opp.action.delete")}
            </button>
            {!isOwner && (
              <button
                onClick={() => setShowInterest(true)}
                disabled={opp.status === "closed"}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Send className="h-4 w-4" />
                {t("opp.action.interest")}
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            {opp.image || (opp as any).imageUrl ? (
              <div className="relative h-64 w-full overflow-hidden bg-muted/20">
                <img
                  src={resolveMediaUrl(opp.image || (opp as any).imageUrl) || opp.image}
                  alt={opp.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-xl p-2 text-3xl">
                  {opp.emoji}
                </div>
              </div>
            ) : (
              <div
                className="flex h-40 items-center justify-center text-7xl"
                style={{ background: "var(--gradient-primary)" }}
              >
                <span className="drop-shadow-lg">{opp.emoji}</span>
              </div>
            )}
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap gap-2">
                <Pill color="primary">{t(opp.type)}</Pill>
                <Pill color={opp.status === "open" ? "success" : "neutral"}>
                  {t(opp.status === "open" ? "opp.status.open" : "opp.status.closed")}
                </Pill>
              </div>
              <h2 className="text-lg font-semibold">{t("opp.detail.about")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {opp.description}
              </p>
            </div>
          </Card>

          {/* Người nhận cơ hội từ Mobile */}
          {opp.claimedByName && (
            <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-3 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold text-base text-emerald-300">
                  Thông tin người đã nhận cơ hội (Đồng bộ từ Mobile)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-emerald-500/20 bg-background/60 p-4">
                <div>
                  <div className="text-xs text-muted-foreground">Người nhận:</div>
                  <div className="text-sm font-semibold text-foreground">{opp.claimedByName}</div>
                </div>
                {opp.claimedCompany && (
                  <div>
                    <div className="text-xs text-muted-foreground">Doanh nghiệp:</div>
                    <div className="text-sm font-semibold text-foreground">{opp.claimedCompany}</div>
                  </div>
                )}
                {opp.claimedPhone && (
                  <div>
                    <div className="text-xs text-muted-foreground">Số điện thoại liên hệ:</div>
                    <div className="text-sm font-semibold text-emerald-400">{opp.claimedPhone}</div>
                  </div>
                )}
                {opp.claimedAt && (
                  <div>
                    <div className="text-xs text-muted-foreground">Thời gian tiếp nhận:</div>
                    <div className="text-sm font-medium text-foreground">{fmt.date(opp.claimedAt)}</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Interests */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-4 w-4 text-primary" />
                {t("opp.detail.interests")}
              </h3>
              <span className="text-xs text-muted-foreground">
                {interests.length} {t("opp.interest.count")}
              </span>
            </div>

            {interests.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("opp.empty.interests")}
              </p>
            ) : (
              <div className="space-y-3">
                {interests.map((it: OpportunityInterest) => {
                  const m = getPoster(it.memberId);
                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border border-border bg-secondary/30 p-4 text-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to="/members/$memberId"
                            params={{ memberId: it.memberId }}
                            search={REVIEW_SEARCH_RESET}
                            className="font-semibold text-primary hover:underline"
                          >
                            {m?.name ?? it.memberId}
                          </Link>
                          {m?.industry && (
                            <div className="text-[11px] text-muted-foreground">
                              {t(m.industry)} · {t(m.region)}
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {fmt.date(it.createdAt)}
                        </span>
                      </div>
                      <div className="mb-2 text-xs text-muted-foreground">{it.contact}</div>
                      <p className="text-sm text-foreground">{it.message}</p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          to="/network"
                          search={{ peer: it.memberId }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {t("net.action.message")}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("opp.detail.summary")}
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("opp.budget")}
                </dt>
                <dd className="font-semibold text-foreground">{budget}</dd>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("opp.deadline")}
                  </dt>
                  <dd className="font-medium">{fmt.date(opp.deadline)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("opp.form.region")}
                  </dt>
                  <dd className="font-medium">{opp.region}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t("opp.detail.views")}
                  </dt>
                  <dd className="font-medium">{opp.views}</dd>
                </div>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("opp.detail.posted")}
                </dt>
                <dd className="font-medium">{fmt.date(opp.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          {(opp.contactName || opp.contactPhone || opp.company) && (
            <Card className="p-5 border-primary/30 bg-primary/5">
              <h3 className="mb-4 text-sm font-semibold flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                Thông tin người liên hệ
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-foreground text-base">
                    {opp.contactName || "Người liên hệ"}
                  </div>
                  {opp.contactTitle && (
                    <div className="text-xs text-muted-foreground">{opp.contactTitle}</div>
                  )}
                </div>
                {opp.company && (
                  <div className="text-xs font-medium text-foreground">
                    🏢 {opp.company}
                  </div>
                )}
                {opp.contactPhone && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-xs">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a href={`tel:${opp.contactPhone}`} className="font-semibold text-primary hover:underline">
                      {opp.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">{t("opp.detail.poster")}</h3>
            {poster ? (
              <div className="space-y-3 text-sm">
                <Link
                  to="/members/$memberId"
                  params={{ memberId: poster.id }}
                  search={REVIEW_SEARCH_RESET}
                  className="block font-semibold text-primary hover:underline"
                >
                  {poster.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {t(poster.industry)} · {t(poster.region)}
                </div>
                <div className="space-y-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={`mailto:${poster.email}`} className="hover:underline">
                      {poster.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{poster.phone}</span>
                  </div>
                </div>
                {!isOwner && (
                  <Link
                    to="/network"
                    search={{ peer: poster.id }}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {t("net.action.message")}
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
          </Card>
        </div>
      </div>

      {showInterest && <InterestModal opp={opp} onClose={() => setShowInterest(false)} />}
    </AppShell>
  );
}
