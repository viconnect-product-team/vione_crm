import type { ReactNode } from "react";
import {
  Inbox,
  AlertTriangle,
  ShieldOff,
  SearchX,
  WifiOff,
  BellOff,
  RefreshCw,
} from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";

/** Reusable loading skeleton block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-muted/70 ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--card) 60%, transparent), transparent)",
          animation: "vba-shimmer 1.4s infinite",
        }}
      />
    </div>
  );
}

/** A vertical stack of skeleton rows — for list/table loading. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Tone = "neutral" | "danger" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-warning",
};

/** Generic centered state with icon, title, description and optional action. */
export function StateView({
  icon,
  title,
  description,
  action,
  tone = "neutral",
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={`vba-pop-in flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}
    >
      <div
        className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${toneClasses[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function useDefaults(titleKey: TKey, descKey: TKey, title?: string, description?: string) {
  const t = useT();
  return { title: title ?? t(titleKey), description: description ?? t(descKey) };
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const d = useDefaults("state.empty.title", "state.empty.desc", title, description);
  return (
    <StateView
      icon={icon ?? <Inbox className="h-6 w-6" />}
      title={d.title}
      description={d.description}
      action={action}
    />
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const t = useT();
  const d = useDefaults("state.error.title", "state.error.desc", title, description);
  return (
    <StateView
      tone="danger"
      icon={<AlertTriangle className="h-6 w-6" />}
      title={d.title}
      description={d.description}
      action={
        onRetry ? (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-4 w-4" />
            {t("state.error.retry")}
          </button>
        ) : undefined
      }
    />
  );
}

export function PermissionDenied({ title, description }: { title?: string; description?: string }) {
  const d = useDefaults("state.denied.title", "state.denied.desc", title, description);
  return (
    <StateView
      tone="warning"
      icon={<ShieldOff className="h-6 w-6" />}
      title={d.title}
      description={d.description}
    />
  );
}

export function NoSearchResult({ title, description }: { title?: string; description?: string }) {
  const d = useDefaults("state.noresult.title", "state.noresult.desc", title, description);
  return (
    <StateView icon={<SearchX className="h-6 w-6" />} title={d.title} description={d.description} />
  );
}

export function NoNotifications({ title }: { title?: string }) {
  const t = useT();
  return <StateView icon={<BellOff className="h-6 w-6" />} title={title ?? t("notif.empty")} />;
}

export function OfflineState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const t = useT();
  const d = useDefaults("state.offline.title", "state.offline.desc", title, description);
  return (
    <StateView
      tone="warning"
      icon={<WifiOff className="h-6 w-6" />}
      title={d.title}
      description={d.description}
      action={
        onRetry ? (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-4 w-4" />
            {t("state.error.retry")}
          </button>
        ) : undefined
      }
    />
  );
}
