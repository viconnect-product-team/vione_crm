import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  User,
  ShieldCheck,
  KeyRound,
  Users,
  Settings,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Mail,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  ShieldAlert,
  SlidersHorizontal,
  Bell,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader, StatCard } from "@/components/dashboard/PageKit";
import { useT, type TKey } from "@/lib/i18n";
import { fetchNestApi } from "@/lib/api-client";
import { useRole } from "@/hooks/use-role";
import {
  getVotingOpenPrefFn,
  setVotingOpenPrefFn,
  clearVotingOpenPrefFn,
  type VotingOpenPref,
} from "@/lib/settings.functions";

export const Route = createFileRoute("/account-settings/")({
  head: () => ({ meta: [{ title: "Quản lý tài khoản — ViOne" }] }),
  component: AccountManagementPage,
});

type Choice = VotingOpenPref | "ask";

const VOTING_OPTIONS: { value: Choice; labelKey: TKey; descKey: TKey }[] = [
  { value: "ask", labelKey: "acct.openBehavior.ask", descKey: "acct.openBehavior.askDesc" },
  { value: "new", labelKey: "acct.openBehavior.new", descKey: "acct.openBehavior.newDesc" },
  { value: "same", labelKey: "acct.openBehavior.same", descKey: "acct.openBehavior.sameDesc" },
];

