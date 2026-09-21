// BC-Mobile-7A — Community member directory + search
// ("NHỮNG AI ĐANG Ở TRONG CỘNG ĐỒNG NÀY?").
// Bounded pagination, quiet search, privacy-safe rows (DTO whitelist only).

import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { useT } from "@/lib/i18n";
import { useCommunityMembers, useUpdateCommunityMemberRole } from "@/hooks/use-community";
import { reportCommunityMetric } from "@/lib/business-connect/mobile/community.telemetry";
import type {
  CommunityMemberRoleFilter,
  CommunityMemberSummaryDTO,
} from "@/lib/business-connect/mobile/community.types";
import { BusinessConnectTopBar } from "../BusinessConnectTopBar";
import { CommunityError, CommunityListSkeleton } from "./CommunityHome";

export function CommunityMembers({ communityId }: { communityId: string }) {
  const t = useT();
  const [term, setTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<CommunityMemberRoleFilter>("all");
  const directory = useCommunityMembers(communityId, term, roleFilter);
  const [pending, setPending] = useState<CommunityMemberSummaryDTO | null>(null);
  const roleMutation = useUpdateCommunityMemberRole(communityId);
  const opened = useRef(false);

  const nextRole = pending?.role === "admin" ? "member" : "admin";
  const confirmRoleChange = () => {
    if (!pending) return;
    roleMutation.mutate(
      { memberRef: pending.memberRef, role: nextRole },
      {
        onSuccess: () => {
          toast.success(t("bc.mobile.community.members.role.success"));
          setPending(null);
        },
        onError: (err) => {
          const lastAdmin = String((err as Error)?.message ?? "").includes(
            "community_role_last_admin",
          );
          toast.error(
            t(
              lastAdmin
                ? "bc.mobile.community.members.role.lastAdmin"
                : "bc.mobile.community.members.role.error",
            ),
          );
        },
      },
    );
  };

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    reportCommunityMetric("COMMUNITY_MEMBER_LIST_OPENED");
  }, []);

  useEffect(() => {
    if (term.trim().length > 0) reportCommunityMetric("COMMUNITY_SEARCH_USED");
  }, [term]);

  return (
    <>
      <BusinessConnectTopBar back title={t("bc.mobile.community.members")} />
      <main id="bc-mobile-community-members" className="contents">
        <h1 className="mt-4 text-[28px] font-semibold leading-snug tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.members")}
        </h1>

        <div role="search" className="mt-3.5">
          <label htmlFor="bc-community-member-search" className="sr-only">
            {t("bc.mobile.community.search.label")}
          </label>
          <div className="flex h-12 items-center gap-2.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-4 transition-colors duration-150 focus-within:ring-2 focus-within:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[var(--bc-mobile-muted)]"
              strokeWidth={1.8}
            />
            <input
              id="bc-community-member-search"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("bc.mobile.community.search.placeholder")}
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--bc-mobile-text)] outline-none placeholder:text-[var(--bc-mobile-muted)] [&::-webkit-search-cancel-button]:hidden"
            />
            {term ? (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label={t("bc.mobile.community.search.clear")}
                className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-border)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>
        </div>

        {directory.searching && !directory.initialLoading ? (
          <p
            aria-live="polite"
            className="mt-1.5 text-[13px] text-[var(--bc-mobile-muted)]"
          >
            {t("bc.mobile.community.search.results", { count: directory.totalCount })}
          </p>
        ) : null}

        <div
          role="group"
          aria-label={t("bc.mobile.community.members.roleFilter.label")}
          className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {(["all", "admin", "member"] as const).map((value) => {
            const active = roleFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setRoleFilter(value)}
                className={`inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none ${
                  active
                    ? "border-[var(--bc-mobile-accent)] bg-[var(--bc-mobile-accent)]/15 text-[var(--bc-mobile-accent)]"
                    : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)]"
                }`}
              >
                {t(`bc.mobile.community.members.roleFilter.${value}` as const)}
              </button>
            );
          })}
        </div>

        {directory.initialLoading ? (
          <div className="mt-3">
            <CommunityListSkeleton />
          </div>
        ) : directory.coreError ? (
          <CommunityError onRetry={directory.retry} />
        ) : directory.unavailable ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.unavailable")}
            </p>
          </section>
        ) : directory.members.length === 0 ? (
          <section className="mt-14">
            <p className="max-w-[34ch] text-[15px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {directory.searching
                ? t("bc.mobile.community.search.empty")
                : roleFilter === "admin"
                  ? t("bc.mobile.community.members.roleFilter.emptyAdmin")
                  : t("bc.mobile.community.members.empty")}
            </p>
            {directory.searching ? (
              <button
                type="button"
                onClick={() => setTerm("")}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-navy)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
              >
                {t("bc.mobile.community.search.clear")}
              </button>
            ) : null}
          </section>
        ) : (
          <>
            <ul
              aria-label={t("bc.mobile.community.members.list.label")}
              aria-busy={directory.isLoadingMore}
              className="mt-2 divide-y divide-[var(--bc-mobile-border)]"
            >
              {directory.members.map((m) => (
                <MemberRow
                  key={m.memberRef}
                  communityId={communityId}
                  member={m}
                  canManageRoles={directory.viewerRole === "admin"}
                  onChangeRole={setPending}
                />
              ))}
            </ul>
            {directory.hasMore ? (
              <div className="mt-2 flex min-h-[52px] items-center justify-center">
                <button
                  type="button"
                  onClick={directory.loadMore}
                  disabled={directory.isLoadingMore}
                  className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-[14px] font-medium text-[var(--bc-mobile-muted)] transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)] hover:text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none"
                >
                  {directory.isLoadingMore
                    ? t("bc.mobile.community.loadingMore")
                    : t("bc.mobile.community.loadMore")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !roleMutation.isPending) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("bc.mobile.community.members.role.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                nextRole === "admin"
                  ? "bc.mobile.community.members.role.confirmPromote"
                  : "bc.mobile.community.members.role.confirmDemote",
                { name: pending?.displayName ?? "" },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={roleMutation.isPending}>
              {t("bc.mobile.community.members.role.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={roleMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmRoleChange();
              }}
            >
              {roleMutation.isPending
                ? t("bc.mobile.community.members.role.saving")
                : t("bc.mobile.community.members.role.confirmCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MemberRow({
  communityId,
  member,
  canManageRoles,
  onChangeRole,
}: {
  communityId: string;
  member: CommunityMemberSummaryDTO;
  canManageRoles: boolean;
  onChangeRole: (m: CommunityMemberSummaryDTO) => void;
}) {
  const t = useT();
  const subtitle = [member.jobTitle, member.companyName].filter(Boolean).join(" · ");
  return (
    <li className="flex items-center justify-between gap-2 border-b border-[var(--bc-mobile-border)]/60 py-1.5 last:border-b-0">
      <Link
        to="/connect-app/community/$communityId/members/$memberRef"
        params={{ communityId, memberRef: member.memberRef }}
        aria-label={`${t("bc.mobile.community.openMember")}: ${member.displayName}`}
        className="flex min-h-[58px] flex-1 items-center gap-3 py-1.5 min-w-0 transition-colors duration-150 hover:bg-[var(--bc-mobile-surface-2)]/50 rounded-xl px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none"
      >
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full border border-[var(--bc-mobile-border)] object-cover shadow-xs"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)]/70"
          >
            <UserRound className="h-5 w-5 text-[var(--bc-mobile-muted)]" strokeWidth={1.6} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[14.5px] font-semibold text-[var(--bc-mobile-text)]">
              {member.displayName}
            </span>
            {member.role === "admin" ? (
              <span className="shrink-0 rounded-full border border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--bc-mobile-accent)]">
                {t("bc.mobile.community.members.role.admin")}
              </span>
            ) : null}
            {member.isSelf ? (
              <span className="shrink-0 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.thisIsYou")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--bc-mobile-muted)] leading-tight">
            {subtitle || member.industryLabel || ""}
          </p>
        </div>
      </Link>

      {/* Cột thao tác bên phải: Khiên đổi quyền (nếu có) + Mũi tên > luôn cố định mép phải */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        {canManageRoles && !member.isSelf ? (
          <button
            type="button"
            onClick={() => onChangeRole(member)}
            aria-label={`${t("bc.mobile.community.members.role.change")}: ${member.displayName}`}
            title={t(
              member.role === "admin"
                ? "bc.mobile.community.members.role.demote"
                : "bc.mobile.community.members.role.promote",
            )}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] cursor-pointer motion-reduce:transition-none ${
              member.role === "admin"
                ? "border-[var(--bc-mobile-accent)]/40 bg-[var(--bc-mobile-accent)]/10 text-[var(--bc-mobile-accent)] shadow-xs"
                : "border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
            }`}
          >
            <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : null}

        <Link
          to="/connect-app/community/$communityId/members/$memberRef"
          params={{ communityId, memberRef: member.memberRef }}
          aria-hidden="true"
          tabIndex={-1}
          className="p-1 text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] transition-colors"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </Link>
      </div>
    </li>
  );
}
