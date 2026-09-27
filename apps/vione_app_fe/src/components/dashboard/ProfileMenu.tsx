import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut, User as UserIcon, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/lib/i18n";
import { fetchNestApi } from "@/lib/api-client";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileMenu({
  variant = "default",
  collapsed = false,
}: {
  variant?: "default" | "sidebar";
  collapsed?: boolean;
}) {
  const t = useT();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const [email, setEmail] = useState<string>(user?.email || "");
  const [fullName, setFullName] = useState<string>(user?.name || user?.user_metadata?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || user?.user_metadata?.avatar_url || "");
  const [profileOpen, setProfileOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      setEmail(user.email || "");
      setFullName(user.name || user.user_metadata?.full_name || "");
      setAvatarUrl(user.avatar_url || user.user_metadata?.avatar_url || "");
    }
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = fullName || email || "Người dùng";

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("vibe_token");
    localStorage.removeItem("vibe_refresh_token");
    document.cookie = `sb-access-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `sb-refresh-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    toast.success(t("profile.loggedOut"));
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }

  const isSidebar = variant === "sidebar";

  return (
    <div className={`relative ${isSidebar ? "w-full" : ""}`} ref={ref}>
      {isSidebar ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center transition-all duration-150 cursor-pointer ${
            collapsed
              ? "justify-center p-1.5 rounded-xl hover:bg-slate-900 text-white"
              : "justify-between gap-3 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-white"
          }`}
          aria-haspopup="menu"
          aria-expanded={open}
          title={displayName}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold text-white shadow-sm border border-slate-700/80"
              style={avatarUrl ? undefined : { background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                initials(displayName)
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex flex-col justify-start items-start text-left">
                <div className="max-w-[145px] truncate text-xs font-bold font-['Inter'] text-white">
                  {displayName}
                </div>
                <div className="max-w-[145px] truncate text-[11px] font-normal font-['Inter'] text-slate-400">
                  {email || "Admin hệ thống"}
                </div>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 hover:bg-muted"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-primary-foreground"
            style={avatarUrl ? undefined : { background: "var(--gradient-primary)" }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
            ) : (
              initials(displayName)
            )}
          </div>
          <div className="hidden leading-tight text-left sm:block">
            <div className="max-w-[140px] truncate text-xs font-semibold text-foreground">
              {displayName}
            </div>
            <div className="max-w-[140px] truncate text-[11px] text-muted-foreground">{email}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          id={isSidebar ? "sidebar-profile-popup" : undefined}
          className={`absolute z-50 overflow-hidden rounded-xl p-1.5 shadow-2xl animate-in fade-in duration-150 ${
            isSidebar
              ? "sidebar-profile-menu bottom-full mb-2 left-0 w-full min-w-[220px] border border-slate-700/80 bg-slate-900 text-slate-100"
              : "right-0 mt-2 w-56 border border-border bg-card text-foreground"
          }`}
        >
          <button
            onClick={() => {
              setOpen(false);
              navigate({ to: "/profile" });
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${
              isSidebar
                ? "text-slate-100 hover:bg-slate-800 hover:text-white"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <UserIcon className="h-4 w-4 text-blue-400 shrink-0" />
            <span>{t("profile.menu.profile")}</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate({ to: "/account-settings" });
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${
              isSidebar
                ? "text-slate-100 hover:bg-slate-800 hover:text-white"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <UserCog className="h-4 w-4 text-sky-400 shrink-0" />
            <span>{t("nav.account")}</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setPwdOpen(true);
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${
              isSidebar
                ? "text-slate-100 hover:bg-slate-800 hover:text-white"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <KeyRound className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{t("profile.menu.password")}</span>
          </button>
          <div className={`my-1 h-px ${isSidebar ? "bg-slate-700/80" : "bg-border"}`} />
          <button
            onClick={handleLogout}
            className={`logout-btn flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold cursor-pointer transition-colors ${
              isSidebar
                ? "text-rose-400 hover:bg-rose-500/15 hover:text-rose-300"
                : "text-rose-500 hover:bg-rose-50"
            }`}
          >
            <LogOut className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{t("profile.menu.logout")}</span>
          </button>
        </div>
      )}

      {profileOpen && (
        <ProfileModal
          userId={userId}
          email={email}
          fullName={fullName}
          onSaved={(n) => setFullName(n)}
          onClose={() => setProfileOpen(false)}
        />
      )}
      {pwdOpen && <PasswordModal onClose={() => setPwdOpen(false)} />}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ProfileModal({
  userId,
  email,
  fullName,
  onSaved,
  onClose,
}: {
  userId: string | null;
  email: string;
  fullName: string;
  onSaved: (n: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(fullName);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      await fetchNestApi("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      onSaved(name.trim());
      toast.success(t("profile.saved"));
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("profile.title")} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("profile.fullName")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("profile.email")}
          </label>
          <input
            value={email}
            disabled
            className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [currentPwd, setCurrentPwd] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (pwd.length < 6) {
      toast.error(t("profile.pwd.tooShort"));
      return;
    }
    if (pwd !== confirm) {
      toast.error(t("profile.pwd.mismatch"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetchNestApi('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: pwd,
        }),
      });

      if (res && res.error) {
        toast.error(res.message || res.error || "Không thể đổi mật khẩu");
        return;
      }

      toast.success(t("profile.pwd.saved"));
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Đã xảy ra lỗi khi đổi mật khẩu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={t("profile.pwd.title")} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            placeholder="Nhập mật khẩu hiện tại nếu có"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("profile.pwd.new")}
          </label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("profile.pwd.confirm")}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
