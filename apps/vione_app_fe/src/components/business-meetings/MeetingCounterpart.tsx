// BC-4.1C — Privacy-safe counterpart identity chip.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useT } from "@/lib/i18n";
import type { MeetingCounterpartSummary } from "@/lib/business-meetings/types";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MeetingCounterpart({
  counterpart,
  size = "sm",
}: {
  counterpart: MeetingCounterpartSummary | null;
  size?: "sm" | "md";
}) {
  const t = useT();
  const name = counterpart?.displayName ?? t("connect.meetings.counterpart.unknown");
  const avatarCls = size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={avatarCls}>
        {counterpart?.avatarUrl ? <AvatarImage src={counterpart.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-xs">
          {initials(counterpart?.displayName ?? null)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {counterpart?.headline || counterpart?.companyName ? (
          <p className="truncate text-xs text-muted-foreground">
            {counterpart?.headline ?? counterpart?.companyName}
          </p>
        ) : null}
      </div>
    </div>
  );
}
