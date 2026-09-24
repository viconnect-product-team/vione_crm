import { useEffect, useState, type ComponentType } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useT, type TKey } from "@/lib/i18n";
import { VButton } from "./VButton";
import { NavHomeIcon, NavNetworkIcon, NavCommunityIcon, NavMeIcon } from "./NavIcons";

type NavTab = {
  to: string;
  key: TKey;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

const HOME_TAB: NavTab = {
  to: "/connect-app",
  key: "bc.mobile.nav.home",
  icon: NavHomeIcon,
  exact: true,
};
const NETWORK_TAB: NavTab = {
  to: "/connect-app/network",
  key: "bc.mobile.nav.network",
  icon: NavNetworkIcon,
};
const COMMUNITY_TAB: NavTab = {
  to: "/connect-app/community",
  key: "bc.mobile.nav.community",
  icon: NavCommunityIcon,
};
const ME_TAB: NavTab = {
  to: "/connect-app/me",
  key: "bc.mobile.nav.me",
  icon: NavMeIcon,
};

export function BusinessConnectBottomNav({ onVPress }: { onVPress: () => void }) {
  const t = useT();
  const location = useLocation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      // Keyboard is detected if visual viewport shrinks significantly below window height
      const isKeyboard = window.innerHeight - vv.height > 100;
      setKeyboardOpen(isKeyboard);
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  // Hide bottom nav on detail / full-screen leaf flows where custom bottom action or chat input exists
  const pathname = location?.pathname ?? "";
  const isLeafRoute =
    pathname.startsWith("/connect-app/inbox/") ||
    pathname === "/connect-app/card-scan" ||
    pathname.startsWith("/connect-app/moment/") ||
    pathname === "/connect-app/activate";

  if (isLeafRoute || keyboardOpen) {
    return null;
  }

  const renderTab = (tab: NavTab) => {
    const Icon = tab.icon;
    return (
      <Link
        key={tab.to}
        id={tab.to === "/connect-app/network" ? "tour-vione-network-nav" : undefined}
        to={tab.to}
        activeOptions={{ exact: tab.exact ?? false }}
        className="group relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 select-none transition-colors duration-150 motion-reduce:transition-none cursor-pointer"
        activeProps={{ className: "text-[var(--bc-mobile-accent-strong)] font-bold" }}
        inactiveProps={{
          className: "text-[var(--bc-mobile-muted)] hover:text-[var(--bc-mobile-text)]",
        }}
      >
        {/* Chỉ báo tab đang chọn */}
        <span
          aria-hidden="true"
          className="absolute -top-[7px] h-[3px] w-6 rounded-full bg-[var(--bc-mobile-accent-grad)] opacity-0 transition-opacity duration-150 group-data-[status=active]:opacity-100 motion-reduce:transition-none"
        />
        <span className="grid place-items-center rounded-xl px-3 py-1 transition-colors duration-150 group-data-[status=active]:bg-[var(--bc-mobile-accent-soft)] motion-reduce:transition-none">
          <Icon className="h-[20px] w-[20px]" />
        </span>
        <span className="text-[10.5px] font-medium leading-none group-data-[status=active]:font-bold">
          {t(tab.key)}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label={t("bc.mobile.nav.label")}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px]"
    >
      <div
        className="relative grid grid-cols-5 items-center border-t border-[rgba(216,178,130,0.18)] bg-[var(--bc-mobile-surface)]/85 px-2 pt-1.5 backdrop-blur-lg shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
        style={{
          minHeight: "calc(var(--bc-mobile-nav-h) + var(--bc-mobile-safe-bottom))",
          paddingBottom: "max(var(--bc-mobile-safe-bottom), 6px)",
        }}
      >
        {renderTab(HOME_TAB)}
        {renderTab(NETWORK_TAB)}
        <div id="tour-vione-vbutton" className="relative flex items-center justify-center">
          <VButton onClick={onVPress} className="-mt-[20px]" />
        </div>
        {renderTab(COMMUNITY_TAB)}
        {renderTab(ME_TAB)}
      </div>
    </nav>
  );
}
