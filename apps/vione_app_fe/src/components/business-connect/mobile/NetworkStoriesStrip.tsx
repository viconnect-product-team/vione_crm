import { useState, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Heart, Sparkles, Send, Briefcase, MapPin, Building2, Eye } from "lucide-react";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import { avatarOrDemo } from "@/lib/business-connect/mobile/demo-avatars";
import { toast } from "sonner";

export interface EntrepreneurStory {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorAvatar: string;
  storyImage: string;
  storyCaption: string;
  tag?: string;
  timeAgo: string;
  viewsCount: number;
}

const DEMO_STORIES: EntrepreneurStory[] = [
  {
    id: "story-1",
    authorName: "Nguyễn Tuấn Hải",
    authorTitle: "Chủ tịch HĐQT",
    authorCompany: "Alphanam Group",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    storyImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&auto=format&fit=crop&q=80",
    storyCaption: "Khai mạc Diễn đàn Xúc tiến Đầu tư Quốc tế 2026 cùng hơn 500 tập đoàn hàng đầu. Cơ hội bứt phá chuỗi cung ứng toàn cầu!",
    tag: "Xúc tiến đầu tư",
    timeAgo: "1 giờ trước",
    viewsCount: 342,
  },
  {
    id: "story-2",
    authorName: "Trần Mai Phương",
    authorTitle: "Tổng Giám Đốc",
    authorCompany: "VinTech Innovation",
    authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    storyImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=900&auto=format&fit=crop&q=80",
    storyCaption: "Chính thức ký kết hợp tác công nghệ AI Agent tự động hóa doanh nghiệp cùng đối tác Singapore. Bước chuyển mình quan trọng!",
    tag: "Ký kết đối tác",
    timeAgo: "3 giờ trước",
    viewsCount: 489,
  },
  {
    id: "story-3",
    authorName: "Lê Hoàng Long",
    authorTitle: "Sáng Lập & CEO",
    authorCompany: "GreenE Solar",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    storyImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80",
    storyCaption: "Gặp gỡ bàn tròn doanh nhân CEO 1983 tại JW Marriott. Tinh thần chia sẻ giá trị và liên kết kinh tế tư nhân!",
    tag: "Bàn tròn CEO",
    timeAgo: "5 giờ trước",
    viewsCount: 620,
  },
  {
    id: "story-4",
    authorName: "Phạm Thùy Linh",
    authorTitle: "Giám Đốc Chiến Lược",
    authorCompany: "LuxVillas Property",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    storyImage: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&auto=format&fit=crop&q=80",
    storyCaption: "Khảo sát thực địa tổ hợp bất động sản nghỉ dưỡng sinh thái chuẩn ESG. Chuẩn bị ra mắt quý 3!",
    tag: "Khảo sát dự án",
    timeAgo: "7 giờ trước",
    viewsCount: 275,
  },
  {
    id: "story-5",
    authorName: "Đỗ Đăng Khoa",
    authorTitle: "Chủ tịch",
    authorCompany: "TechVina Global",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    storyImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
    storyCaption: "Chào đón đoàn đại biểu xúc tiến thương mại song phương tại trụ sở Hà Nội!",
    tag: "Đoàn đại biểu",
    timeAgo: "9 giờ trước",
    viewsCount: 512,
  },
];

interface NetworkStoriesStripProps {
  onOpenCreateStory: () => void;
}

