import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  ChevronRight,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";
import { fetchNestApi } from "@/lib/api-client";
import { MobilePage } from "@/components/business-connect/mobile/MobilePage";
import { BusinessConnectTopBar } from "@/components/business-connect/mobile/BusinessConnectTopBar";

export const Route = createFileRoute("/connect-app/me/security")({
  head: () => ({
    meta: [
      { title: "Tài khoản & Bảo mật — Business Connect" },
      {
        name: "description",
        content: "Quản lý bảo mật, mật khẩu và phiên đăng nhập tài khoản ViOne.",
      },
    ],
  }),
  component: ConnectAppSecurityPage,
});

function ConnectAppSecurityPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);

  // Form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      setLoading(true);
      try {
        const data = await fetchNestApi("/users/me");
        if (data && data.id) {
          setAccount(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin tài khoản:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadAccount();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetchNestApi("/users/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res && res.error) {
        toast.error(res.message || res.error || "Không thể đổi mật khẩu");
      } else {
        toast.success("Đổi mật khẩu tài khoản thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Đã xảy ra lỗi khi đổi mật khẩu");
    } finally {
      setPasswordSaving(false);
    }
  };

  const displayName =
    account?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Hội viên ViOne";
  const userEmail = account?.email || user?.email || "Chưa cập nhật";
  const username =
    account?.username || (user?.user_metadata as any)?.username || userEmail.split("@")[0];

  return (
    <MobilePage>
      <BusinessConnectTopBar
        title="Tài khoản & bảo mật"
        back
        onBack={() => navigate({ to: "/connect-app/me" })}
      />

      <div className="grid gap-4 pt-4">
        {/* Section 1: Thông tin tài khoản đăng nhập */}
        <section className="rounded-2xl bc-translucent-card p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(216,178,130,0.30)] bg-[rgba(216,178,130,0.12)] text-[#D8B282] shadow-xs">
              <User className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16px] font-bold text-[var(--bc-mobile-text)] truncate">
                {displayName}
              </h2>
              <p className="text-[12.5px] text-[var(--bc-mobile-muted)] truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#D8B282]" />
                {userEmail}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[rgba(216,178,130,0.15)] grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-xl bg-[var(--bc-mobile-surface)]/60 backdrop-blur-xs p-2.5 border border-[rgba(255,255,255,0.06)]">
              <span className="text-[var(--bc-mobile-muted)] block text-[11px]">Tên đăng nhập</span>
              <span className="font-semibold text-[var(--bc-mobile-text)] truncate block mt-0.5">
                @{username}
              </span>
            </div>
            <div className="rounded-xl bg-[var(--bc-mobile-surface)]/60 backdrop-blur-xs p-2.5 border border-[rgba(255,255,255,0.06)]">
              <span className="text-[var(--bc-mobile-muted)] block text-[11px]">Trạng thái</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Đang bảo vệ
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Đổi mật khẩu tài khoản */}
        <section className="rounded-2xl bc-translucent-card p-5 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4.5 w-4.5 text-[#D8B282]" strokeWidth={2} />
            <h2 className="text-[15px] font-bold text-[var(--bc-mobile-text)]">
              Đổi mật khẩu tài khoản
            </h2>
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--bc-mobile-muted)] mb-4">
            Để đảm bảo an toàn cho tài khoản và danh thiếp số của bạn, hãy sử dụng mật khẩu mạnh có
            ít nhất 6 ký tự.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--bc-mobile-muted)] mb-1">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  className="w-full h-11 rounded-xl bg-[var(--bc-mobile-surface)]/70 backdrop-blur-md border border-[rgba(216,178,130,0.20)] px-3 pr-10 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)]/60 focus:outline-none focus:border-[#D8B282] focus:ring-1 focus:ring-[#D8B282]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bc-mobile-muted)] hover:text-white"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--bc-mobile-muted)] mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full h-11 rounded-xl bg-[var(--bc-mobile-surface)]/70 backdrop-blur-md border border-[rgba(216,178,130,0.20)] px-3 pr-10 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)]/60 focus:outline-none focus:border-[#D8B282] focus:ring-1 focus:ring-[#D8B282]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bc-mobile-muted)] hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--bc-mobile-muted)] mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full h-11 rounded-xl bg-[var(--bc-mobile-surface)]/70 backdrop-blur-md border border-[rgba(216,178,130,0.20)] px-3 pr-10 text-[13.5px] text-[var(--bc-mobile-text)] placeholder:text-[var(--bc-mobile-muted)]/60 focus:outline-none focus:border-[#D8B282] focus:ring-1 focus:ring-[#D8B282]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--bc-mobile-muted)] hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-2 w-full h-11 rounded-full btn-luxury-gold flex items-center justify-center gap-2 text-[14px] font-bold shadow-md shadow-[#D8B282]/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {passwordSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu mật khẩu...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Cập nhật mật khẩu ngay
                </>
              )}
            </button>
          </form>
        </section>

        {/* Section 3: Phiên đăng nhập & Thiết bị */}
        <section className="rounded-2xl bc-translucent-card p-5 shadow-md">
          <h2 className="text-[15px] font-bold text-[var(--bc-mobile-text)] mb-1">
            Phiên đăng nhập & Thiết bị
          </h2>
          <p className="text-[12px] leading-relaxed text-[var(--bc-mobile-muted)] mb-3">
            Kiểm tra và ngắt các phiên đăng nhập lạ hoặc các thiết bị bạn không còn sử dụng.
          </p>

          <Link
            to="/connect-app/me/sessions"
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bc-mobile-surface)]/70 backdrop-blur-md border border-[rgba(216,178,130,0.20)] hover:border-[#D8B282]/50 hover:bg-[var(--bc-mobile-surface-2)]/80 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(216,178,130,0.12)] border border-[rgba(216,178,130,0.25)] text-[#D8B282]">
                <Smartphone className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <span className="font-semibold text-[13.5px] text-[var(--bc-mobile-text)] block">
                  Quản lý phiên đăng nhập
                </span>
                <span className="text-[11.5px] text-[var(--bc-mobile-muted)] block">
                  Xem danh sách thiết bị & ngắt kết nối từ xa
                </span>
              </div>
            </div>
            <ChevronRight className="h-4.5 w-4.5 text-[var(--bc-mobile-muted)] shrink-0" />
          </Link>
        </section>
      </div>
    </MobilePage>
  );
}
