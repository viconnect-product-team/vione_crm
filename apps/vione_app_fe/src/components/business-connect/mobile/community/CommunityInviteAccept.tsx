// BC — Nhận lời mời tham gia cộng đồng bằng mã token.
// Trung thực: chỉ báo thành công khi máy chủ xác nhận đã tạo tư cách thành viên.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { CommunitySDK } from "@/lib/business-connect/mobile/community.sdk";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { useT } from "@/lib/i18n";

export function CommunityInviteAccept({ token }: { token: string }) {
  const t = useT();
  const viewerId = useViewerUserId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ communityId: string; alreadyMember: boolean } | null>(null);

  const invite = useQuery({
    queryKey: ["bc-mobile", "community-invite-token", viewerId ?? "pending", token],
    enabled: viewerId !== null,
    queryFn: () => CommunitySDK.getInviteByToken({ token }),
  });

  useEffect(() => {
    if (invite.data?.maskedEmail && !email) {
      setEmail(invite.data.maskedEmail);
    }
  }, [invite.data]);

  const accept = useMutation({
    mutationFn: (value: string) => CommunitySDK.acceptInvite({ token, email: value }),
    onSuccess: (res) => {
      if (res.ok) {
        setError(null);
        setDone({ communityId: res.communityId, alreadyMember: res.alreadyMember });
        void queryClient.invalidateQueries({ queryKey: ["bc-mobile"] });
        return;
      }
      setError(
        res.reason === "email_mismatch"
          ? t("bc.mobile.community.accept.mismatch")
          : res.reason === "not_pending"
            ? t("bc.mobile.community.accept.notPending")
            : t("bc.mobile.community.accept.notFound"),
      );
    },
    onError: () => setError(t("bc.mobile.community.accept.error")),
  });

  const submit = () => {
    const value = (email || invite.data?.maskedEmail || "").trim().toLowerCase();
    setError(null);
    accept.mutate(value || "member@vione.app");
  };

  const cardClass =
    "rounded-3xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-5";

  return (
    <MobilePage>
      <BusinessConnectTopBar back title={t("bc.mobile.community.accept.title")} />
      <header className="pt-3">
        <h1 className="text-[20px] font-bold text-[var(--bc-mobile-text)]">
          {t("bc.mobile.community.accept.title")}
        </h1>
      </header>

      <div className="mt-4">
        {invite.isPending || viewerId === null ? (
          <p className={`${cardClass} text-[13px] text-[var(--bc-mobile-muted)]`}>
            {t("bc.mobile.community.accept.loading")}
          </p>
        ) : !invite.data ? (
          <p className={`${cardClass} text-[13px] text-[var(--bc-mobile-muted)]`}>
            {t("bc.mobile.community.accept.notFound")}
          </p>
        ) : done ? (
          <div className={cardClass}>
            <CheckCircle2
              aria-hidden="true"
              className="h-6 w-6 text-[var(--bc-mobile-accent)]"
              strokeWidth={1.8}
            />
            <p className="mt-2 text-[15px] font-semibold text-[var(--bc-mobile-text)]">
              {done.alreadyMember
                ? t("bc.mobile.community.accept.alreadyMember")
                : t("bc.mobile.community.accept.success")}
            </p>
            <Link
              to="/connect-app/community/$communityId"
              params={{ communityId: done.communityId }}
              className="mt-4 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[var(--bc-mobile-accent)] px-5 text-[14px] font-semibold text-[var(--bc-mobile-navy)]"
            >
              {t("bc.mobile.community.accept.open")}
            </Link>
          </div>
        ) : (
          <div className={cardClass}>
            <p className="text-[17px] font-semibold text-[var(--bc-mobile-text)]">
              {invite.data.communityName}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--bc-mobile-muted)]">
              <Mail aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {t("bc.mobile.community.accept.invitedEmail")}: {invite.data.maskedEmail}
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--bc-mobile-muted)]">
              {t("bc.mobile.community.accept.role")}:{" "}
              <span className="font-semibold text-[var(--bc-mobile-text)]">
                {t(`bc.mobile.community.role.${invite.data.invitedRole}` as never)}
              </span>
            </p>
            {invite.data.note ? (
              <p className="mt-3 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] p-3 text-[13px] text-[var(--bc-mobile-text)]">
                {invite.data.note}
              </p>
            ) : null}

            {invite.data.status !== "pending" ? (
              <p className="mt-4 text-[13px] text-[var(--bc-mobile-muted)]">
                {invite.data.alreadyMember
                  ? t("bc.mobile.community.accept.alreadyMember")
                  : t("bc.mobile.community.accept.notPending")}
              </p>
            ) : (
              <>
                <p className="mt-4 text-[13px] text-[var(--bc-mobile-muted)]">
                  {t("bc.mobile.community.accept.desc")}
                </p>
                <label
                  htmlFor="bc-accept-email"
                  className="mt-4 block text-[12.5px] font-medium text-[var(--bc-mobile-muted)]"
                >
                  {t("bc.mobile.community.accept.emailLabel")}
                </label>
                <input
                  id="bc-accept-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("bc.mobile.community.accept.emailPlaceholder")}
                  className="mt-1.5 min-h-[46px] w-full rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)] px-3 text-[14px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-navy)]"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={accept.isPending}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[var(--bc-mobile-accent)] px-5 text-[14px] font-semibold text-[var(--bc-mobile-navy)] disabled:opacity-60"
                >
                  <ShieldCheck aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                  {accept.isPending
                    ? t("bc.mobile.community.accept.submitting")
                    : t("bc.mobile.community.accept.submit")}
                </button>
              </>
            )}

            <p
              aria-live="polite"
              className="mt-3 min-h-[18px] text-[12.5px] text-[var(--bc-mobile-accent)]"
            >
              {error ?? ""}
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/connect-app/community" })}
              className="mt-1 text-[12.5px] text-[var(--bc-mobile-muted)] underline"
            >
              {t("bc.mobile.community.accept.open")}
            </button>
          </div>
        )}
      </div>
    </MobilePage>
  );
}
