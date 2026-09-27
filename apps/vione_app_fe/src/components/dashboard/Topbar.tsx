import { Menu } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import { AssociationSwitcher } from "@/components/dashboard/AssociationSwitcher";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { TopbarBreadcrumb } from "@/components/dashboard/TopbarBreadcrumb";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useRouterState } from "@tanstack/react-router";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const t = useT();
  const pathname = useRouterState({ select: (s) => s?.location?.pathname });
  const isDashboard = pathname === "/" || pathname === "";

  return (
    <header className="self-stretch px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-white dark:bg-slate-900 border-b border-violet-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-colors duration-200">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {isDashboard ? (
          <div className="flex flex-col justify-start items-start gap-1">
            <h1 className="text-gray-900 dark:text-white text-xl sm:text-2xl font-bold font-['Inter']">
              Tổng quan vận hành
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-normal font-['Inter']">
              Chào ngày mới! Xem nhanh các chỉ số hoạt động đa kênh của bạn
            </p>
          </div>
        ) : (
          <TopbarBreadcrumb />
        )}
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Quick notification bell button matching exact user code */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg flex items-center justify-center transition cursor-pointer">
          <NotificationCenter />
        </div>

        {/* Switchers */}
        <div className="flex items-center gap-1.5">
          <AssociationSwitcher />
          <LangSwitcher />
          <ThemeSwitcher className="inline-flex" />
        </div>
      </div>
    </header>
  );
}

