// BC-Mobile — Header của màn hình "Tôi" (chỉ trình bày).
// Avatar tròn viền vàng + tiêu đề "Tôi" kèm dấu xác thực + chuông thông báo.

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, BadgeCheck, User } from "lucide-react";
import { useT } from "@/lib/i18n";

export function MeHeader({
  avatarUrl,
  displayName,
  email,
  verified = false,
}: {
  avatarUrl: string | null;
  displayName: string | null;
  email: string | null;
  verified?: boolean;
}) {
  const t = useT();
  const [imageFailed, setImageFailed] = useState(false);
  const source = (displayName ?? "").trim() || (email ?? "");
  const initials =
    source
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || null;

  return (
    <header
      className="relative flex items-center gap-3.5"
      style={{
        paddingTop: "var(--bc-mobile-safe-top-compact)",
        minHeight: "calc(var(--bc-mobile-safe-top-compact) + var(--bc-mobile-header-h))",
      }}
    >
      <div
        aria-hidden="true"
        className="relative shrink-0 rounded-full overflow-hidden"
        style={{
          background: "var(--bc-mobile-accent-grad)",
          height: "var(--bc-mobile-header-avatar)",
          width: "var(--bc-mobile-header-avatar)",
        }}
      >
        {avatarUrl && !imageFailed ? (
          <img
            src={avatarUrl}
            alt=""
            className="absolute rounded-full object-cover"
            style={{
              top: "2px",
              left: "2px",
              width: "calc(100% - 4px)",
              height: "calc(100% - 4px)",
            }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span
            className="absolute grid place-items-center rounded-full bg-[var(--bc-mobile-surface)] text-[15px] font-semibold text-[var(--bc-mobile-accent)]"
            style={{
              top: "2px",
              left: "2px",
              width: "calc(100% - 4px)",
              height: "calc(100% - 4px)",
            }}
          >
            {initials ?? <User className="h-5 w-5" strokeWidth={1.6} />}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-1.5 text-[length:var(--bc-mobile-header-title)] font-semibold leading-tight tracking-tight text-[var(--bc-mobile-text)]">
          {t("bc.mobile.nav.me")}
          {verified ? (
            <BadgeCheck
              aria-label={t("bc.mobile.me.header.verified")}
              className="h-5 w-5 shrink-0 text-[var(--bc-mobile-accent)]"
              strokeWidth={2}
            />
          ) : null}
        </h1>
        <p className="mt-0.5 truncate text-[13.5px] text-[var(--bc-mobile-muted)]">
          {t("bc.mobile.me.header.subtitle")}
        </p>
      </div>

      <Link
        to="/connect-app/notifications"
        aria-label={t("bc.mobile.home.notifications")}
        style={{
          height: "var(--bc-mobile-header-action)",
          width: "var(--bc-mobile-header-action)",
          marginRight: "calc(-1 * var(--bc-mobile-header-gap) / 2)",
        }}
        className="grid shrink-0 place-items-center rounded-full text-[var(--bc-mobile-accent)] transition-colors hover:bg-[var(--bc-mobile-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] motion-reduce:transition-none"
      >
        <Bell
          style={{ height: "var(--bc-mobile-header-icon)", width: "var(--bc-mobile-header-icon)" }}
          strokeWidth={1.7}
        />
      </Link>
    </header>
  );
}
