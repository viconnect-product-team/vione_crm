// BC-Mobile-2E — /connect-app/moment (person picker for Meeting Moment).

import { createFileRoute } from "@tanstack/react-router";
import { MomentPersonPicker } from "@/components/business-connect/mobile/MomentPersonPicker";

export const Route = createFileRoute("/connect-app/moment/")({
  head: () => ({
    meta: [{ title: "Khoảnh khắc — Business Connect" }, { name: "robots", content: "noindex" }],
  }),
  component: MomentPickerPage,
});

function MomentPickerPage() {
  return <MomentPersonPicker />;
}