export function NetworkStoriesStrip({ onOpenCreateStory }: NetworkStoriesStripProps) {
  const viewerUserId = useViewerUserId();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState("");

  const activeStory = activeStoryIndex !== null ? DEMO_STORIES[activeStoryIndex] : null;

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const timer = setTimeout(() => {
      if (activeStoryIndex < DEMO_STORIES.length - 1) {
        setActiveStoryIndex((idx) => (idx !== null ? idx + 1 : null));
      } else {
        setActiveStoryIndex(null);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeStoryIndex]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex < DEMO_STORIES.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    toast.success(`Đã gửi phản hồi đến ${activeStory?.authorName}!`);
    setReplyText("");
  };

  return (
    <>
      <section className="mt-2 mb-4">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-[12.5px] font-bold uppercase tracking-wider text-[var(--bc-mobile-text,#0F172A)]">
              Khoảnh khắc 24h Doanh nhân
            </h2>
          </div>
          <span className="text-[11px] font-medium text-[var(--bc-mobile-muted,#64748B)]">
            Tin cập nhật hàng ngày
          </span>
        </div>

        {/* Stories Scrollable Row */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4">
          {/* Card Tạo tin của tôi */}
          <div
            onClick={onOpenCreateStory}
            role="button"
            tabIndex={0}
            className="group relative flex-none w-[105px] h-[155px] rounded-2xl overflow-hidden border border-dashed border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-400/5 to-transparent dark:from-amber-400/15 dark:to-slate-900/80 shadow-xs cursor-pointer flex flex-col items-center justify-between p-2.5 transition-all hover:scale-[1.02] hover:border-amber-400"
          >
            <div className="relative mt-2">
              <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200">
                <img
                  src={avatarOrDemo(viewerUserId, "Tôi")}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md">
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </span>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-[var(--bc-mobile-text,#0F172A)] leading-tight">
                Tạo tin 24h
              </p>
              <p className="text-[9.5px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                Chia sẻ ngay
              </p>
            </div>
          </div>

          {/* Danh sách Stories của các Doanh nhân */}
          {DEMO_STORIES.map((story, idx) => (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(idx)}
              role="button"
              tabIndex={0}
              className="group relative flex-none w-[105px] h-[155px] rounded-2xl overflow-hidden border border-[var(--bc-mobile-border)] bg-slate-900 shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
            >
              {/* Background Cover */}
              <img
                src={story.storyImage}
                alt={story.authorName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-black/40" />

              {/* Tag chip */}
              {story.tag && (
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-black/60 text-amber-300 backdrop-blur-md border border-amber-400/30">
                    {story.tag}
                  </span>
                </div>
              )}

              {/* Author Avatar with active gold ring */}
              <div className="absolute top-2 left-2">
                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-sm">
                  <img
                    src={story.authorAvatar}
                    alt={story.authorName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Author name & time */}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[11px] font-bold text-white leading-tight truncate drop-shadow-sm">
                  {story.authorName}
                </p>
                <p className="text-[9px] text-amber-200/90 truncate font-medium">
                  {story.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story Fullscreen Viewer Modal */}
      {activeStory !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveStoryIndex(null)}
        >
          <div
            className="relative w-full max-w-md h-full sm:h-[88vh] sm:rounded-3xl overflow-hidden bg-slate-950 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Story Image */}
            <img
              src={activeStory.storyImage}
              alt="Story Content"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/70" />

            {/* Top Navigation & Progress Bar */}
            <div className="relative z-20 p-4 space-y-3">
              {/* Progress segments */}
              <div className="flex items-center gap-1.5 w-full">
                {DEMO_STORIES.map((s, i) => (
                  <div
                    key={s.id}
                    className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
                  >
                    <div
                      className={`h-full bg-amber-400 transition-all ${
                        i < (activeStoryIndex ?? 0)
                          ? "w-full"
                          : i === activeStoryIndex
                          ? "w-full duration-[6000ms] ease-linear"
                          : "w-0"
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-md">
                    <img
                      src={activeStory.authorAvatar}
                      alt={activeStory.authorName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {activeStory.authorName}
                      </h4>
                      <span className="text-xs text-amber-300 font-medium">
                        • {activeStory.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1">
                      {activeStory.authorTitle} · {activeStory.authorCompany}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md">
                    <Eye className="w-3 h-3 text-amber-300" />
                    {activeStory.viewsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStoryIndex(null)}
                    className="p-1.5 rounded-full bg-black/40 text-white hover:bg-white/20 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tap areas for prev / next */}
            <div className="relative z-10 flex-1 grid grid-cols-2">
              <div
                className="h-full cursor-pointer"
                onClick={handlePrev}
                title="Tin trước"
              />
              <div
                className="h-full cursor-pointer"
                onClick={handleNext}
                title="Tin tiếp theo"
              />
            </div>

            {/* Bottom Caption & Interactive Reply Bar */}
            <div className="relative z-20 p-4 space-y-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
              <p className="text-[13.5px] font-medium text-white/95 leading-relaxed bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                {activeStory.storyCaption}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={`Gửi tin nhắn phản hồi đến ${activeStory.authorName}...`}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/15 border border-white/25 text-white placeholder-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLiked((prev) => ({
                      ...prev,
                      [activeStory.id]: !prev[activeStory.id],
                    }));
                    if (!liked[activeStory.id]) {
                      toast.success("Đã thả tim khoảnh khắc!");
                    }
                  }}
                  className={`p-2.5 rounded-full border transition-all ${
                    liked[activeStory.id]
                      ? "bg-rose-500 border-rose-400 text-white"
                      : "bg-white/15 border-white/20 text-white hover:bg-white/25"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked[activeStory.id] ? "fill-white" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  className="p-2.5 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold transition shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