export function AccountManagementPage() {
  const t = useT();
  const navigate = useNavigate();
  const { isPlatformAdmin, isAdmin, roles: userRolesList } = useRole();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "users" | "preferences">("profile");

  // Account State
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Admin Users List State
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [userStats, setUserStats] = useState({ total: 0, active: 0, suspended: 0, admins: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Admin Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Admin Form State
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState("staff");
  const [createStatus, setCreateStatus] = useState("active");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("staff");
  const [editStatus, setEditStatus] = useState("active");
  const [adminNewPassword, setAdminNewPassword] = useState("");

  // Voting Preference State
  const [prefChoice, setPrefChoice] = useState<Choice>("ask");
  const [prefSaving, setPrefSaving] = useState(false);

  const loadPref = useServerFn(getVotingOpenPrefFn);
  const savePref = useServerFn(setVotingOpenPrefFn);
  const clearPref = useServerFn(clearVotingOpenPrefFn);

  const canManageUsers = isPlatformAdmin || isAdmin || (account?.roles && (account.roles.includes("platform_admin") || account.roles.includes("tenant_admin")));

  // ── Load Account Data ──────────────────────────────────────────────────────
  const loadAccount = async () => {
    setLoading(true);
    try {
      const data = await fetchNestApi("/users/me");
      if (data && data.id) {
        setAccount(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url || "");
        if (data.profile) {
          setProfessionalTitle(data.profile.professional_title || "");
          setCompanyName(data.profile.company_name || "");
          setIndustry(data.profile.industry || "");
          setRegion(data.profile.region || "");
          setBio(data.profile.bio || "");
        }
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin tài khoản:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Load Admin Users List ──────────────────────────────────────────────────
  const loadUsers = async (page = pagination.page) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
      });
      const res = await fetchNestApi(`/users?${params.toString()}`);
      if (res && res.users) {
        setUsersList(res.users);
        setPagination(res.pagination);
        if (res.stats) setUserStats(res.stats);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "security" || tabParam === "profile" || tabParam === "users" || tabParam === "preferences") {
        setActiveTab(tabParam as any);
      }
    }
    loadAccount();
    loadPref({}).then((res) => {
      if (res?.pref) setPrefChoice(res.pref);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "users" && canManageUsers) {
      loadUsers(1);
    }
  }, [activeTab, searchQuery, roleFilter, statusFilter]);

  // ── Save Profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await fetchNestApi("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name,
          email,
          avatar_url: avatarUrl,
          professional_title: professionalTitle,
          company_name: companyName,
          industry,
          region,
          bio,
        }),
      });

      if (updated && updated.id) {
        setAccount(updated);
        toast.success("Cập nhật thông tin tài khoản thành công!");
      } else {
        toast.error(updated?.message || "Không thể cập nhật hồ sơ");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi máy chủ khi cập nhật thông tin");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // ── Admin Create User ──────────────────────────────────────────────────────
  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await fetchNestApi("/users", {
        method: "POST",
        body: JSON.stringify({
          username: createUsername.trim(),
          email: createEmail.trim() || undefined,
          password: createPassword || undefined,
          name: createName.trim() || undefined,
          role: createRole,
          account_status: createStatus,
        }),
      });

      if (res && res.error) {
        toast.error(res.message || "Không thể tạo tài khoản");
      } else {
        toast.success("Tạo tài khoản người dùng thành công!");
        setCreateModalOpen(false);
        setCreateUsername("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateName("");
        loadUsers(1);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi tạo tài khoản");
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Admin Edit User ────────────────────────────────────────────────────────
  const handleAdminUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setModalSubmitting(true);
    try {
      const res = await fetchNestApi(`/users/${targetUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          account_status: editStatus,
        }),
      });

      if (res && res.error) {
        toast.error(res.message || "Không thể cập nhật tài khoản");
      } else {
        toast.success("Cập nhật tài khoản thành công!");
        setEditModalOpen(false);
        loadUsers(pagination.page);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi cập nhật tài khoản");
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Admin Reset Password ───────────────────────────────────────────────────
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (adminNewPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await fetchNestApi(`/users/${targetUser.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword: adminNewPassword }),
      });

      if (res && res.error) {
        toast.error(res.message || "Không thể đặt lại mật khẩu");
      } else {
        toast.success(`Đặt lại mật khẩu cho ${targetUser.username} thành công!`);
        setResetModalOpen(false);
        setAdminNewPassword("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi đặt lại mật khẩu");
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Admin Toggle Status ────────────────────────────────────────────────────
  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.account_status === "active" ? "suspended" : "active";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Bạn có chắc muốn tạm khóa tài khoản ${user.username}?`
        : `Mở khóa và kích hoạt lại tài khoản ${user.username}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetchNestApi(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res && res.error) {
        toast.error(res.message || "Không thể thay đổi trạng thái");
      } else {
        toast.success(res.message || "Đã cập nhật trạng thái tài khoản");
        loadUsers(pagination.page);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi cập nhật trạng thái");
    }
  };

  // ── Admin Delete User ──────────────────────────────────────────────────────
  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Hành động này không thể hoàn tác! Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${user.username}"?`)) {
      return;
    }
    try {
      const res = await fetchNestApi(`/users/${user.id}`, { method: "DELETE" });
      if (res && res.error) {
        toast.error(res.message || "Không thể xóa tài khoản");
      } else {
        toast.success(res.message || "Đã xóa tài khoản thành công");
        loadUsers(pagination.page);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi xóa tài khoản");
    }
  };

  // ── Update Voting Preference ───────────────────────────────────────────────
  const updateVotingPref = async (next: Choice) => {
    const prev = prefChoice;
    setPrefChoice(next);
    setPrefSaving(true);
    try {
      if (next === "ask") await clearPref({});
      else await savePref({ data: { pref: next } });
      toast.success(t("acct.toast.saved"));
    } catch {
      setPrefChoice(prev);
      toast.error(t("acct.toast.error"));
    } finally {
      setPrefSaving(false);
    }
  };

  // Helper Initials
  const getInitials = (str: string) => {
    if (!str) return "U";
    return str
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U";
  };

  // Password strength gauge
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={t("account.title") || "Quản lý tài khoản"}
          subtitle={
            account
              ? `${account.name || account.username} • ${account.email || "Chưa có email"}`
              : "Quản lý hồ sơ cá nhân, bảo mật và phân quyền tài khoản hệ thống"
          }
          actions={
            <button
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
            >
              <ArrowLeft className="h-4 w-4" /> Về bảng tin
            </button>
          }
        />

        {/* User Quick Info Banner */}
        {account && (
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-6 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/20 text-xl font-bold text-primary shadow-inner border border-primary/20">
                    {account.avatar_url ? (
                      <img src={account.avatar_url} alt={account.name} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(account.name || account.username)
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-background ${
                      account.profile?.account_status === "suspended" ? "bg-destructive" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{account.name || account.username}</h3>
                    {account.email_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tên đăng nhập: <span className="font-semibold text-foreground">@{account.username}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(account.roles && account.roles.length > 0 ? account.roles : ["member"]).map((r: string) => (
                      <span
                        key={r}
                        className="rounded-lg border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary uppercase tracking-wide"
                      >
                        {r.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground">
                <span>Tham gia: {account.created_at ? new Date(account.created_at).toLocaleDateString("vi-VN") : "—"}</span>
                <span>
                  Trạng thái:{" "}
                  <strong className={account.profile?.account_status === "suspended" ? "text-destructive" : "text-emerald-600"}>
                    {account.profile?.account_status === "suspended" ? "Tạm khóa" : "Hoạt động"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition shrink-0 ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            {t("account.tab.profile") || "Hồ sơ tài khoản"}
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition shrink-0 ${
              activeTab === "security"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            {t("account.tab.security") || "Bảo mật & Mật khẩu"}
          </button>

          {canManageUsers && (
            <button
              onClick={() => setActiveTab("users")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition shrink-0 ${
                activeTab === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              {t("account.tab.users") || "Quản trị người dùng"}
              <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-bold">
                Admin
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("preferences")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition shrink-0 ${
              activeTab === "preferences"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("account.tab.preferences") || "Tuỳ chọn"}
          </button>
        </div>

        {/* ── TAB 1: PROFILE & ACCOUNT DETAILS ──────────────────────────────── */}
        {activeTab === "profile" && (
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-foreground">Thông tin cá nhân & Tài khoản</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cập nhật thông tin nhận diện tài khoản trên nền tảng ViOne
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    disabled
                    value={account?.username || ""}
                    className="h-10 w-full rounded-xl border border-border bg-muted/60 px-3.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">Tên đăng nhập cố định không thể thay đổi</span>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Họ và tên hiển thị *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ten@email.com"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    URL Ảnh đại diện
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Chức danh / Nghề nghiệp
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      placeholder="VD: Giám đốc Điều hành, Chuyên viên..."
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Công ty / Tổ chức
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="VD: VIONE Global"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Lĩnh vực hoạt động
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="VD: Công nghệ, Y tế, Xây dựng..."
                    className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Khu vực / Tỉnh thành
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="VD: Hà Nội, TP. Hồ Chí Minh..."
                      className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Tiểu sử cá nhân
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu đôi nét về kinh nghiệm, mối quan tâm kết nối của bạn..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
                >
                  {profileSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 2: SECURITY & PASSWORD ───────────────────────────────────── */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-foreground">Đổi mật khẩu tài khoản</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {account?.has_password && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground">
                        Mật khẩu hiện tại *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="h-10 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Mật khẩu mới *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="h-10 w-full rounded-xl border border-border bg-background px-3.5 pr-10 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex gap-1 h-1.5 w-full">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-full flex-1 rounded-full transition-all ${
                                passwordStrength >= level
                                  ? passwordStrength <= 2
                                    ? "bg-destructive"
                                    : passwordStrength <= 4
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Độ mạnh:{" "}
                          <span className="font-semibold text-foreground">
                            {passwordStrength <= 2 ? "Yếu" : passwordStrength <= 4 ? "Trung bình" : "Rất mạnh"}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-foreground">
                      Xác nhận mật khẩu mới *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving || !newPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
                    >
                      {passwordSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
                      {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
                    </button>
                  </div>
                </form>
              </Card>

              {/* Linked Accounts */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-foreground">Tài khoản liên kết</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                  Đăng nhập nhanh chóng và an toàn thông qua các dịch vụ bên ngoài
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-bold text-red-500">
                        G
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Google</div>
                        <div className="text-xs text-muted-foreground">Đăng nhập tài khoản Google</div>
                      </div>
                    </div>
                    {account?.google_linked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Đã liên kết
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa liên kết</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-bold text-foreground">
                        
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Apple ID</div>
                        <div className="text-xs text-muted-foreground">Đăng nhập thiết bị Apple</div>
                      </div>
                    </div>
                    {account?.apple_linked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Đã liên kết
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa liên kết</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Security overview */}
            <div className="space-y-6">
              <Card className="p-6">
                <h4 className="text-sm font-bold text-foreground mb-3">Tình trạng an toàn</h4>
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Mã hóa mật khẩu Bcrypt</div>
                      <p className="text-muted-foreground mt-0.5">Mật khẩu lưu trữ an toàn bằng chuẩn muối băm cao cấp</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Phiên xác thực JWT</div>
                      <p className="text-muted-foreground mt-0.5">Token bảo vệ đa lớp có thời hạn tự động thu hồi</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Xác thực 2 yếu tố (2FA)</div>
                      <p className="text-muted-foreground mt-0.5">Khuyến nghị bật bảo mật khi có thông báo hệ thống</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-sm font-bold text-foreground mb-2">Đăng xuất phiên</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Đăng xuất khỏi thiết bị này để đảm bảo an toàn nếu bạn sử dụng máy tính công cộng
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("vibe_token");
                    localStorage.removeItem("vibe_refresh_token");
                    window.location.href = "/auth";
                  }}
                  className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition"
                >
                  Đăng xuất khỏi thiết bị này
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 3: ADMIN USERS MANAGEMENT ────────────────────────────────── */}
        {activeTab === "users" && canManageUsers && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard
                label="Tổng số tài khoản"
                value={userStats.total}
                tone="primary"
                icon={<Users className="h-5 w-5 text-primary" />}
              />
              <StatCard
                label="Đang hoạt động"
                value={userStats.active}
                tone="success"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              />
              <StatCard
                label="Đã tạm khóa"
                value={userStats.suspended}
                tone="danger"
                icon={<AlertCircle className="h-5 w-5 text-destructive" />}
              />
              <StatCard
                label="Quản trị viên"
                value={userStats.admins}
                tone="info"
                icon={<ShieldCheck className="h-5 w-5 text-sky-500" />}
              />
            </div>

            {/* Filter Toolbar */}
            <Card className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, username, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-sm text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none transition"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="platform_admin">Platform Admin</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus:border-ring"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="suspended">Đã tạm khóa</option>
                  </select>

                  <button
                    onClick={() => loadUsers(pagination.page)}
                    className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                    title="Làm mới"
                  >
                    <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                  </button>

                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
                  >
                    <UserPlus className="h-4 w-4" /> Thêm tài khoản
                  </button>
                </div>
              </div>
            </Card>

            {/* Users Data Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Người dùng</th>
                      <th className="px-4 py-3.5">Tên đăng nhập</th>
                      <th className="px-4 py-3.5">Vai trò</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5">Ngày tạo</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                          Đang tải danh sách người dùng...
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          Không tìm thấy tài khoản người dùng nào
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt={u.name} className="h-full w-full object-cover" />
                                ) : (
                                  getInitials(u.name || u.username)
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{u.name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{u.email || "Chưa có email"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-foreground font-medium">
                            @{u.username}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {(u.roles && u.roles.length > 0 ? u.roles : ["member"]).map((r: string) => (
                                <span
                                  key={r}
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                    r === "platform_admin"
                                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                      : r === "tenant_admin"
                                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {r.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.account_status === "suspended"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {u.account_status === "suspended" ? (
                                <>
                                  <AlertCircle className="h-3 w-3" /> Đã tạm khóa
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3" /> Hoạt động
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Edit User */}
                              <button
                                onClick={() => {
                                  setTargetUser(u);
                                  setEditName(u.name !== "—" ? u.name : "");
                                  setEditEmail(u.email || "");
                                  setEditRole(u.roles?.[0] || "staff");
                                  setEditStatus(u.account_status || "active");
                                  setEditModalOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                                title="Chỉnh sửa tài khoản"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* Toggle Lock / Unlock */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`rounded-lg p-1.5 transition ${
                                  u.account_status === "suspended"
                                    ? "text-emerald-600 hover:bg-emerald-500/10"
                                    : "text-amber-600 hover:bg-amber-500/10"
                                }`}
                                title={u.account_status === "suspended" ? "Mở khóa tài khoản" : "Tạm khóa tài khoản"}
                              >
                                {u.account_status === "suspended" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setTargetUser(u);
                                  setAdminNewPassword("");
                                  setResetModalOpen(true);
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                                title="Đặt lại mật khẩu"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>

                              {/* Delete User */}
                              {u.id !== account?.id && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-card">
                  <div className="text-xs text-muted-foreground">
                    Trang {pagination.page} / {pagination.totalPages} ({pagination.total} tài khoản)
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => loadUsers(pagination.page - 1)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => loadUsers(pagination.page + 1)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB 4: PREFERENCES ───────────────────────────────────────────── */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-base font-bold text-foreground">{t("acct.openBehavior.title")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("acct.openBehavior.desc")}</p>
              </div>

              <div className="space-y-2.5 max-w-xl">
                {VOTING_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                      prefChoice === o.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-secondary/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="openPref"
                      checked={prefChoice === o.value}
                      disabled={prefSaving}
                      onChange={() => updateVotingPref(o.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{t(o.labelKey)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t(o.descKey)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Cài đặt Thông báo & Nhận tin</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quản lý các loại thông báo đẩy và email cập nhật từ hệ thống
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/account-settings/notifications" })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition"
                >
                  <Bell className="h-4 w-4" /> Mở cài đặt thông báo <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE USER ──────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Thêm tài khoản người dùng mới
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdminCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-foreground">Tên đăng nhập (Username) *</label>
                <input
                  type="text"
                  required
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="VD: nguyenvana hoặc email@domain.com"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-foreground">Họ và tên</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-foreground">Địa chỉ Email</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-foreground">Mật khẩu khởi tạo (để trống mặc định: Vione@123)</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Vione@123"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">Vai trò người dùng</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                  >
                    <option value="staff">Staff (Nhân viên)</option>
                    <option value="tenant_admin">Tenant Admin (Quản trị hiệp hội)</option>
                    <option value="platform_admin">Platform Admin (Toàn hệ thống)</option>
                    <option value="viewer">Viewer (Chỉ xem)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">Trạng thái tài khoản</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                  >
                    <option value="active">Kích hoạt (Active)</option>
                    <option value="suspended">Tạm khóa (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {modalSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT USER ────────────────────────────────────────────────── */}
      {editModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Pencil className="h-5 w-5 text-primary" /> Chỉnh sửa tài khoản: @{targetUser.username}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdminUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-foreground">Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-foreground">Địa chỉ Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-foreground">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                  >
                    <option value="staff">Staff (Nhân viên)</option>
                    <option value="tenant_admin">Tenant Admin (Quản trị hiệp hội)</option>
                    <option value="platform_admin">Platform Admin (Toàn hệ thống)</option>
                    <option value="viewer">Viewer (Chỉ xem)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-foreground">Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                  >
                    <option value="active">Kích hoạt (Active)</option>
                    <option value="suspended">Tạm khóa (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {modalSubmitting ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD ───────────────────────────────────────────── */}
      {resetModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setResetModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Đặt lại mật khẩu: @{targetUser.username}
              </h3>
              <button onClick={() => setResetModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-foreground">Mật khẩu mới * (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới cho người dùng"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground focus:border-ring outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !adminNewPassword}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {modalSubmitting ? "Đang lưu..." : "Xác nhận đặt lại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
