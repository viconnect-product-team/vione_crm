import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Globe,
  Layout,
  Lock,
  Mail,
  MessageSquareText,
  Save,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/dashboard/AppShell";
import { Card, PageHeader } from "@/components/dashboard/PageKit";
import { AssociationLogoUploader } from "@/components/dashboard/AssociationLogoUploader";
import { AssociationLandingEditor } from "@/components/dashboard/AssociationLandingEditor";
import { AssociationDomainEditor } from "@/components/dashboard/AssociationDomainEditor";
import { ReplyTemplatesEditor } from "@/components/dashboard/ReplyTemplatesEditor";
import { getSettingsFn, saveSettingsFn } from "@/lib/settings.functions";
import { useLang, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const TABS = [
  { key: "general", label: "set.tab.general", icon: Building2 },
  { key: "landing", label: "set.tab.landing", icon: Layout },
  { key: "domain", label: "set.tab.domain", icon: Globe },
  { key: "templates", label: "set.tab.templates", icon: MessageSquareText },
  { key: "notifications", label: "set.tab.notifications", icon: Bell },
  { key: "security", label: "set.tab.security", icon: Shield },
  { key: "integrations", label: "set.tab.integrations", icon: Globe },
] as const;

function SettingsPage() {
  const t = useT();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const { lang, setLang } = useLang();
  const [orgName, setOrgName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vba_active_assoc_name") || "Tập đoàn Công nghệ & Kết nối Doanh nhân ViOne";
    }
    return "Tập đoàn Công nghệ & Kết nối Doanh nhân ViOne";
  });
  const [email, setEmail] = useState("contact@vione.vn");
  const [websiteUrl, setWebsiteUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vione_system_website") || "https://vione.vn";
    }
    return "https://vione.vn";
  });
  const [hotline, setHotline] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vione_system_hotline") || "0988 123 456";
    }
    return "0988 123 456";
  });
  const [slogan, setSlogan] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vione_system_slogan") || "Nền tảng Doanh nhân & Doanh nghiệp Số Toàn diện";
    }
    return "Nền tảng Doanh nhân & Doanh nghiệp Số Toàn diện";
  });
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [twoFA, setTwoFA] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useServerFn(getSettingsFn);
  const persistSettings = useServerFn(saveSettingsFn);

  useEffect(() => {
    let active = true;
    loadSettings()
      .then((s) => {
        if (!active) return;
        if (s.orgName) setOrgName(s.orgName);
        if (s.orgEmail) setEmail(s.orgEmail);
        setEmailNotif(s.emailNotif);
        setSmsNotif(s.smsNotif);
        setTwoFA(s.twoFa);
        setLang(s.lang);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await persistSettings({
        data: { orgName, orgEmail: email, lang, emailNotif, smsNotif, twoFa: twoFA },
      }).catch(() => {});
      if (typeof window !== "undefined") {
        localStorage.setItem("vba_active_assoc_name", orgName);
        localStorage.setItem("vione_system_website", websiteUrl);
        localStorage.setItem("vione_system_hotline", hotline);
        localStorage.setItem("vione_system_slogan", slogan);
        window.dispatchEvent(
          new CustomEvent("association-changed", {
            detail: { name: orgName, websiteUrl, hotline, slogan },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("vione-settings-updated", {
            detail: { orgName, websiteUrl, hotline, slogan },
          }),
        );
      }
      toast.success(t("common.savedToast") || "Đã lưu thành công cấu hình hệ thống");
    } catch {
      toast.error(t("common.saveError") || "Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title={t("set.title")} subtitle={t("set.subtitle")} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <Card className="p-2">
          <nav className="space-y-0.5">
            {TABS.map((tt) => {
              const Icon = tt.icon;
              const active = tab === tt.key;
              return (
                <button
                  key={tt.key}
                  onClick={() => setTab(tt.key)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-secondary font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(tt.label as TKey)}
                </button>
              );
            })}
          </nav>
        </Card>

        <Card className="p-6">
          {tab === "general" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {t("set.org.title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("set.org.desc")}</p>
              </div>

              {/* Logo Management */}
              <AssociationLogoUploader />

              {/* Website chính / Tên miền hệ thống */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Website chính / Tên miền hệ thống ViOne
                  </label>
                  {websiteUrl && (
                    <a
                      href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      <span>Mở Website</span>
                      <Globe className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://vione.vn"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tên miền chính thức của doanh nghiệp hiển thị trên danh thiếp số, mã QR và cổng portal.
                </p>
              </div>

              {/* Tên tổ chức / Doanh nghiệp */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("set.org.name")}
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Tập đoàn Công nghệ & Kết nối Doanh nhân ViOne"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Hotline & Email CSKH */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Hotline CSKH / Tổng đài
                  </label>
                  <input
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    placeholder="0988 123 456"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    {t("set.org.email")}
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@vione.vn"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              {/* Slogan / Định vị thương hiệu */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Slogan & Tuyên ngôn thương hiệu
                </label>
                <input
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Nền tảng Doanh nhân & Doanh nghiệp Số Toàn diện"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Ngôn ngữ mặc định */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  {t("set.org.lang")}
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="lo">ພາສາລາວ</option>
                  <option value="km">ភាសាខ្មែរ</option>
                  <option value="my">မြန်မာဘာသာ</option>
                </select>
              </div>
            </div>
          )}

          {tab === "landing" && <AssociationLandingEditor />}

          {tab === "domain" && <AssociationDomainEditor />}

          {tab === "templates" && <ReplyTemplatesEditor />}

          {tab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {t("set.notif.title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("set.notif.desc")}</p>
              </div>
              <ToggleRow
                icon={Mail}
                label={t("set.notif.email")}
                desc={t("set.notif.emailDesc")}
                checked={emailNotif}
                onChange={setEmailNotif}
              />
              <ToggleRow
                icon={Bell}
                label={t("set.notif.sms")}
                desc={t("set.notif.smsDesc")}
                checked={smsNotif}
                onChange={setSmsNotif}
              />
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {t("set.sec.title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("set.sec.desc")}</p>
              </div>
              <ToggleRow
                icon={Lock}
                label={t("set.sec.2fa")}
                desc={t("set.sec.2faDesc")}
                checked={twoFA}
                onChange={setTwoFA}
              />
              <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
                {t("common.changePassword")}
              </button>
            </div>
          )}

          {tab === "integrations" && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {t("set.int.title")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("set.int.desc")}</p>
              </div>
              {[
                { name: "Zalo Official Account", connected: true },
                { name: "Google Workspace", connected: true },
                { name: "Microsoft Teams", connected: false },
                { name: "Slack", connected: false },
              ].map((i) => (
                <div
                  key={i.name}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <span className="text-sm font-medium text-foreground">{i.name}</span>
                  <button
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      i.connected
                        ? "border border-border bg-background text-foreground hover:bg-muted"
                        : "text-primary-foreground shadow-[var(--shadow-glow)]"
                    }`}
                    style={i.connected ? undefined : { background: "var(--gradient-primary)" }}
                  >
                    {i.connected ? t("common.disconnect") : t("common.connect")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab !== "landing" && tab !== "domain" && tab !== "templates" && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Save className="h-4 w-4" />
                {t("common.save")}
              </button>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-secondary"}`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
