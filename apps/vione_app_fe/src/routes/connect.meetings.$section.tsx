// BC-4.1C — A single meeting section list (upcoming/pending/past/cancelled).
// `open` search param deep-links the detail slide-over.
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { MeetingSectionView } from "@/components/business-meetings/MeetingSectionView";
import type { MeetingSection } from "@/hooks/use-business-meetings";

const SECTIONS = ["upcoming", "pending", "past", "cancelled"] as const;

const searchSchema = z.object({
  open: z.string().uuid().optional(),
});

export const Route = createFileRoute("/connect/meetings/$section")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  component: MeetingSectionPage,
});

function MeetingSectionPage() {
  const { section } = Route.useParams();
  const { open } = Route.useSearch();
  const navigate = Route.useNavigate();

  const validSection: MeetingSection = (SECTIONS as readonly string[]).includes(section)
    ? (section as MeetingSection)
    : "upcoming";

  const setOpen = (id: string | null) => navigate({ to: ".", search: { open: id ?? undefined } });

  return (
    <MeetingSectionView
      key={validSection}
      section={validSection}
      openId={open ?? null}
      onOpen={(id) => setOpen(id)}
      onCloseDetail={() => setOpen(null)}
    />
  );
}
