// BC-Mobile-7B — "Mời thành viên": tạo lời mời dạng liên kết cho một cộng đồng.
// Trung thực: lời mời là liên kết chia sẻ (chia sẻ hệ thống hoặc sao chép),
// không tạo backend mời song song và không báo thành công khi thao tác thất bại.

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Copy, Mail, Share2, UserPlus, X } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/clipboard";
import {
  useCommunityInvites,
  useCommunityInviteTemplates,
  useInviteRoleHistory,
} from "@/hooks/use-community-invites";
import {
  DEFAULT_INVITE_TEMPLATES,
  INVITE_TEMPLATE_PLACEHOLDERS,
  renderInviteTemplate,
  type InviteLocale,
} from "@/lib/business-connect/mobile/community-invite-template";

type InviteState = "idle" | "sending" | "success" | "error";

function buildInviteLink(communityId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/connect-app/community/${communityId}`;
}

export function CommunityInviteButton({
  communityId,
  communityName,
}: {
  communityId: string;
  communityName: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--bc-mobile-accent-grad)] px-5 text-[13.5px] font-bold text-black shadow-md transition-all duration-150 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] cursor-pointer motion-reduce:transition-none"
      >
        <UserPlus aria-hidden="true" className="h-4 w-4 text-black" strokeWidth={2} />
        {t("bc.mobile.community.invite.cta")}
      </button>
      {open ? (
        <CommunityInviteSheet
          communityId={communityId}
          communityName={communityName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CommunityInviteSheet({
  communityId,
  communityName,
  onClose,
}: {
  communityId: string;
  communityName: string;
  onClose: () => void;
}) {
  const t = useT();
  const [state, setState] = useState<InviteState>("idle");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"link" | "email" | "template">("link");
  const closeRef = useRef<HTMLButtonElement>(null);
  const link = buildInviteLink(communityId);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state !== "sending") {
        if (tab !== "link") setTab("link");
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, state, tab]);

  const message = `${t("bc.mobile.community.invite.message", { community: communityName })}${
    note.trim() ? `\n\n${note.trim()}` : ""
  }\n${link}`;

  const send = async (mode: "share" | "copy") => {
    setState("sending");
    try {
      if (mode === "share" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: communityName, text: message });
      } else {
        const ok = await copyToClipboard(message, true, "Đã sao chép liên kết lời mời!");
        if (!ok) throw new Error("clipboard_unavailable");
      }
      setState("success");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bc-invite-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0"
      onClick={(e) => {
        if (e.target === e.currentTarget && state !== "sending") onClose();
      }}
    >
      <div className="w-full max-w-[520px] max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] text-[var(--bc-mobile-text)] shadow-2xl p-5 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {tab !== "link" ? (
              <button
                type="button"
                onClick={() => setTab("link")}
                aria-label="Quay lại"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] cursor-pointer"
              >
                <ArrowLeft aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              </button>
            ) : null}
            <div className="min-w-0">
              <h2
                id="bc-invite-title"
                className="text-[18px] font-semibold text-[var(--bc-mobile-text)]"
              >
                {tab === "template"
                  ? "Mẫu email lời mời"
                  : tab === "email"
                    ? "Gửi lời mời qua Email"
                    : t("bc.mobile.community.invite.title")}
              </h2>
              <p className="mt-1 text-[13px] leading-snug text-[var(--bc-mobile-muted)]">
                {t("bc.mobile.community.invite.desc", { community: communityName })}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("bc.mobile.community.invite.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--bc-mobile-border)] text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] cursor-pointer"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <label
          htmlFor="bc-invite-note"
          className="mt-4 block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
        >
          {t("bc.mobile.community.invite.noteLabel")}
        </label>
        <textarea
          id="bc-invite-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 240))}
          rows={3}
          placeholder={t("bc.mobile.community.invite.notePlaceholder")}
          className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282]"
        />

        <div
          role="tablist"
          aria-label={t("bc.mobile.community.invite.title")}
          className="mt-4 flex gap-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-1"
        >
          {(["link", "email", "template"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-[38px] flex-1 rounded-full text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] motion-reduce:transition-none cursor-pointer ${
                tab === key
                  ? "bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] text-[#050c15] font-bold shadow-md shadow-[#D8B282]/25"
                  : "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]"
              }`}
            >
              {t(`bc.mobile.community.invite.tab.${key}` as never)}
            </button>
          ))}
        </div>

        {tab === "template" ? (
          <CommunityInviteTemplatePanel
            communityId={communityId}
            communityName={communityName}
            note={note}
            link={link}
          />
        ) : tab === "email" ? (
          <CommunityInviteEmailPanel communityId={communityId} note={note} link={link} />
        ) : (
          <>
            <p className="mt-3 break-all rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {link}
            </p>

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                disabled={state === "sending"}
                onClick={() => void send("share")}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-4 text-[14px] font-bold text-[#050c15] shadow-md shadow-[#D8B282]/25 transition-all duration-150 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-60 motion-reduce:transition-none cursor-pointer"
              >
                <Share2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                {state === "sending"
                  ? t("bc.mobile.community.invite.sending")
                  : t("bc.mobile.community.invite.send")}
              </button>
              <button
                type="button"
                disabled={state === "sending"}
                onClick={() => void send("copy")}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-[var(--bc-mobile-border)] px-4 text-[14px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-60 cursor-pointer"
              >
                <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                {t("bc.mobile.community.invite.copy")}
              </button>
            </div>

            <p
              aria-live="polite"
              className={`mt-3 min-h-[18px] text-[12.5px] ${
                state === "error"
                  ? "text-[var(--bc-mobile-accent)]"
                  : "text-[var(--bc-mobile-muted)]"
              }`}
            >
              {state === "success"
                ? t("bc.mobile.community.invite.success")
                : state === "error"
                  ? t("bc.mobile.community.invite.failed")
                  : ""}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CommunityInviteEmailPanel({
  communityId,
  note,
  link,
}: {
  communityId: string;
  note: string;
  link: string;
}) {
  const t = useT();
  const { lang } = useLang();
  const locale: InviteLocale = lang === "en" ? "en" : "vi";
  const { invites, loading, create, cancel, resend, updateAcceptedRole } =
    useCommunityInvites(communityId);
  const { canEdit: canAssignAdmin } = useCommunityInviteTemplates(communityId);
  const [email, setEmail] = useState("");
  const [invitedRole, setInvitedRole] = useState<"admin" | "member">("member");
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const submit = () => {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || value.length > 255) {
      setFeedback({ tone: "error", text: t("bc.mobile.community.invite.email.invalid") });
      return;
    }
    setFeedback(null);
    create.mutate(
      {
        email: value,
        note: note.trim() || undefined,
        inviteUrl: link,
        locale,
        invitedRole: canAssignAdmin ? invitedRole : "member",
      },
      {
        onSuccess: (res) => {
          if (res && "ok" in res && res.ok === false) {
            setFeedback({
              tone: "error",
              text:
                (res as { reason?: string }).reason === "forbidden_role"
                  ? t("bc.mobile.community.invite.email.roleAdminOnly")
                  : t("bc.mobile.community.invite.email.duplicate"),
            });
            return;
          }
          setEmail("");
          setFeedback({
            tone: "ok",
            text: t("bc.mobile.community.invite.email.success", { email: value }),
          });
        },
        onError: () =>
          setFeedback({ tone: "error", text: t("bc.mobile.community.invite.email.error") }),
      },
    );
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="bc-invite-email"
        className="block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
      >
        {t("bc.mobile.community.invite.email.label")}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="bc-invite-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          maxLength={255}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={t("bc.mobile.community.invite.email.placeholder")}
          className="min-h-[46px] flex-1 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={create.isPending}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-5 text-[14px] font-bold text-[#050c15] shadow-md shadow-[#D8B282]/25 transition-all duration-150 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-60 cursor-pointer motion-reduce:transition-none"
        >
          <Mail aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          {create.isPending
            ? t("bc.mobile.community.invite.email.sending")
            : t("bc.mobile.community.invite.email.send")}
        </button>
      </div>

      <fieldset className="mt-3">
        <legend className="text-[12.5px] font-medium text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.invite.email.roleLabel")}
        </legend>
        <div className="mt-1.5 flex gap-2">
          {(canAssignAdmin ? (["member", "admin"] as const) : (["member"] as const)).map(
            (r: any) => (
              <button
                key={r}
                type="button"
                aria-pressed={invitedRole === r}
                onClick={() => setInvitedRole(r)}
                className={`min-h-[38px] flex-1 rounded-full border px-3 text-[12.5px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] cursor-pointer motion-reduce:transition-none ${
                  invitedRole === r
                    ? "border-transparent bg-gradient-to-r from-[#F97316] via-[#EA580C] to-[#C2410C] text-white font-semibold shadow-sm"
                    : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)]"
                }`}
              >
                {t(`bc.mobile.community.role.${r}` as never)}
              </button>
            ),
          )}
        </div>
        <p className="mt-1 text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
          {canAssignAdmin
            ? t("bc.mobile.community.invite.email.roleHint")
            : t("bc.mobile.community.invite.email.roleAdminOnly")}
        </p>
      </fieldset>

      <p
        aria-live="polite"
        className={`mt-2 min-h-[18px] text-[12.5px] ${
          feedback?.tone === "error"
            ? "text-[var(--bc-mobile-accent)]"
            : "text-[var(--bc-mobile-muted)]"
        }`}
      >
        {feedback?.text ?? ""}
      </p>

      <p className="mt-1 text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.invite.email.note")}
      </p>

      <h3 className="mt-4 text-[13px] font-semibold text-[var(--bc-mobile-text)]">
        {t("bc.mobile.community.invite.list.title")}
      </h3>
      {loading ? (
        <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.invite.list.loading")}
        </p>
      ) : invites.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.invite.list.empty")}
        </p>
      ) : (
        <ul className="mt-2 max-h-[210px] space-y-1.5 overflow-y-auto">
          {invites.map((invite) => (
            <li
              key={invite.inviteRef}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-[var(--bc-mobile-text)]">
                  {invite.email}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--bc-mobile-muted)]">
                  {t(`bc.mobile.community.role.${invite.invitedRole}` as never)} ·{" "}
                  {t(`bc.mobile.community.invite.status.${invite.status}` as never)} ·{" "}
                  {t("bc.mobile.community.invite.list.sentAt")}{" "}
                  {new Date(invite.createdAt).toLocaleString()}
                </p>
              </div>
              {invite.status === "pending" ? (
                <button
                  type="button"
                  disabled={resend.isPending}
                  onClick={() =>
                    resend.mutate(
                      { inviteRef: invite.inviteRef, locale },
                      {
                        onSuccess: (res) =>
                          setFeedback(
                            res.ok
                              ? {
                                  tone: "ok",
                                  text: t("bc.mobile.community.invite.list.resent", {
                                    time: new Date().toLocaleTimeString(),
                                  }),
                                }
                              : {
                                  tone: "error",
                                  text: t("bc.mobile.community.invite.list.resendFailed"),
                                },
                          ),
                        onError: () =>
                          setFeedback({
                            tone: "error",
                            text: t("bc.mobile.community.invite.list.resendFailed"),
                          }),
                      },
                    )
                  }
                  className="min-h-[38px] shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-3 text-[12.5px] font-medium text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
                >
                  {resend.isPending
                    ? t("bc.mobile.community.invite.list.resending")
                    : t("bc.mobile.community.invite.list.resend")}
                </button>
              ) : null}
              {invite.status === "pending" && invite.token ? (
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}/connect-app/invite/${invite.token}`;
                    await copyToClipboard(url, true, "Đã sao chép liên kết lời mời!");
                    setCopied(invite.inviteRef);
                  }}
                  className="min-h-[38px] shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-3 text-[12.5px] font-medium text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
                >
                  {copied === invite.inviteRef
                    ? t("bc.mobile.community.invite.list.copied")
                    : t("bc.mobile.community.invite.list.copyLink")}
                </button>
              ) : null}
              {invite.status === "accepted" && invite.canManageRole ? (
                <div className="flex w-full items-center gap-2">
                  <span className="text-[12px] text-[var(--bc-mobile-muted)]">
                    {t("bc.mobile.community.invite.list.roleTitle")}
                  </span>
                  <div className="flex flex-1 gap-1.5">
                    {(["member", "admin"] as const).map((r: any) => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={invite.acceptedRole === r}
                        disabled={updateAcceptedRole.isPending}
                        onClick={() =>
                          updateAcceptedRole.mutate(
                            { inviteRef: invite.inviteRef, role: r },
                            {
                              onSuccess: (res) =>
                                setFeedback(
                                  res.ok
                                    ? {
                                        tone: "ok",
                                        text: t("bc.mobile.community.invite.list.roleUpdated"),
                                      }
                                    : {
                                        tone: "error",
                                        text: t(
                                          res.reason === "last_admin"
                                            ? "bc.mobile.community.invite.list.roleLastAdmin"
                                            : "bc.mobile.community.invite.list.roleFailed",
                                        ),
                                      },
                                ),
                              onError: () =>
                                setFeedback({
                                  tone: "error",
                                  text: t("bc.mobile.community.invite.list.roleFailed"),
                                }),
                            },
                          )
                        }
                        className={`min-h-[34px] flex-1 rounded-full border px-3 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60 motion-reduce:transition-none ${
                          invite.acceptedRole === r
                            ? "border-transparent bg-[var(--bc-mobile-accent)] text-[var(--bc-mobile-navy)]"
                            : "border-[var(--bc-mobile-border)] text-[var(--bc-mobile-text)]"
                        }`}
                      >
                        {t(`bc.mobile.community.role.${r}` as never)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {invite.status === "accepted" ? (
                <InviteRoleHistory inviteRef={invite.inviteRef} />
              ) : null}
              {invite.status === "pending" ? (
                <button
                  type="button"
                  onClick={() => cancel.mutate(invite.inviteRef)}
                  disabled={cancel.isPending}
                  className="min-h-[38px] shrink-0 rounded-full border border-[var(--bc-mobile-border)] px-3 text-[12.5px] font-medium text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-60"
                >
                  {t("bc.mobile.community.invite.list.cancel")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommunityInviteTemplatePanel({
  communityId,
  communityName,
  note,
  link,
}: {
  communityId: string;
  communityName: string;
  note: string;
  link: string;
}) {
  const t = useT();
  const { lang } = useLang();
  const activeLocale: InviteLocale = lang === "en" ? "en" : "vi";
  const { templates, canEdit, loading, save, reset } = useCommunityInviteTemplates(communityId);
  const [locale, setLocale] = useState<InviteLocale>(activeLocale);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const current = templates.find((tpl) => tpl.locale === locale);
  const subject = draft?.subject ?? current?.subject ?? DEFAULT_INVITE_TEMPLATES[locale].subject;
  const body = draft?.body ?? current?.body ?? DEFAULT_INVITE_TEMPLATES[locale].body;

  const preview = renderInviteTemplate(
    { subject, body },
    {
      community: communityName,
      inviter: "—",
      email: "name@company.com",
      note: note.trim(),
      link,
    },
  );

  const switchLocale = (next: InviteLocale) => {
    setLocale(next);
    setDraft(null);
    setFeedback(null);
  };

  return (
    <div className="mt-4">
      <h3 className="text-[13px] font-semibold text-[var(--bc-mobile-text)]">
        {t("bc.mobile.community.invite.template.title")}
      </h3>
      <p className="mt-1 text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.invite.template.desc")}
      </p>
      <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
        {t("bc.mobile.community.invite.template.applied", {
          lang: t(`bc.mobile.community.invite.template.lang.${activeLocale}` as never),
        })}
      </p>

      <div className="mt-3 flex gap-1.5 rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-1">
        {(["vi", "en"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => switchLocale(key)}
            aria-pressed={locale === key}
            className={`min-h-[38px] flex-1 rounded-full text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] motion-reduce:transition-none ${
              locale === key
                ? "bg-[var(--bc-mobile-accent)] text-[var(--bc-mobile-navy)]"
                : "text-[var(--bc-mobile-muted)]"
            }`}
          >
            {t(`bc.mobile.community.invite.template.lang.${key}` as never)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-3 text-[12.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.community.invite.template.loading")}
        </p>
      ) : (
        <>
          <label
            htmlFor="bc-invite-tpl-subject"
            className="mt-3 block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
          >
            {t("bc.mobile.community.invite.template.subject")}
          </label>
          <input
            id="bc-invite-tpl-subject"
            value={subject}
            maxLength={200}
            disabled={!canEdit}
            onChange={(e) => setDraft({ subject: e.target.value, body })}
            className="mt-1.5 min-h-[44px] w-full rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 text-[14px] text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-70"
          />

          <label
            htmlFor="bc-invite-tpl-body"
            className="mt-3 block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
          >
            {t("bc.mobile.community.invite.template.body")}
          </label>
          <textarea
            id="bc-invite-tpl-body"
            value={body}
            rows={8}
            maxLength={4000}
            disabled={!canEdit}
            onChange={(e) => setDraft({ subject, body: e.target.value })}
            className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 text-[13.5px] leading-relaxed text-[var(--bc-mobile-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)] disabled:opacity-70"
          />

          <p className="mt-1.5 text-[12px] leading-snug text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.invite.template.vars", {
              vars: INVITE_TEMPLATE_PLACEHOLDERS.join(" "),
            })}
          </p>
          <p className="mt-1 text-[12px] text-[var(--bc-mobile-muted)]">
            {current?.isDefault !== false
              ? t("bc.mobile.community.invite.template.isDefault")
              : t("bc.mobile.community.invite.template.updatedAt", {
                  time: current.updatedAt ? new Date(current.updatedAt).toLocaleString() : "—",
                })}
          </p>

          {canEdit ? (
            <div className="mt-3 flex gap-2.5">
              <button
                type="button"
                disabled={save.isPending}
                onClick={() =>
                  save.mutate(
                    { locale, subject: subject.trim(), body: body.trim() },
                    {
                      onSuccess: (res) => {
                        if (res && "ok" in res && res.ok === false) {
                          setFeedback({
                            tone: "error",
                            text: t("bc.mobile.community.invite.template.forbidden"),
                          });
                          return;
                        }
                        setDraft(null);
                        setFeedback({
                          tone: "ok",
                          text: t("bc.mobile.community.invite.template.saved"),
                        });
                      },
                      onError: () =>
                        setFeedback({
                          tone: "error",
                          text: t("bc.mobile.community.invite.template.error"),
                        }),
                    },
                  )
                }
                className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F6E1C3_0%,#D8B282_45%,#C29B69_70%,#8C653B_100%)] px-4 text-[14px] font-bold text-[#050c15] shadow-md shadow-[#D8B282]/25 transition-all duration-150 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-60 cursor-pointer motion-reduce:transition-none"
              >
                {save.isPending
                  ? t("bc.mobile.community.invite.template.saving")
                  : t("bc.mobile.community.invite.template.save")}
              </button>
              <button
                type="button"
                disabled={reset.isPending}
                onClick={() =>
                  reset.mutate(locale, {
                    onSuccess: () => {
                      setDraft(null);
                      setFeedback({
                        tone: "ok",
                        text: t("bc.mobile.community.invite.template.resetDone"),
                      });
                    },
                    onError: () =>
                      setFeedback({
                        tone: "error",
                        text: t("bc.mobile.community.invite.template.error"),
                      }),
                  })
                }
                className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-[var(--bc-mobile-border)] px-4 text-[13.5px] font-medium text-[var(--bc-mobile-text)] hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] disabled:opacity-60 cursor-pointer"
              >
                {t("bc.mobile.community.invite.template.reset")}
              </button>
            </div>
          ) : (
            <p className="mt-3 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.invite.template.readonly")}
            </p>
          )}

          <p
            aria-live="polite"
            className={`mt-2 min-h-[18px] text-[12.5px] ${
              feedback?.tone === "error"
                ? "text-[var(--bc-mobile-accent)]"
                : "text-[var(--bc-mobile-muted)]"
            }`}
          >
            {feedback?.text ?? ""}
          </p>

          <h4 className="mt-3 text-[12.5px] font-semibold text-[var(--bc-mobile-text)]">
            {t("bc.mobile.community.invite.template.preview")}
          </h4>
          <div className="mt-1.5 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3">
            <p className="text-[13px] font-semibold text-[var(--bc-mobile-text)]">
              {preview.subject}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-[var(--bc-mobile-muted)]">
              {preview.body}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Lịch sử đổi vai trò sau khi lời mời được chấp nhận (thời gian + người thực hiện). */
function InviteRoleHistory({ inviteRef }: { inviteRef: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { entries, loading } = useInviteRoleHistory(open ? inviteRef : null);

  return (
    <div className="w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="min-h-[34px] rounded-full border border-[var(--bc-mobile-border)] px-3 text-[12px] font-medium text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
      >
        {t("bc.mobile.community.invite.roleHistory.toggle")}
      </button>
      {open ? (
        loading ? (
          <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.invite.roleHistory.loading")}
          </p>
        ) : entries.length === 0 ? (
          <p className="mt-2 text-[12px] text-[var(--bc-mobile-muted)]">
            {t("bc.mobile.community.invite.roleHistory.empty")}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 border-l border-[var(--bc-mobile-border)] pl-3">
            {entries.map((entry: any) => (
              <li key={entry.eventRef} className="text-[12px] text-[var(--bc-mobile-muted)]">
                <span className="text-[var(--bc-mobile-text)]">
                  {t(`bc.mobile.community.role.${entry.oldRole}` as never)} →{" "}
                  {t(`bc.mobile.community.role.${entry.newRole}` as never)}
                </span>
                <br />
                {new Date(entry.changedAt).toLocaleString()}
                {entry.actorName
                  ? ` · ${t("bc.mobile.community.invite.roleHistory.by")} ${entry.actorName}`
                  : ""}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
