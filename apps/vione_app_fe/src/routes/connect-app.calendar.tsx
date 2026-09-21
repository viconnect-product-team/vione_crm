// Xem lịch — /connect-app/calendar

import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";
import { ScheduleCalendar } from "@/components/business-connect/mobile/ScheduleCalendar";

export const Route = createFileRoute("/connect-app/calendar")({
  head: () => ({
    meta: [
      { title: "Xem lịch — ViOne Connect" },
      {
        name: "description",
        content: "Lịch cuộc gặp và việc cần theo dõi sắp tới của bạn trên ViOne Connect.",
      },
      { property: "og:title", content: "Xem lịch — ViOne Connect" },
      {
        property: "og:description",
        content: "Lịch cuộc gặp và việc cần theo dõi sắp tới của bạn trên ViOne Connect.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const t = useT();
  return (
    <MobilePage>
      <BusinessConnectTopBar title={t("bc.mobile.calendar.pageTitle")} back />
      <ScheduleCalendar />
    </MobilePage>
  );
}
