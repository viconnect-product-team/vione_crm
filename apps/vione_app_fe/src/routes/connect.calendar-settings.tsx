// BC-7.7 Turn C — Calendar & availability preferences route.
// Signed-in only; mirrors the auth pattern used by other /connect routes
// (ssr: false + client-side session read via SDK).

import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { CalendarAvailabilitySettings } from "@/components/business-connect/meeting/CalendarAvailabilitySettings";

export const Route = createFileRoute("/connect/calendar-settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Calendar & availability — Business Connect" },
      {
        name: "description",
        content:
          "Configure your timezone, working hours, and buffers so others can book meetings with you.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarSettingsPage,
});

function CalendarSettingsPage() {
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{t("calendar.prefs.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("calendar.prefs.subtitle")}</p>
      </header>
      <CalendarAvailabilitySettings />
    </div>
  );
}
