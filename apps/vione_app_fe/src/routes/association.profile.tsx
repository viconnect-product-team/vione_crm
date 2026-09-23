import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Settings,
  ChevronRight,
  ChevronDown,
  BadgeCheck,
  User,
  Building2,
  Users,
  History,
  FileText,
  Package,
  Sparkles,
  Bell,
  Settings as Cog,
  LogOut,
  Sun,
  Moon,
  Contrast,
  Share2,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  LayoutDashboard,
  ArrowUpRight,
  Nfc,
  X,
  Camera,
  MapPin,
  Mail,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  ThumbsUp,
  MessageCircle,
  Image as ImageIcon,
  Edit3,
  Lock,
  Globe2,
  Plus,
  ImagePlus,
  Loader2,
  MessageSquare,
  Tag,
  Users2,
  BookOpen,
  Headphones,
  Bot,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { isEventThemeEnabled, setEventThemeEnabled } from "@/components/member/SeasonalEventHeader";
import { isVoiceAiEnabled, setVoiceAiEnabled } from "@/components/ai/VoiceNavAssistant";
import { UserGuideModal } from "@/components/member/UserGuideModal";
import { ContactSupportModal } from "@/components/member/ContactSupportModal";
import { PrivacySettingsModal } from "@/components/member/PrivacySettingsModal";
import { useServerData } from "@/hooks/use-server-data";
import { getMyMember, updateMyProfile, listMembers, listConversations, type MyMember, type DirectoryMember, type MyConversation } from "@/lib/member-app.functions";
import { useT, useLang } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { signOutSession } from "@/lib/business-connect/mobile/auth-session";
import { resolveMediaUrl, uploadFileToNest, fetchNestApi } from "@/lib/api-client";
import { toast } from "sonner";
import heroImg from "@/assets/vba-hero.jpg";
import eventImg from "@/assets/vba-event.jpg";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve((e.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || "");
      img.src = (e.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/association/profile")({
  component: ProfileScreen,
});

