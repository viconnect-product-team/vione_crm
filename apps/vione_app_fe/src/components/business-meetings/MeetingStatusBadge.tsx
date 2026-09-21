// BC-4.1C — Meeting status badge (semantic tokens only).
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { BusinessMeetingStatus } from "@/lib/business-meetings/types";

const VARIANT: Record<BusinessMeetingStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    draft: "outline",
    proposed: "secondary",
    confirmed: "default",
    declined: "destructive",
    cancelled: "outline",
    completed: "default",
    no_show: "destructive",
  };

export function MeetingStatusBadge({ status }: { status: BusinessMeetingStatus }) {
  const t = useT();
  return (
    <Badge variant={VARIANT[status]} className="shrink-0">
      {t(`connect.meetings.status.${status}` as Parameters<typeof t>[0])}
    </Badge>
  );
}
