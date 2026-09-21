import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  Bell,
  Sun,
  Moon,
  Contrast,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  Sparkles,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { getMyMember, type MyMember } from "@/lib/member-app.functions";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { signOutSession } from "@/lib/business-connect/mobile/auth-session";
import { fetchNestApi } from "@/lib/api-client";
import { isEventThemeEnabled, setEventThemeEnabled } from "@/components/member/SeasonalEventHeader";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/association/settings")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): {
    action?: string;
    required?: string;
  } => ({
    ...(typeof search.action === "string" ? { action: search.action } : {}),
    ...(typeof search.required === "string" ? { required: search.required } : {}),
  }),
  component: AssociationSettingsScreen,
});

function AssociationSettingsScreen() {
  const navigate = useNavigate();
  const { action, required } = Route.useSearch();
  const { logout: authLogout } = useAuth();
  const { theme, setTheme } = useTheme();
  const fetchMember = useServerFn(getMyMember);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null);

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Track if password was changed in the active session
  const [passwordChangedInSession, setPasswordChangedInSession] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("vba_password_changed_in_session") === "true";
  });

  // Account deactivation states
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Preferences states
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [eventThemeEnabled, setEventThemeEnabledState] = useState(isEventThemeEnabled());

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setPasswordLoading(true);
    try {
      try {
        await fetchNestApi("/users/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
      } catch (firstErr: any) {
        // Fallback to /auth/change-password if /users/change-password failed
        await fetchNestApi("/auth/change-password", {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
      }

      toast.success("✓ Đổi mật khẩu thành công! Quý hội viên vui lòng đăng nhập lại với mật khẩu mới.", {
        duration: 8000,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChangedInSession(true);
      try {
        sessionStorage.removeItem("vba_password_changed_in_session");
      } catch {}
      await signOutSession();
      authLogout?.();
      navigate({
        to: "/association/login" as any,
        search: { reset: "success" } as any,
        replace: true,
      });
      return;
    } catch (err: any) {
      toast.error(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeactivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeactivateLoading(true);
    try {
      await fetchNestApi("/users/deactivate", {
        method: "POST",
        body: JSON.stringify({ password: deactivatePassword }),
      });
      toast.info("Tài khoản đã được vô hiệu hóa thành công.");
      setDeactivateModalOpen(false);
      await signOutSession();
      authLogout?.();
      navigate({ to: "/association/login" as any, replace: true });
    } catch (err: any) {
      toast.error(err.message || "Không thể vô hiệu hóa tài khoản. Vui lòng kiểm tra lại mật khẩu.");
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!passwordChangedInSession) {
      toast.warning("Vui lòng đổi mật khẩu thành công ít nhất một lần để đảm bảo an toàn trước khi đăng xuất.");
      return;
    }
    await signOutSession();
    authLogout?.();
    navigate({ to: "/association/login" as any, replace: true });
  };

  return (
    <div className="vba-animate pb-28 min-h-screen bg-slate-50 dark:bg-[#070D1A] text-slate-900 dark:text-white">
      <MemberHeader
        title="Bảo mật & Cài đặt"
        subtitle="Hiệp hội Doanh nhân CEO 1983"
        back
      />

      <div className="mx-4 mt-4 space-y-4">
        {/* CEO 1983 Association Badge Header */}
        <div className="p-4 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-[#00224F] via-[#003B95] to-[#0A1A3A] text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-amber-400/60">
              <img src="/ceo1983-logo.png" alt="CEO 1983" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-amber-300">
                CLB DOANH NHÂN 1983
              </div>
              <h2 className="text-[16px] font-black text-white leading-snug truncate">
                {member?.name || "Hội viên Doanh nhân"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded bg-amber-400/20 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-300 border border-amber-400/40">
                  <ShieldCheck className="h-3 w-3 text-amber-300" /> {member?.code || "M1983-MEMBER"}
                </span>
                <span className="text-[11px] text-blue-100 truncate">
                  {member?.title || "Hội viên chính thức"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Change Password Section */}
        {required === "true" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3 shadow-md mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-[13px] text-amber-600 dark:text-amber-400 mb-0.5">
                Bảo Mật Bắt Buộc Cho Hội Viên Mới
              </strong>
              Bạn đang sử dụng mật khẩu khởi tạo từ hệ thống. Để bảo vệ dữ liệu hội viên và quyền riêng tư, bắt buộc đổi sang mật khẩu cá nhân mới của bạn. Sau khi đổi thành công, hệ thống sẽ tự động chuyển bạn ra màn hình đăng nhập để đăng nhập lại.
            </div>
          </div>
        )}

        <section id="password-section" className="p-4 rounded-2xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <Lock className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" /> Đổi mật khẩu tài khoản
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-[#003B95] dark:focus:border-amber-400 focus:ring-2 focus:ring-[#003B95]/20 transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-[#003B95] dark:focus:border-amber-400 focus:ring-2 focus:ring-[#003B95]/20 transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-[#003B95] dark:focus:border-amber-400 focus:ring-2 focus:ring-[#003B95]/20 transition"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#003B95] hover:bg-[#002B70] py-3 text-xs font-bold text-white shadow-md shadow-blue-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              style={{ color: "#ffffff" }}
            >
              {passwordLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <KeyRound className="h-3.5 w-3.5 text-white" />
              )}
              <span className="text-white font-bold">Cập nhật mật khẩu</span>
            </button>
          </form>
        </section>

        {/* 2. Theme Preferences */}
        <section className="p-4 rounded-2xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#003B95] dark:text-amber-400" /> Giao diện hiển thị
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: "light" as Theme, icon: Sun, label: "Sáng" },
              { mode: "dark" as Theme, icon: Moon, label: "Tối" },
              { mode: "contrast" as Theme, icon: Contrast, label: "Tương phản" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                  theme === mode
                    ? "border-[#003B95] dark:border-amber-500 bg-blue-50 dark:bg-amber-950/40 text-[#003B95] dark:text-amber-400 shadow-xs font-bold"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-[12px]">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Event Theme Feature: Tính năng sự kiện */}
        <section className="p-4 rounded-2xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
              <div>
                <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                  Tính năng sự kiện
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Bật / tắt hiệu ứng và chủ đề trang trí sự kiện (Trung thu, Lễ hội)
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={eventThemeEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEventThemeEnabledState(val);
                  setEventThemeEnabled(val);
                  toast.success(val ? "Đã bật tính năng sự kiện" : "Đã tắt tính năng sự kiện");
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003B95]"></div>
            </label>
          </div>
        </section>

        {/* 4. Notification Settings */}
        <section className="p-4 rounded-2xl bg-white dark:bg-[#131a27] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-[#003B95] dark:text-amber-400" />
              <div>
                <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                  Thông báo nợ phí & Cuộc họp
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nhận tin nhắn kèm mã VietQR và lịch họp trực tiếp
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifEnabled}
              onChange={(e) => {
                setNotifEnabled(e.target.checked);
                toast.success(e.target.checked ? "Đã bật thông báo" : "Đã tắt thông báo");
              }}
              className="h-5 w-5 accent-[#003B95] rounded cursor-pointer"
            />
          </div>
        </section>

        {/* 5. Account Deactivation Section */}
        <section className="p-4 rounded-2xl bg-white dark:bg-[#131a27] border border-rose-200/80 dark:border-rose-950/50 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Vô hiệu hóa tài khoản
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tạm dừng hoạt động tài khoản hội viên của bạn. Hồ sơ và danh thiếp sẽ tạm ẩn khỏi danh bạ cho đến khi bạn yêu cầu mở lại qua Ban Thư Ký.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeactivateModalOpen(true)}
              className="shrink-0 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-3 py-2 text-xs font-bold hover:bg-rose-100 transition active:scale-95 cursor-pointer"
            >
              Vô hiệu hóa
            </button>
          </div>
        </section>

        {/* 6. Conditional Logout Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={!passwordChangedInSession}
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all shadow-sm ${
              passwordChangedInSession
                ? "bg-[#003B95] hover:bg-[#002B70] text-white active:scale-[0.99] cursor-pointer"
                : "bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>

          {/* Conditional Note */}
          <p className="text-[11px] text-center leading-snug px-2">
            {!passwordChangedInSession ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <span>🔒</span>
                <span>
                  Để đảm bảo an toàn tài khoản, vui lòng đổi mật khẩu thành công ít nhất một lần để kích hoạt quyền Đăng xuất.
                </span>
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <span>✅</span>
                <span>Mật khẩu đã được cập nhật trong phiên. Bạn có thể đăng xuất bất cứ lúc nào.</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Account Deactivation Modal */}
      {deactivateModalOpen && (
        <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl !bg-white dark:!bg-[#0F172A] border border-rose-200 dark:border-rose-900/60 p-5 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-sm font-bold">Xác nhận vô hiệu hóa tài khoản</DialogTitle>
              </div>
              <button
                type="button"
                onClick={() => setDeactivateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeactivateAccount} className="space-y-3.5 pt-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tài khoản của bạn sẽ tạm dừng quyền truy cập vào các tính năng của CLB CEO 1983. Vui lòng nhập mật khẩu xác nhận để tiếp tục:
              </p>

              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Mật khẩu tài khoản
                </label>
                <input
                  type="password"
                  value={deactivatePassword}
                  onChange={(e) => setDeactivatePassword(e.target.value)}
                  placeholder="Nhập mật khẩu để xác nhận"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeactivateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={deactivateLoading || !deactivatePassword}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {deactivateLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : null}
                  <span>Xác nhận</span>
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export default AssociationSettingsScreen;