function initials(name?: string) {
  if (!name) return "VIP";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function isDeadAvatar(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return true;
  if (
    trimmed.includes("1789634170838-i5o6ez") ||
    trimmed.includes("i5o6ez") ||
    trimmed.includes("d9ut5z") ||
    trimmed.includes("4qjy8i") ||
    trimmed.includes("1789886990280-v691rs") ||
    trimmed.includes("v691rs") ||
    trimmed.includes("xkmg4w")
  ) {
    return true;
  }
  return false;
}

function isDeadCover(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return true;
  if (
    trimmed.includes("1789887024790-g4pkai") ||
    trimmed.includes("g4pkai") ||
    trimmed.includes("i5o6ez") ||
    trimmed.includes("d9ut5z") ||
    trimmed.includes("4qjy8i")
  ) {
    return true;
  }
  return false;
}

export default function ProfileScreen() {
  const t = useT();
  const { lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const fetchMember = useServerFn(getMyMember);
  const updateProfileFn = useServerFn(updateMyProfile);
  const fetchDirectory = useServerFn(listMembers);
  const fetchConversations = useServerFn(listConversations);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null, "vba_my_member");
  const { data: realMembers = [] } = useServerData<DirectoryMember[]>(() => fetchDirectory(), [], "vba_directory_members");
  const { data: conversations = [] } = useServerData<MyConversation[]>(() => fetchConversations(), [], "vba_conversations");

  const [copied, setCopied] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "friends" | "posts" | "photos">("about");
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [postLikes, setPostLikes] = useState<Record<string, number>>({ post1: 24, post2: 41 });
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [eventThemeEnabled, setEventThemeState] = useState(() => isEventThemeEnabled());
  const [voiceAiEnabled, setVoiceAiState] = useState(() => isVoiceAiEnabled());
  const [userGuideOpen, setUserGuideOpen] = useState(false);
  const [contactSupportOpen, setContactSupportOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingModalAvatar, setUploadingModalAvatar] = useState(false);
  const [modalAvatarPreview, setModalAvatarPreview] = useState<string | null>(null);

  // Chỉ reset avatarError khi người dùng chọn tải lên ảnh mới dạng base64/data URI
  useEffect(() => {
    if (customAvatar && !isDeadAvatar(customAvatar) && customAvatar.startsWith("data:")) {
      setAvatarError(false);
    }
  }, [customAvatar]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCover = localStorage.getItem("vba_member_cover_photo");
      if (savedCover) {
        if (isDeadCover(savedCover)) {
          localStorage.removeItem("vba_member_cover_photo");
          setCoverPhoto(null);
        } else {
          setCoverPhoto(savedCover);
        }
      } else {
        const rawCover = member?.coverUrl || (member as any)?.cover_url;
        if (rawCover && !isDeadCover(rawCover)) {
          setCoverPhoto(rawCover);
        }
      }
      const savedAvatar = localStorage.getItem("vba_member_avatar_photo");
      if (savedAvatar) {
        if (isDeadAvatar(savedAvatar)) {
          localStorage.removeItem("vba_member_avatar_photo");
          setCustomAvatar(null);
        } else {
          setCustomAvatar(savedAvatar);
        }
      }
    }
  }, [member?.coverUrl, (member as any)?.cover_url]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Only image files allowed" : "Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP)");
      return;
    }
    setUploadingCover(true);
    try {
      // 1. Nén ảnh qua Canvas để kích thước vừa vặn và không gây quá tải storage (tối đa 1200px)
      const compressedUrl = await compressImage(file, 1200, 0.82);
      let finalCover = compressedUrl;

      // 2. Upload file lên Nest nếu khả dụng
      try {
        const uploadUrl = await uploadFileToNest(file, file.name || "cover.jpg");
        if (uploadUrl && typeof uploadUrl === "string") {
          finalCover = uploadUrl;
        }
      } catch (uploadErr) {
        console.warn("Nest upload media not reachable, fallback to compressed image:", uploadErr);
      }

      // 3. Cập nhật state & lưu localStorage
      setCoverPhoto(finalCover);
      try {
        localStorage.setItem("vba_member_cover_photo", finalCover);
      } catch (stErr) {
        console.warn("Storage full:", stErr);
      }

      // 4. Phát event để toàn app (Home banner, Card điện tử) cập nhật ngay
      window.dispatchEvent(new CustomEvent("vba_member_cover_updated", { detail: finalCover }));

      // 5. Lưu vĩnh viễn vào backend DB
      await fetchNestApi("/members/me/cover", {
        method: "PATCH",
        body: JSON.stringify({ coverUrl: finalCover }),
      }).catch((apiErr) => {
        console.warn("API /members/me/cover PATCH error:", apiErr);
      });

      toast.success(isEn ? "Cover photo updated successfully!" : "Cập nhật ảnh bìa thành công!");
    } catch (err) {
      console.error("Error updating cover photo:", err);
      toast.error(isEn ? "Failed to update cover photo" : "Không thể cập nhật ảnh bìa. Vui lòng thử lại!");
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Only image files allowed" : "Chỉ chấp nhận tệp hình ảnh");
      return;
    }
    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setCustomAvatar(res);
        setAvatarError(false);
        try {
          localStorage.setItem("vba_member_avatar_photo", res);
          window.dispatchEvent(new Event("vba_member_avatar_updated"));
        } catch {}
      }
    };
    reader.readAsDataURL(file);

    try {
      const token = localStorage.getItem("vibe_token") || localStorage.getItem("token") || localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.url) {
          setCustomAvatar(json.url);
          setAvatarError(false);
          localStorage.setItem("vba_member_avatar_photo", json.url);
          window.dispatchEvent(new Event("vba_member_avatar_updated"));
          toast.success(isEn ? "Avatar updated successfully!" : "Cập nhật ảnh đại diện thành công!");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn("Avatar upload rejected:", res.status, err);
        toast.error(isEn ? "Failed to upload avatar" : "Không thể tải ảnh đại diện lên máy chủ");
      }
    } catch (err) {
      console.error("Avatar upload exception:", err);
      toast.error(isEn ? "Failed to upload avatar" : "Lỗi khi tải ảnh đại diện lên máy chủ");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  // ── USER POSTS FEED STATE ──
  interface UserPost {
    id: string;
    authorName: string;
    authorAvatar?: string | null;
    time: string;
    content: string;
    imageUrl?: string | null;
    privacy: "public" | "friends" | "private";
    taggedFriends: string[];
    likes: number;
  }

  const [userPosts, setUserPosts] = useState<UserPost[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("vba_user_posts") || "[]");
        if (Array.isArray(saved) && saved.length > 0) return saved;
      } catch {}
    }
    return [
      {
        id: "post1",
        authorName: member?.name || user?.name || "Hội viên CLB CEO 1983",
        authorAvatar: null,
        time: "Hôm qua lúc 15:30",
        content: "Rất vinh dự được đón tiếp các anh chị lãnh đạo CLB Doanh Nhân CEO 1983 tới thăm và làm việc tại trụ sở ViOne. Chúc các thỏa thuận hợp tác thương mại sớm đơm hoa kết trái! 🤝✨",
        imageUrl: eventImg,
        privacy: "public",
        taggedFriends: ["Đặng Văn Lâm", "Trần Thu Trang"],
        likes: 24,
      },
    ];
  });

  // ── CREATE POST COMPOSER MODAL STATE ──
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postPrivacy, setPostPrivacy] = useState<"public" | "friends" | "private">("public");
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  // Dynamic resolved display info based on real registered user / member
  const resolvedDisplayName = member?.name || user?.name || (user as any)?.user_metadata?.full_name || user?.username || "Hội viên CLB CEO 1983";
  const resolvedDisplayTitle = member?.title || "Hội viên chính thức CLB CEO 1983";
  const resolvedDisplayCompany = (member as any)?.companyName || member?.industry || "CLB Doanh Nhân CEO 1983";
  const resolvedDisplayPhone = member?.phone || (user as any)?.phone || "";
  const resolvedDisplayEmail = member?.email || user?.email || "";

  const userProfileStorageKey = `vba_custom_profile_${user?.id || (member as any)?.id || "default"}`;

  // Local editable profile state with user-scoped persistence
  const [profileName, setProfileName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.name) return saved.name;
      } catch {}
    }
    return resolvedDisplayName;
  });
  const [profileTitle, setProfileTitle] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.title) return saved.title;
      } catch {}
    }
    return resolvedDisplayTitle;
  });
  const [profileCompany, setProfileCompany] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.company) return saved.company;
      } catch {}
    }
    return resolvedDisplayCompany;
  });
  const [profilePhone, setProfilePhone] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.phone) return saved.phone;
      } catch {}
    }
    return resolvedDisplayPhone;
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.email) return saved.email;
      } catch {}
    }
    return resolvedDisplayEmail;
  });
  const [profileAddress, setProfileAddress] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.address) return saved.address;
      } catch {}
    }
    return "Hà Nội, Việt Nam";
  });
  const [profileWebsite, setProfileWebsite] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.website) return saved.website;
      } catch {}
    }
    return "https://ceo1983.vn";
  });
  const [profileBio, setProfileBio] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.bio) return saved.bio;
      } catch {}
    }
    return "Hội viên tích cực CLB Doanh Nhân CEO 1983, sẵn sàng giao lưu kết nối và hợp tác giao thương.";
  });

  // Tự động đồng bộ hóa thông tin khi dữ liệu hội viên / user từ backend load xong
  const initProfileFields = (force = false) => {
    let saved: any = {};
    if (typeof window !== "undefined") {
      try {
        saved = JSON.parse(localStorage.getItem(userProfileStorageKey) || localStorage.getItem("vba_custom_profile") || "{}");
        if (saved.avatar && isDeadAvatar(saved.avatar)) {
          delete saved.avatar;
          localStorage.setItem(userProfileStorageKey, JSON.stringify(saved));
        }
      } catch {}
    }
    const isStaleName = saved.name && (saved.name === "Lê Hoàng Long" || saved.name.includes("ViOne Platform"));
    const isStaleTitle = saved.title && (saved.title === "James Nguyễn" || saved.title === "Lê Hoàng Long");

    const resolvedName = (saved.name && !isStaleName)
      ? saved.name
      : (member?.name || user?.name || (user as any)?.user_metadata?.full_name || user?.username || "");
    const resolvedTitle = (saved.title && !isStaleTitle)
      ? saved.title
      : (member?.title || (user as any)?.user_metadata?.professional_title || "Hội viên chính thức CLB CEO 1983");
    const resolvedCompany = saved.company || (member as any)?.companyName || member?.industry || (member as any)?.about || "CLB Doanh Nhân CEO 1983";
    const resolvedPhone = saved.phone || member?.phone || (user as any)?.phone || "";
    const resolvedEmail = saved.email || member?.email || user?.email || "";
    const resolvedAddress = saved.address || member?.address || "Hà Nội, Việt Nam";
    const resolvedWebsite = saved.website || member?.website || "https://ceo1983.vn";
    const resolvedBio = saved.bio || (member as any)?.about || "Hội viên tích cực CLB Doanh Nhân CEO 1983, sẵn sàng giao lưu kết nối và hợp tác giao thương.";
    
    let candidateAv = saved.avatar || customAvatar || member?.avatar || (member as any)?.avatarUrl || (user as any)?.avatar_url || null;
    if (isDeadAvatar(candidateAv)) {
      candidateAv = null;
    }

    if (force || !profileName) setProfileName(resolvedName);
    if (force || !profileTitle) setProfileTitle(resolvedTitle);
    if (force || !profileCompany) setProfileCompany(resolvedCompany);
    if (force || !profilePhone) setProfilePhone(resolvedPhone);
    if (force || !profileEmail) setProfileEmail(resolvedEmail);
    if (force || !profileAddress) setProfileAddress(resolvedAddress);
    if (force || !profileWebsite) setProfileWebsite(resolvedWebsite);
    if (force || !profileBio) setProfileBio(resolvedBio);
    if (candidateAv && (!customAvatar || force)) {
      setCustomAvatar(candidateAv);
      setModalAvatarPreview(candidateAv);
    }
  };

  useEffect(() => {
    initProfileFields(false);
  }, [member, user, userProfileStorageKey]);

  const handleModalAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Only image files allowed" : "Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP)");
      return;
    }
    setUploadingModalAvatar(true);
    try {
      const compressedUrl = await compressImage(file, 800, 0.85);
      setModalAvatarPreview(compressedUrl);
      setCustomAvatar(compressedUrl);
      try {
        const uploadUrl = await uploadFileToNest(file, file.name || "avatar.jpg");
        if (uploadUrl && typeof uploadUrl === "string") {
          setCustomAvatar(uploadUrl);
          setModalAvatarPreview(uploadUrl);
        }
      } catch {}
      toast.success(isEn ? "Avatar selected" : "Đã chọn ảnh đại diện mới");
    } catch {
      toast.error(isEn ? "Failed to process image" : "Lỗi xử lý hình ảnh");
    } finally {
      setUploadingModalAvatar(false);
    }
  };

  const [privacyDirectMsg, setPrivacyDirectMsg] = useState(true);
  const [privacyShowPhone, setPrivacyShowPhone] = useState(true);
  const [privacyDirectory, setPrivacyDirectory] = useState(true);

  const isEn = lang === "en";

  const handleCopyCode = () => {
    if (!member?.code) return;
    navigator.clipboard.writeText(member.code);
    setCopied(true);
    toast.success(isEn ? "Member code copied!" : "Đã sao chép mã hội viên!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const isLiked = !prev[postId];
      setPostLikes((likes) => ({
        ...likes,
        [postId]: (likes[postId] || 0) + (isLiked ? 1 : -1),
      }));
      return { ...prev, [postId]: isLiked };
    });
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: profileName || member?.name || "Hội viên CLB CEO 1983",
          text: `Danh thiếp số và hồ sơ hội viên ${profileName || member?.name} - CLB Doanh Nhân CEO 1983`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(isEn ? "Profile link copied!" : "Đã sao chép liên kết trang cá nhân!");
    }
  };

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postImagePreview) {
      toast.error(isEn ? "Please enter post content or attach a photo" : "Vui lòng nhập nội dung bài viết hoặc đính kèm ảnh");
      return;
    }

    setIsPublishing(true);
    let uploadedImageUrl = postImagePreview;

    if (postImageFile) {
      try {
        uploadedImageUrl = await uploadFileToNest(postImageFile, postImageFile.name);
      } catch {
        // Fallback to preview data url if upload encounters transient network issue
      }
    }

    const newPost: UserPost = {
      id: `post-${Date.now()}`,
      authorName: profileName || member?.name || user?.name || "Hội viên CLB CEO 1983",
      authorAvatar: resolvedAvatar,
      time: isEn ? "Just now" : "Vừa xong",
      content: postContent.trim(),
      imageUrl: uploadedImageUrl,
      privacy: postPrivacy,
      taggedFriends: [...taggedFriends],
      likes: 0,
    };

    const updated = [newPost, ...userPosts];
    setUserPosts(updated);
    try {
      localStorage.setItem("vba_user_posts", JSON.stringify(updated));
    } catch {}

    if (taggedFriends.length > 0) {
      toast.success(
        isEn
          ? `Post published! Tagged friends (${taggedFriends.join(", ")}) received notification.`
          : `Đã đăng bài thành công! Bạn bè được tag (${taggedFriends.join(", ")}) đã nhận được thông báo.`
      );
    } else {
      toast.success(isEn ? "Post published successfully!" : "Đã đăng bài viết thành công!");
    }

    setPostContent("");
    setPostImageFile(null);
    setPostImagePreview(null);
    setTaggedFriends([]);
    setPostPrivacy("public");
    setIsPublishing(false);
    setCreatePostOpen(false);
  };

  const menu = [
    {
      label: isEn ? "Digital Business Cards" : "Quản lý Danh thiếp số",
      icon: Building2,
      to: "/association/business-cards" as const,
      desc: isEn ? "Design & share electronic business card" : "Thiết kế & chia sẻ danh thiếp số cá nhân",
    },
    {
      label: isEn ? "CEO 1983 Member Directory" : "Danh bạ hội viên CLB",
      icon: Users,
      to: "/association/members" as const,
      desc: isEn ? "Search & connect with CEO 1983 members" : "Tìm kiếm & kết nối hội viên CEO 1983",
    },
    {
      label: isEn ? "B2B Trade Opportunities" : "Cơ hội giao thương B2B",
      icon: Sparkles,
      to: "/association/opportunities" as const,
      desc: isEn ? "Commercial supply, demand & investment" : "Nhu cầu mua, bán & hợp tác đầu tư",
    },
    {
      label: isEn ? "Product Showcase" : "Gian hàng sản phẩm",
      icon: Package,
      to: "/association/products" as const,
      desc: isEn ? "Showcase enterprise products & services" : "Showcase sản phẩm & dịch vụ doanh nghiệp",
    },
    {
      label: isEn ? "History & Check-in" : "Lịch sử kết nối & Check-in",
      icon: History,
      to: "/association/history" as const,
      desc: isEn ? "Trading log & event participation" : "Nhật ký giao thương & tham gia sự kiện",
    },
    {
      label: isEn ? "Notifications & Invites" : "Thông báo & Lời mời",
      icon: Bell,
      to: "/association/notifications" as const,
      desc: isEn ? "Messages & connection approvals" : "Cập nhật tin nhắn & phê duyệt kết nối",
    },
    {
      label: isEn ? "User Guide & Manual (PDF/Word)" : "Hướng dẫn sử dụng App Doanh Nhân",
      icon: BookOpen,
      onClick: () => setUserGuideOpen(true),
      desc: isEn ? "Feature manual, demo workflows & document downloads" : "Cẩm nang tính năng, ảnh demo & tải tài liệu PDF/Word",
    },
    {
      label: isEn ? "Secretariat & Support Contact" : "Liên hệ Ban Thư Ký CLB CEO 1983",
      icon: Headphones,
      onClick: () => setContactSupportOpen(true),
      desc: isEn ? "Hotline, Zalo OA & support inquiry" : "Hotline, Tổng đài, Zalo OA & gửi yêu cầu hỗ trợ",
    },
    {
      label: isEn ? "Privacy & QR Visibility" : "Quyền riêng tư & Hiển thị khi quét QR",
      icon: ShieldCheck,
      onClick: () => setPrivacyModalOpen(true),
      desc: isEn ? "Manage visible fields when others scan your QR" : "Chọn thông tin (SĐT, Email, Địa chỉ) hiển thị khi người khác quét QR",
    },
    {
      label: isEn ? "Security & Account Settings" : "Bảo mật & Cài đặt tài khoản",
      icon: Cog,
      to: "/association/settings" as const,
      desc: isEn ? "Change password, active sessions & security" : "Đổi mật khẩu, phiên đăng nhập & bảo mật",
    },
  ];

  const themeOptions: { mode: Theme; icon: typeof Sun; label: string; desc: string }[] = [
    { mode: "light", icon: Sun, label: isEn ? "Light" : "Sáng", desc: isEn ? "Crisp, clean" : "Tươi sáng, tinh tế" },
    { mode: "dark", icon: Moon, label: isEn ? "Dark" : "Tối", desc: isEn ? "Luxury, sleek" : "Sang trọng, dịu mắt" },
    { mode: "contrast", icon: Contrast, label: isEn ? "Contrast" : "Tương phản", desc: isEn ? "High contrast" : "Độ tương phản cao" },
  ];

  async function logout() {
    await signOutSession();
    authLogout?.();
    navigate({ to: "/association/login" as any, replace: true });
  }

  const handleAvatarLoadError = () => {
    setAvatarError(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("vba_member_avatar_photo");
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("vba_custom_profile_")) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.avatar) {
                delete parsed.avatar;
                localStorage.setItem(key, JSON.stringify(parsed));
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }
  };

  const rawCurrentAvatar =
    (!isDeadAvatar(customAvatar) ? customAvatar : null) ||
    (!isDeadAvatar(member?.avatar) ? member?.avatar : null) ||
    (!isDeadAvatar((member as any)?.avatarUrl) ? (member as any)?.avatarUrl : null) ||
    (!isDeadAvatar((user as any)?.avatar_url) ? (user as any)?.avatar_url : null) ||
    (!isDeadAvatar((user as any)?.user_metadata?.avatar_url) ? (user as any)?.user_metadata?.avatar_url : null) ||
    null;
  const resolvedAvatar = rawCurrentAvatar && !isDeadAvatar(rawCurrentAvatar)
    ? (resolveMediaUrl(rawCurrentAvatar) || rawCurrentAvatar)
    : null;

  type FriendItem = {
    code: string;
    name: string;
    title: string;
    company: string;
    avatar: string | null;
  };

  // Real CEO 1983 active members who are CONNECTED with the current user
  const friendsList: FriendItem[] = useMemo(() => {
    const connectedKeys = new Set<string>();
    for (const c of conversations) {
      if (c.isConnected || c.connectionStatus === "accepted") {
        if (c.peerCode) connectedKeys.add(c.peerCode.toLowerCase());
        if (c.userId) connectedKeys.add(c.userId.toLowerCase());
      }
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("vba_connected_peers");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((k) => connectedKeys.add(String(k).toLowerCase()));
          }
        }
      } catch {
        /* ignore */
      }
    }

    return ((realMembers || []) as DirectoryMember[])
      .filter((m: DirectoryMember) => {
        // Exclude current user themself
        if (member?.code && m.code.toLowerCase() === member.code.toLowerCase()) return false;
        if (m.userId && user?.id && m.userId.toLowerCase() === user.id.toLowerCase()) return false;
        // Only include if connected
        const matchCode = m.code && connectedKeys.has(m.code.toLowerCase());
        const matchUserId = m.userId && connectedKeys.has(m.userId.toLowerCase());
        return Boolean(matchCode || matchUserId);
      })
      .map((m: DirectoryMember) => ({
        code: m.code,
        name: m.personName || m.name,
        title: m.personTitle || m.industry || "Hội viên CEO 1983",
        company: m.name !== m.personName ? m.name : "CLB Doanh Nhân CEO 1983",
        avatar: m.avatar && !isDeadAvatar(m.avatar) ? resolveMediaUrl(m.avatar) || m.avatar : null,
      }));
  }, [realMembers, conversations, member?.code, user?.id]);

  return (
    <div className="vba-animate min-h-full pb-28 text-slate-900 dark:text-white">
      <MemberHeader
        title={isEn ? "Profile & Administration" : "Trang Cá Nhân & Quản Trị"}
        back
        right={
          <Link
            to="/association/settings"
            aria-label={isEn ? "Account settings" : "Cài đặt tài khoản"}
            className="text-[#2E3192] dark:text-amber-400 hover:text-[#19194D] p-1"
          >
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      {/* ── COLLAPSIBLE FACEBOOK PROFILE (BỎ NỀN ĐEN, THEME SÁNG TRANG NHÃ) ── */}
      <div className="mx-4 mt-3.5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs transition-all duration-300">
        {/* Header Bar that triggers collapse / expand */}
        <button
          type="button"
          onClick={() => setProfileExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-amber-50/50 dark:hover:bg-slate-800/50 cursor-pointer"
          aria-expanded={profileExpanded}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              {resolvedAvatar && !avatarError && !isDeadAvatar(resolvedAvatar) ? (
                <img
                  src={resolvedAvatar}
                  alt={member?.name ?? ""}
                  onError={handleAvatarLoadError}
                  className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-xs bg-slate-100 dark:bg-slate-800"
                />
              ) : (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-[16px] font-black text-white shadow-xs">
                  {initials(profileName || member?.name)}
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
                  {profileName || resolvedDisplayName}
                </span>
                <BadgeCheck className="h-4 w-4 shrink-0 text-amber-500" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {member?.title || profileTitle || "Hội viên chính thức CLB CEO 1983"}
                </span>
                <span className="rounded bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {member?.code || "M1983-007"}
                </span>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[11px] font-semibold text-[#2E3192] dark:text-amber-400 hidden sm:inline">
              {profileExpanded ? (isEn ? "Collapse" : "Thu gọn") : (isEn ? "View Profile" : "Xem profile")}
            </span>
            <div
              className={`grid h-8 w-8 place-items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-transform duration-300 ${
                profileExpanded ? "rotate-180 bg-blue-50 dark:bg-blue-950 border-amber-400 text-[#2E3192] dark:text-amber-400" : ""
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </button>

        {/* Hidden inputs for cover photo and avatar upload */}
        <input
          ref={coverInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleCoverChange}
        />
        <input
          ref={avatarInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleAvatarChange}
        />

        {/* Expanded Profile Body (Chuẩn Facebook Profile) */}
        {profileExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 animate-in fade-in-50 duration-200">
            {/* 1. Ảnh bìa toàn cảnh (Facebook Cover Photo) */}
            <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-r from-[#0A1A3A] via-[#003B95] to-[#0A1A3A]">
              {coverPhoto && !coverError && !isDeadCover(coverPhoto) ? (
                <img
                  src={resolveMediaUrl(coverPhoto) || coverPhoto}
                  alt="Ảnh bìa trang cá nhân"
                  onError={() => {
                    setCoverError(true);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.removeItem("vba_member_cover_photo");
                      } catch {}
                    }
                  }}
                  className="h-full w-full object-cover opacity-90"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-[#0A1A3A] via-[#003B95] to-[#0A1A3A] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative flex flex-col items-center gap-1 text-center px-4">
                    <span className="text-amber-400/90 text-[11px] font-extrabold tracking-widest uppercase">
                      CLB DOANH NHÂN CEO 1983
                    </span>
                    <span className="text-white/70 text-[10.5px]">
                      Văn Phòng Số Cá Nhân &amp; Không Gian Kết Nối Giao Thương
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Nút Đổi ảnh bìa — Nút xanh chuẩn CEO, chữ trắng, viền trắng rõ nét */}
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-[#2E3192] hover:bg-[#19194D] text-white font-bold backdrop-blur-md px-3 py-1.5 text-[11px] border-2 border-white shadow-lg cursor-pointer transition active:scale-95 z-10"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
                <span className="text-white font-bold">{uploadingCover ? (isEn ? "Uploading..." : "Đang tải...") : (isEn ? "Edit Cover" : "Đổi ảnh bìa")}</span>
              </button>
            </div>

            {/* 2. Avatar đè lên ảnh bìa & Thông tin cá nhân */}
            <div className="px-4 pb-4">
              <div className="relative flex items-end justify-between -mt-12 mb-3">
                <div className="relative">
                  {resolvedAvatar && !avatarError && !isDeadAvatar(resolvedAvatar) ? (
                    <img
                      src={resolvedAvatar}
                      alt={member?.name ?? ""}
                      onError={handleAvatarLoadError}
                      className="h-22 w-22 rounded-2xl object-cover ring-4 ring-amber-500/80 shadow-lg bg-slate-100 dark:bg-[#14223E]"
                    />
                  ) : (
                    <span className="grid h-22 w-22 place-items-center rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#1E40AF] text-[26px] font-black text-amber-300 ring-4 ring-amber-500/80 shadow-lg">
                      {initials(profileName || member?.name)}
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#2E3192] text-white shadow-md border-2 border-white hover:bg-[#19194D] cursor-pointer transition-colors"
                    title={isEn ? "Change avatar" : "Đổi ảnh đại diện"}
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pb-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 dark:bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-[10.5px] font-bold text-amber-700 dark:text-amber-300 shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                    {isEn ? "VIP MEMBER" : "HỘI VIÊN CHÍNH THỨC"}
                  </span>
                </div>
              </div>

              {/* Tên & Doanh nghiệp */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {profileName || resolvedDisplayName}
                  </h2>
                  <BadgeCheck className="h-5 w-5 text-amber-500 shrink-0" />
                </div>
                <p className="text-[13px] font-bold text-[#2E3192] dark:text-amber-400 mt-0.5">
                  {member?.title || profileTitle || "Hội viên chính thức CLB Doanh Nhân CEO 1983"}
                </p>

                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  "Tiên phong kiến tạo giải pháp chuyển đổi số & kết nối giao thương thông minh cho cộng đồng doanh nghiệp Việt Nam."
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Hà Nội, Việt Nam
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {isEn ? "Joined 2023" : "Gia nhập từ 2023"}
                  </span>
                  {member?.code && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                    >
                      <span>{member.code}</span>
                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Action Buttons Row: đồng bộ phong cách, không in đậm khi chưa bấm */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    initProfileFields(true);
                    setEditProfileOpen(true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50/50 dark:bg-[#14223E] hover:bg-blue-100/60 dark:hover:bg-[#1A2D52] py-2.5 text-slate-800 dark:text-slate-200 transition border border-[#2E3192]/20 dark:border-blue-900/40 hover:border-[#2E3192]/50 cursor-pointer shadow-xs"
                >
                  <Edit3 className="h-4 w-4 text-[#2E3192] dark:text-blue-400" />
                  <span className="text-[10.5px] font-semibold">{isEn ? "Edit" : "Cập nhật"}</span>
                </button>

                <Link
                  to="/association/card"
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50/50 dark:bg-[#14223E] hover:bg-blue-100/60 dark:hover:bg-[#1A2D52] py-2.5 text-slate-800 dark:text-slate-200 transition border border-[#2E3192]/20 dark:border-blue-900/40 hover:border-[#2E3192]/50 cursor-pointer shadow-xs"
                >
                  <QrCode className="h-4 w-4 text-[#2E3192] dark:text-blue-400" />
                  <span className="text-[10.5px] font-semibold">{isEn ? "VIP Card" : "Thẻ 83"}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setNfcModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50/50 dark:bg-[#14223E] hover:bg-blue-100/60 dark:hover:bg-[#1A2D52] py-2.5 text-slate-800 dark:text-slate-200 transition border border-[#2E3192]/20 dark:border-blue-900/40 hover:border-[#2E3192]/50 cursor-pointer shadow-xs"
                >
                  <Nfc className="h-4 w-4 text-[#2E3192] dark:text-blue-400" />
                  <span className="text-[10.5px] font-semibold">{isEn ? "Tap NFC" : "Chạm NFC"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-50/50 dark:bg-[#14223E] hover:bg-blue-100/60 dark:hover:bg-[#1A2D52] py-2.5 text-slate-800 dark:text-slate-200 transition border border-[#2E3192]/20 dark:border-blue-900/40 hover:border-[#2E3192]/50 cursor-pointer shadow-xs"
                >
                  <Share2 className="h-4 w-4 text-[#2E3192] dark:text-blue-400" />
                  <span className="text-[10.5px] font-semibold">{isEn ? "Share" : "Chia sẻ"}</span>
                </button>
              </div>

              {/* 4. Facebook Profile Tabs Navigation */}
              <div className="mt-5 flex border-b border-slate-200 dark:border-slate-800">
                {[
                  { id: "about" as const, label: isEn ? "About" : "Giới thiệu" },
                  { id: "friends" as const, label: `${isEn ? "Members" : "Hội viên"} (${friendsList.length})` },
                  { id: "posts" as const, label: isEn ? "Posts & Feed" : "Bài viết" },
                  { id: "photos" as const, label: isEn ? "Photos" : "Hình ảnh" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 text-center text-xs font-bold transition-all border-b-2 -mb-[1px] cursor-pointer ${
                      activeTab === tab.id
                        ? "border-[#2E3192] text-[#2E3192] dark:border-amber-400 dark:text-amber-400"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 5. Tab Content: Giới thiệu & Liên kết mạng xã hội (Đã xóa doanh nghiệp theo yêu cầu) */}
              {activeTab === "about" && (
                <div className="mt-3.5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  {/* Facebook Link */}
                  <a
                    href="https://facebook.com/ceo1983.official"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#2E3192] text-white font-black text-xs">
                        f
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#2E3192] dark:group-hover:text-amber-400">
                        Facebook: facebook.com/ceo1983.official
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#2E3192] dark:group-hover:text-amber-400" />
                  </a>

                  {/* Website Link */}
                  <a
                    href="https://ceo1983.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-5 w-5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#2E3192] dark:group-hover:text-amber-400">
                        Website: https://ceo1983.vn
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#2E3192] dark:group-hover:text-amber-400" />
                  </a>

                  {/* Zalo / LinkedIn */}
                  <a
                    href="https://zalo.me/0988123456"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="h-5 w-5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-[#2E3192] dark:group-hover:text-amber-400">
                        Zalo / LinkedIn: zalo.me/0988123456
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-[#2E3192] dark:group-hover:text-amber-400" />
                  </a>

                  {/* Hotline */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <Phone className="h-5 w-5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                    <span>
                      <strong>Hotline liên hệ:</strong> {member?.phone || "0988 123 456"}
                    </span>
                  </div>

                  {/* Trụ sở */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <MapPin className="h-5 w-5 text-[#2E3192] dark:text-amber-400 shrink-0" />
                    <span className="truncate">
                      <strong>{isEn ? "HQ Address:" : "Trụ sở:"}</strong> Tòa nhà CEO Tower, Phạm Hùng, Nam Từ Liêm, Hà Nội
                    </span>
                  </div>
                </div>
              )}

              {/* 6. Tab Content: Bạn bè / Hội viên kết nối từ CRM */}
              {activeTab === "friends" && (
                <div className="mt-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {friendsList.length} {isEn ? "Connected Members" : "Hội viên đã kết nối"}
                    </span>
                    <Link to="/association/members" className="text-[#2E3192] dark:text-amber-400 font-semibold hover:underline">
                      {isEn ? "Explore all members" : "Khám phá danh bạ"}
                    </Link>
                  </div>
                  {friendsList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2E3192] dark:text-amber-400 grid place-items-center mx-auto">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                        {isEn ? "No connected members yet" : "Chưa có hội viên kết nối"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {isEn
                          ? "You haven't connected with any members yet. Browse the member directory to connect and trade."
                          : "Bạn chưa kết nối giao thương với hội viên nào. Hãy gửi lời mời kết nối trong Danh bạ để mở rộng mạng lưới kinh doanh."}
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/association/members"
                          style={{ color: "#ffffff" }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E3192] hover:bg-[#19194D] px-4 py-2 text-[11.5px] font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Users2 className="h-3.5 w-3.5" />
                          <span>{isEn ? "Browse Directory" : "Khám phá Danh bạ hội viên"}</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {friendsList.map((f, i) => (
                        <div
                          key={f.code || i}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-850/60 hover:border-[#2E3192]/40 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {f.avatar && !isDeadAvatar(f.avatar) ? (
                              <img
                                src={f.avatar}
                                alt={f.name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                                className="h-10 w-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-white font-bold text-xs grid place-items-center shrink-0 shadow-xs">
                                {initials(f.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11.5px] font-bold text-slate-900 dark:text-white truncate">
                                {f.name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {f.title}
                              </p>
                              <p className="text-[9.5px] text-[#2E3192] dark:text-amber-400 truncate font-semibold">
                                {f.company}
                              </p>
                            </div>
                          </div>
                          <Link
                            to="/association/messages"
                            search={{ peerCode: f.code }}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-[#2E3192] hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="Gửi tin nhắn"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Tab Content: Bài viết & Hoạt động (Có nút Đăng bài viết + Modal Đăng bài) */}
              {activeTab === "posts" && (
                <div className="mt-3.5 space-y-3">
                  {/* Nút Đăng Bài Viết Nổi Bật */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-2xl bg-[#2E3192] text-white grid place-items-center font-bold text-xs shrink-0">
                        {initials(member?.name)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCreatePostOpen(true)}
                        className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-left text-xs text-slate-500 dark:text-slate-400 hover:border-amber-500 transition shadow-2xs cursor-pointer"
                      >
                        {isEn ? "Share a business update or deal..." : "Bạn đang nghĩ gì? Chia sẻ cơ hội với CLB..."}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCreatePostOpen(true)}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          <ImagePlus className="h-4 w-4" />
                          <span>{isEn ? "Photo / Video" : "Hình ảnh"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatePostOpen(true);
                            setTagPickerOpen(true);
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <Tag className="h-4 w-4" />
                          <span>{isEn ? "Tag Friends" : "Gắn thẻ bạn bè"}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCreatePostOpen(true)}
                        className="rounded-xl bg-[#2E3192] hover:bg-[#19194D] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        {isEn ? "Post" : "Đăng bài"}
                      </button>
                    </div>
                  </div>

                  {/* Posts List */}
                  {userPosts.map((post) => {
                    const isLiked = likedPosts[post.id];
                    const likeCount = (postLikes[post.id] ?? post.likes) + (isLiked ? 1 : 0);
                    return (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-[#0F172A] space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-white grid place-items-center font-bold text-xs shrink-0 overflow-hidden">
                              {post.authorAvatar && !isDeadAvatar(post.authorAvatar) ? (
                                <img
                                  src={post.authorAvatar}
                                  alt=""
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                initials(post.authorName)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {post.authorName}
                                </span>
                                {post.taggedFriends && post.taggedFriends.length > 0 && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    cùng với{" "}
                                    <strong className="text-[#2E3192] dark:text-amber-400 font-semibold">
                                      {post.taggedFriends.join(", ")}
                                    </strong>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-0.5">
                                <span>{post.time}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  {post.privacy === "public" ? (
                                    <>
                                      <Globe2 className="h-3 w-3" />
                                      <span>Mọi người</span>
                                    </>
                                  ) : post.privacy === "friends" ? (
                                    <>
                                      <Users2 className="h-3 w-3" />
                                      <span>Bạn bè</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      <span>Chỉ mình tôi</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-[12.5px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {/* Image */}
                        {post.imageUrl && (
                          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 max-h-72">
                            <img
                              src={resolveMediaUrl(post.imageUrl) || post.imageUrl}
                              alt="Ảnh đính kèm"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Interaction Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] text-slate-500">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 font-semibold cursor-pointer transition ${
                              isLiked ? "text-[#2E3192] dark:text-amber-400" : "hover:text-[#2E3192] dark:hover:text-amber-400"
                            }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-[#2E3192] dark:fill-amber-400" : ""}`} />
                            <span>{likeCount} Thích</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info("Tính năng bình luận đang được tối ưu")}
                            className="flex items-center gap-1.5 font-semibold hover:text-[#2E3192] dark:hover:text-amber-400 cursor-pointer"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Bình luận</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-1.5 font-semibold hover:text-[#2E3192] dark:hover:text-amber-400 cursor-pointer"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Chia sẻ</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 8. Tab Content: Hình ảnh (Photos) */}
              {activeTab === "photos" && (
                <div className="mt-3.5 grid grid-cols-3 gap-1.5">
                  {[heroImg, eventImg, heroImg, eventImg, heroImg, eventImg].map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img src={img} alt="" className="h-full w-full object-cover hover:scale-105 transition duration-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── NAVIGATION MENU (Phân hệ chức năng) ── */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {isEn ? "Functional Modules" : "Phân hệ chức năng"}
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xs">
          {menu.map((m: any) => {
            const Icon = m.icon;
            if (m.onClick) {
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={m.onClick}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-amber-50/50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 dark:bg-[#14223E] text-[#2E3192] dark:text-amber-400 border border-blue-100 dark:border-blue-900/40">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {m.label}
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400">{m.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </button>
              );
            }
            return (
              <Link
                key={m.label}
                to={m.to}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-amber-50/50 dark:hover:bg-slate-800/60"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50/80 dark:bg-[#14223E] text-[#2E3192] dark:text-amber-400 border border-blue-100 dark:border-blue-900/40">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                    {m.label}
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">{m.desc}</div>
                </div>
                {m.hasAddAction && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      void navigate({
                        to: "/association/business-cards",
                        search: { tab: "cards", action: "create" },
                      });
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#2E3192] dark:text-blue-400 hover:bg-[#2E3192] hover:text-white transition-colors cursor-pointer mr-1 shrink-0"
                    title={isEn ? "Create new card" : "Tạo danh thiếp số mới"}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── THEME & APPEARANCE PICKER ── */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEn ? "Appearance & Theme" : "Giao diện & Chế độ màu"}
          </span>
          <span className="text-[11px] font-bold text-[#2E3192] dark:text-amber-400">
            {theme === "light" ? (isEn ? "Light" : "Sáng") : theme === "dark" ? (isEn ? "Dark" : "Tối") : (isEn ? "Contrast" : "Tương phản")}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setTheme(opt.mode)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all cursor-pointer border ${
                  active
                    ? "border-[#2E3192] dark:border-amber-500 bg-blue-50 dark:bg-[#14223E] shadow-md scale-[1.02]"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active
                      ? "bg-[#2E3192] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-[12px] font-bold text-slate-900 dark:text-white">
                  {opt.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LANGUAGE SELECTOR (Chuyển đổi ngôn ngữ hoạt động lập tức) ── */}
      <div className="mx-4 mt-6">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isEn ? "App Language (8 Languages)" : "Ngôn ngữ ứng dụng (8 Ngôn ngữ)"}
          </span>
          <span className="text-[11px] font-bold text-[#2E3192] dark:text-amber-400">
            {lang === "vi" ? "Tiếng Việt" : "English"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: "vi" as const, name: "Tiếng Việt", flag: "🇻🇳" },
            { code: "en" as const, name: "English", flag: "🇬🇧" },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                toast.success(l.code === "en" ? "Switched to English" : `Đã chuyển sang ${l.name}`);
              }}
              className={`flex items-center justify-between rounded-xl p-3 border text-xs font-semibold transition cursor-pointer ${
                lang === l.code
                  ? "border-[#2E3192] dark:border-amber-500 bg-blue-50 dark:bg-[#14223E] text-[#2E3192] dark:text-amber-300 shadow-xs font-bold"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{l.flag}</span>
                <span className="truncate">{l.name}</span>
              </span>
              {lang === l.code && <Check className="h-4 w-4 shrink-0 text-[#2E3192] dark:text-amber-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEASONAL FESTIVAL THEME SWITCH (Nút Bật / Tắt Chủ Đề Trung Thu) ── */}
      <div className="mx-4 mt-6 rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-[#14223E]/80 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <span className="text-xl select-none">🏮</span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEn ? "Mid-Autumn Festival Theme" : "Chủ đề Lễ hội Trung Thu"}</span>
                {eventThemeEnabled ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#EA580C] text-white">
                    {isEn ? "Active" : "Đang bật"}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {isEn ? "Default Off" : "Đang tắt"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {eventThemeEnabled
                  ? (isEn ? "Displaying star lanterns, golden moon & festive decorations" : "Đang hiển thị đèn lồng ông sao, trăng rằm & hiệu ứng lễ hội")
                  : (isEn ? "Standard CEO 1983 Classic Navy & Gold executive styling" : "Giao diện Doanh nhân Chuẩn CEO 1983 (Classic Navy & Gold)")}
              </p>
            </div>
          </div>

          {/* Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={eventThemeEnabled}
            onClick={() => {
              const next = !eventThemeEnabled;
              setEventThemeEnabled(next);
              setEventThemeState(next);
              toast.success(
                next
                  ? (isEn ? "Festival Theme Activated! 🏮🥮" : "Đã kích hoạt Chủ đề Lễ hội Trung Thu! 🏮🥮")
                  : (isEn ? "Switched to Standard CEO 1983 Theme" : "Đã chuyển về Giao diện Chuẩn CEO 1983")
              );
            }}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              eventThemeEnabled ? "bg-[#EA580C]" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                eventThemeEnabled ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── TRỢ LÝ ĐIỀU KHIỂN GIỌNG NÓI AI (VOICE AI NAVIGATION ASSISTANT SWITCH) ── */}
      <div className="mx-4 mt-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-[#0f1d38]/80 dark:to-[#16203a]/80 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isEn ? "AI Voice Assistant" : "Trợ lý Điều khiển Giọng nói AI"}</span>
                {voiceAiEnabled ? (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-600 text-white">
                    {isEn ? "Active" : "Đang bật"}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {isEn ? "Disabled" : "Đang tắt"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                {voiceAiEnabled
                  ? (isEn ? "Robot icon floating on screen to navigate by voice command" : "Hiển thị Robot thông minh trên màn hình để ra lệnh mở các danh mục")
                  : (isEn ? "Voice AI assistant is hidden" : "Đang ẩn robot trợ lý giọng nói")}
              </p>
            </div>
          </div>

          {/* Switch Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={voiceAiEnabled}
            onClick={() => {
              const next = !voiceAiEnabled;
              setVoiceAiState(next);
              setVoiceAiEnabled(next);
              toast.success(
                next
                  ? (isEn ? "AI Voice Assistant Activated! 🤖" : "Đã bật Trợ lý Giọng nói AI! 🤖")
                  : (isEn ? "AI Voice Assistant Disabled" : "Đã tắt Trợ lý Giọng nói AI")
              );
            }}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              voiceAiEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                voiceAiEnabled ? "translate-x-5.5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── SUPPORT & LOGOUT ── */}
      <div className="mx-4 mt-6 space-y-2.5">

        <Link
          to="/install"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-white dark:bg-[#0F172A] py-3 text-[13px] font-bold text-[#2E3192] dark:text-amber-400 shadow-xs transition hover:bg-amber-50 dark:hover:bg-[#14223E]"
        >
          {isEn ? "📲 Install App to Home Screen" : "📲 Cài đặt ứng dụng lên màn hình chính"}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white bg-[#2E3192] hover:bg-[#19194D] active:scale-[0.99] transition-all cursor-pointer shadow-md"
        >
          <LogOut className="h-4 w-4 text-white" /> {isEn ? "Sign out" : "Đăng xuất tài khoản"}
        </button>
      </div>

      {/* ── INTERACTIVE NFC TOUCH MODAL ── */}
      {nfcModalOpen && (
        <Dialog open={nfcModalOpen} onOpenChange={setNfcModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-900 p-6 text-center text-slate-900 dark:text-white shadow-2xl !gap-0 [&>button]:hidden">
            <button
              onClick={() => setNfcModalOpen(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Radiant NFC Wave Animation */}
            <div className="relative mx-auto my-4 grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping duration-1000" />
              <span className="absolute inset-2 rounded-full bg-amber-500/30 animate-pulse" />
              <div className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#0A1A3A] text-white shadow-lg shadow-blue-900/30 border border-amber-500/30">
                <Nfc className="h-9 w-9 text-amber-400" />
              </div>
            </div>

            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              {isEn ? "Tap NFC Card / Device" : "Chạm Thẻ NFC / Điện Thoại"}
            </DialogTitle>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              {isEn
                ? "Hold your phone near the smart NFC card or partner's device to instantly exchange digital business cards."
                : "Đặt mặt lưng điện thoại sát thẻ thông minh NFC hoặc thiết bị của đối tác để trao đổi danh thiếp ngay lập tức."}
            </p>

            <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 p-3 text-left space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 text-[#2E3192] dark:text-amber-300 font-semibold">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>{isEn ? "Direct B2B Contact Exchange" : "Trao đổi liên hệ B2B trực tiếp"}</span>
              </div>
              <div className="flex items-center gap-2 text-[#2E3192] dark:text-amber-300 font-semibold">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>{isEn ? "Automatic Association CRM Sync" : "Tự động đồng bộ CRM Hiệp hội"}</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  toast.success(isEn ? "NFC ready! Place card near phone." : "NFC đã sẵn sàng! Vui lòng chạm thẻ.");
                  setNfcModalOpen(false);
                }}
                className="w-full rounded-xl bg-[#2E3192] hover:bg-[#19194D] py-3 text-xs font-bold text-white shadow-md shadow-blue-900/20 active:scale-98 transition cursor-pointer"
              >
                {isEn ? "Simulate Tap Connect" : "Mô Phỏng Chạm Kết Nối"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── POPUP CẬP NHẬT HỒ SƠ & QUYỀN RIÊNG TƯ TRỰC TIẾP ── */}
      {editProfileOpen && (
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 !bg-white dark:!bg-slate-900 text-slate-900 dark:text-white shadow-2xl p-0 overflow-hidden !gap-0 [&>button]:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50/80 dark:bg-[#14223E] text-[#2E3192] dark:text-amber-400 border border-blue-100 dark:border-blue-900/40">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white">
                    {isEn ? "Update Profile & Privacy" : "Cập Nhật Hồ Sơ & Quyền Riêng Tư"}
                  </DialogTitle>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    {isEn ? "Manage personal info, card & directory visibility" : "Quản lý thông tin cá nhân & hiển thị danh bạ hội viên"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body with Compact Center Width */}
            <form
              id="edit-profile-form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const updated = {
                    name: profileName,
                    title: profileTitle,
                    company: profileCompany,
                    phone: profilePhone,
                    email: profileEmail,
                    address: profileAddress,
                    website: profileWebsite,
                    bio: profileBio,
                    avatar: customAvatar,
                    privacyDirectMsg,
                    privacyShowPhone,
                    privacyDirectory,
                  };
                  localStorage.setItem("vba_custom_profile", JSON.stringify(updated));
                  localStorage.setItem(userProfileStorageKey, JSON.stringify(updated));
                  if (customAvatar) {
                    localStorage.setItem("vba_member_avatar_photo", customAvatar);
                  }

                  // Đồng bộ lưu trực tiếp lên cơ sở dữ liệu backend
                  try {
                    await updateProfileFn({
                      data: {
                        name: profileName,
                        title: profileTitle,
                        company: profileCompany,
                        phone: profilePhone,
                        email: profileEmail,
                        address: profileAddress,
                        website: profileWebsite,
                        bio: profileBio,
                        avatar: customAvatar,
                      },
                    });
                  } catch (apiErr) {
                    console.warn("Could not sync to backend directly:", apiErr);
                  }

                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("profile-updated"));
                  }
                  toast.success(isEn ? "Profile updated successfully!" : "Đã cập nhật hồ sơ hội viên thành công!");
                } catch {
                  toast.error(isEn ? "Update failed" : "Cập nhật thất bại");
                }
                setEditProfileOpen(false);
              }}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 w-full max-w-sm mx-auto space-y-3.5 [scrollbar-width:thin]"
            >
              {/* Ảnh đại diện trong Modal */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative">
                  {modalAvatarPreview || (customAvatar && !isDeadAvatar(customAvatar) && !avatarError) || (resolvedAvatar && !isDeadAvatar(resolvedAvatar) && !avatarError) ? (
                    <img
                      src={modalAvatarPreview || customAvatar || resolvedAvatar || ""}
                      alt=""
                      onError={handleAvatarLoadError}
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-amber-500/80 shadow-md bg-slate-100 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#1E40AF] text-2xl font-black text-amber-300 ring-2 ring-amber-500/80 shadow-md">
                      {initials(profileName || resolvedDisplayName)}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={uploadingModalAvatar}
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#2E3192] text-white shadow-md border-2 border-white hover:bg-[#19194D] cursor-pointer"
                    title={isEn ? "Change avatar" : "Đổi ảnh đại diện"}
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={modalAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleModalAvatarChange}
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {uploadingModalAvatar ? (isEn ? "Processing..." : "Đang xử lý...") : (isEn ? "Tap camera to change photo" : "Bấm máy ảnh để đổi ảnh đại diện")}
                </span>
              </div>
              {/* Họ và tên */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? "Full Name *" : "Họ và tên *"}
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                  style={{ outline: "none" }}
                />
              </div>

              {/* Chức danh & Công ty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Title / Position" : "Chức vụ / Vị trí"}
                  </label>
                  <input
                    type="text"
                    value={profileTitle}
                    onChange={(e) => setProfileTitle(e.target.value)}
                    placeholder="VD: Chủ tịch HĐQT, CEO..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Company / Enterprise" : "Doanh nghiệp / Công ty"}
                  </label>
                  <input
                    type="text"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    placeholder="VD: Công ty Cổ phần Tập đoàn CEO 1983"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
              </div>

              {/* Số điện thoại & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Phone Number" : "Số điện thoại"}
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="ceo@company.vn"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
              </div>

              {/* Địa chỉ & Website */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEn ? "Office Address" : "Địa chỉ trụ sở"}
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Số 123 Phố Trần Duy Hưng, Cầu Giấy, Hà Nội"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Website
                  </label>
                  <input
                    type="text"
                    value={profileWebsite}
                    onChange={(e) => setProfileWebsite(e.target.value)}
                    placeholder="https://company.vn"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none"
                    style={{ outline: "none" }}
                  />
                </div>
              </div>

              {/* Giới thiệu */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEn ? "Bio & Business Introduction" : "Giới thiệu bản thân & Doanh nghiệp"}
                </label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Giới thiệu tóm tắt về bản thân, kinh nghiệm và doanh nghiệp..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 shadow-none resize-none"
                  style={{ outline: "none" }}
                />
              </div>

              {/* Cấu hình quyền riêng tư */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 space-y-3">
                <div className="text-[11.5px] font-bold text-[#2E3192] dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#2E3192] dark:text-amber-400" />
                  {isEn ? "Privacy & Visibility Settings" : "Thiết lập quyền riêng tư & Kết nối"}
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="pr-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isEn ? "Allow direct messages from other members" : "Cho phép hội viên khác nhắn tin trực tiếp"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isEn ? "Receive business messages from CEO 1983 entrepreneurs" : "Nhận tin nhắn giao thương từ các hội viên trong CLB"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyDirectMsg}
                    onChange={(e) => setPrivacyDirectMsg(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2E3192] accent-[#2E3192] focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="pr-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isEn ? "Publicize contact phone number on directory" : "Công khai số điện thoại trên danh bạ"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isEn ? "Show your phone number to connected peers" : "Cho phép hội viên đã kết nối nhìn thấy số điện thoại"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyShowPhone}
                    onChange={(e) => setPrivacyShowPhone(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2E3192] accent-[#2E3192] focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="pr-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isEn ? "Show enterprise on public directory" : "Hiển thị doanh nghiệp trên danh bạ CLB"}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isEn ? "Appear in CEO 1983 member search results" : "Xuất hiện trong kết quả tìm kiếm đối tác & kết nối"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyDirectory}
                    onChange={(e) => setPrivacyDirectory(e.target.checked)}
                    className="h-4 w-4 rounded text-[#2E3192] accent-[#2E3192] focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

            </form>

            {/* Fixed Footer */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <button
                type="submit"
                form="edit-profile-form"
                className="w-full rounded-xl bg-[#2E3192] hover:bg-[#19194D] py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/20 active:scale-98 transition cursor-pointer"
              >
                {isEn ? "Save Profile & Privacy" : "Lưu Cập Nhật Hồ Sơ & Quyền Riêng Tư"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── CREATE POST COMPOSER MODAL (POST BÀI + GỬI LÊN MINIO + TAG BẠN BÈ + 3 CẤP PRIVACY) ── */}
      {createPostOpen && (
        <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-3xl !bg-white dark:!bg-[#0F172A] p-5 shadow-2xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden !gap-0 [&>button]:hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <DialogTitle className="text-sm font-extrabold uppercase tracking-wide text-[#2E3192] dark:text-amber-400">
                {isEn ? "Create New Post" : "Tạo bài viết mới"}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setCreatePostOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Author bar & 3-level Privacy Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#2E3192] to-[#19194D] text-white grid place-items-center font-bold text-xs shrink-0 overflow-hidden">
                  {resolvedAvatar && !avatarError && !isDeadAvatar(resolvedAvatar) ? (
                    <img src={resolvedAvatar} alt="" onError={handleAvatarLoadError} className="h-full w-full object-cover" />
                  ) : (
                    initials(member?.name)
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {profileName || resolvedDisplayName}
                  </p>
                  {/* Privacy Selector */}
                  <div className="relative inline-block mt-0.5">
                    <select
                      value={postPrivacy}
                      onChange={(e) => setPostPrivacy(e.target.value as any)}
                      className="rounded-lg bg-blue-50/80 dark:bg-[#14223E] border border-blue-200 dark:border-blue-800 text-[10.5px] font-bold text-[#2E3192] dark:text-amber-300 px-2 py-0.5 outline-none cursor-pointer"
                    >
                      <option value="public">🌐 {isEn ? "Public (Everyone)" : "Công khai (Mọi người)"}</option>
                      <option value="friends">👥 {isEn ? "Friends Only" : "Bạn bè trong CLB"}</option>
                      <option value="private">🔒 {isEn ? "Only Me" : "Chỉ mình tôi"}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Textarea */}
            <textarea
              rows={4}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={
                isEn
                  ? "What would you like to share with CEO 1983 entrepreneurs? Announce trade deals, services, or events..."
                  : "Bạn muốn chia sẻ điều gì với các doanh nhân CEO 1983? Đăng cơ hội hợp tác, giới thiệu năng lực..."
              }
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 resize-none leading-relaxed"
            />

            {/* Tagged Friends Chips */}
            {taggedFriends.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                  {isEn ? "Tagged Friends:" : "Bạn bè được gắn thẻ:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {taggedFriends.map((friend) => (
                    <span
                      key={friend}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-300"
                    >
                      <span>{friend}</span>
                      <button
                        type="button"
                        onClick={() => setTaggedFriends((prev) => prev.filter((f) => f !== friend))}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Image Preview */}
            {postImagePreview && (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 max-h-56">
                <img src={postImagePreview} alt="Xem trước" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPostImageFile(null);
                    setPostImagePreview(null);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Action Bar (Attach Photo + Tag Friends) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                {isEn ? "Add to your post:" : "Đính kèm vào bài viết:"}
              </span>
              <div className="flex items-center gap-2">
                {/* Photo upload */}
                <label className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 cursor-pointer transition">
                  <ImagePlus className="h-4.5 w-4.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPostImageFile(file);
                        const reader = new FileReader();
                        reader.onload = () => setPostImagePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {/* Tag friends trigger */}
                <button
                  type="button"
                  onClick={() => setTagPickerOpen((prev) => !prev)}
                  className={`grid h-8 w-8 place-items-center rounded-xl transition cursor-pointer ${
                    tagPickerOpen
                      ? "bg-[#2E3192] text-white"
                      : "bg-blue-50 text-[#2E3192] dark:bg-blue-950 dark:text-amber-400 hover:bg-blue-100"
                  }`}
                  title={isEn ? "Tag Friends" : "Gắn thẻ bạn bè"}
                >
                  <Tag className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Friends Selector Drawer / Picker */}
            {tagPickerOpen && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-[#14223E]/50 p-3 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    {isEn ? "Select Friends to Tag" : "Chọn bạn bè để gắn thẻ"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {taggedFriends.length} {isEn ? "selected" : "đã chọn"}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {friendsList.map((f) => {
                    const isTagged = taggedFriends.includes(f.name);
                    return (
                      <label
                        key={f.name}
                        className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {f.avatar ? (
                            <img src={f.avatar} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#2E3192] text-[10px] font-bold text-white shrink-0">
                              {initials(f.name)}
                            </span>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{f.name}</p>
                            <p className="text-[10px] text-slate-400">{f.company}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isTagged}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTaggedFriends((prev) => [...prev, f.name]);
                            } else {
                              setTaggedFriends((prev) => prev.filter((name) => name !== f.name));
                            }
                          }}
                          className="h-4 w-4 rounded text-[#2E3192] accent-[#2E3192] focus:ring-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Publish Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePublishPost}
                disabled={isPublishing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2E3192] hover:bg-[#19194D] py-3 text-xs font-bold text-white shadow-md shadow-blue-900/20 active:scale-98 transition cursor-pointer disabled:opacity-60"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isEn ? "Uploading & Publishing..." : "Đang tải ảnh lên MinIO & Đăng bài..."}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>{isEn ? "Publish Post Now" : "Đăng Bài Viết Ngay"}</span>
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODALS: HƯỚNG DẪN SỬ DỤNG VÀ LIÊN HỆ BAN THƯ KÝ & QUYỀN RIÊNG TƯ ── */}
      <UserGuideModal open={userGuideOpen} onClose={() => setUserGuideOpen(false)} />
      <ContactSupportModal open={contactSupportOpen} onClose={() => setContactSupportOpen(false)} />
      <PrivacySettingsModal open={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
    </div>
  );
}
