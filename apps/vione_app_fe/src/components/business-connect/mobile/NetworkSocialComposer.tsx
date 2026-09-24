import { useState } from "react";
import { Image as ImageIcon, Users, Lightbulb, MapPin, Sparkles } from "lucide-react";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { avatarOrDemo } from "@/lib/business-connect/mobile/demo-avatars";
import { PostMomentModal } from "./moments/PostMomentModal";

export function NetworkSocialComposer() {
  const viewerUserId = useViewerUserId();
  const [composerOpen, setComposerOpen] = useState(false);
  const [initialFeeling, setInitialFeeling] = useState<string | undefined>();

  const handleOpenWithFeeling = (feeling?: string) => {
    setInitialFeeling(feeling);
    setComposerOpen(true);
  };

  return (
    <>
      <div className="mt-3 mb-4 rounded-2xl border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface)] p-3 shadow-xs">
        {/* Top Input Bar */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[var(--bc-mobile-border)]">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/40 shrink-0">
            <img
              src={avatarOrDemo(viewerUserId, "Tôi")}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => handleOpenWithFeeling()}
            className="flex-1 text-left px-4 py-2.5 rounded-full bg-[var(--bc-mobile-surface-2)] border border-[var(--bc-mobile-border)] text-[13px] text-[var(--bc-mobile-muted)] hover:border-amber-400/60 hover:text-[var(--bc-mobile-text)] transition-all cursor-pointer truncate"
          >
            Bạn đang nghĩ gì? Chia sẻ khoảnh khắc kinh doanh...
          </button>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center justify-between pt-2 px-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => handleOpenWithFeeling()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 transition-colors shrink-0"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>Ảnh/Video</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWithFeeling("meet_partner")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 transition-colors shrink-0"
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>Gắn thẻ đối tác</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWithFeeling("share_opportunity")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 transition-colors shrink-0"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Cơ hội kinh doanh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenWithFeeling("networking_event")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[11.5px] font-semibold text-rose-600 dark:text-rose-400 transition-colors shrink-0"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Check-in</span>
          </button>
        </div>
      </div>

      <PostMomentModal
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initialFeeling={initialFeeling}
      />
    </>
  );
}
