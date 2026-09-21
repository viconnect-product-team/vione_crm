import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  ReceiptText,
  CalendarPlus,
  UserPen,
  BadgeCheck,
  QrCode,
  Nfc,
  X,
  Pencil,
  ImagePlus,
  Trash2,
  Wallet,
  ShieldCheck,
  Palette,
  Check,
  CloudOff,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MemberHeader } from "@/components/member/MemberShell";
import { QrCanvas } from "@/components/member/QrCanvas";
import { useServerData } from "@/hooks/use-server-data";
import {
  getMyMember,
  type MyMember,
  getMyBenefits,
  type MemberBenefit,
  getActiveAssociationId,
  getMyAssociationBrand,
  type MyAssociationBrand,
} from "@/lib/member-app.functions";
import { getCardSettings, saveCardSettings, type CardSettings } from "@/lib/card.functions";
import { useT, useLang } from "@/lib/i18n";
import {
  resolveTheme,
  resolveState,
  STATE_STYLES,
  CARD_THEME_LIST,
  type CardTheme,
} from "@/lib/card-themes";
import { buildMembershipPass } from "@/lib/membership-pass";
import { walletCapabilities, walletAddUrl } from "@/lib/wallet-provider";
import { getMyIdentityPassFn, type MyIdentityPass } from "@/lib/member-identity.functions";
const appIcon = "/app-icon.png";
const THEME_KEY = "vba-card-theme";

export const Route = createFileRoute("/m/card")({
  component: CardScreen,
});

type Display = {
  name: string;
  company: string;
  photo: string | null;
  showName: boolean;
  showCompany: boolean;
  showPhoto: boolean;
};

function resolveDisplay(member: MyMember | null, s: CardSettings | null): Display {
  return {
    name: (s?.displayName?.trim() || member?.name || "").trim(),
    company: (s?.displayCompany?.trim() || member?.title || "").trim(),
    photo: s?.photoUrl ?? null,
    showName: s?.showName ?? true,
    showCompany: s?.showCompany ?? true,
    showPhoto: s?.showPhoto ?? true,
  };
}

/** vCard text encoded into QR/NFC so it auto-reflects the chosen display info. */
function buildVCard(member: MyMember | null, d: Display): string {
  if (!member) return "";
  const url = typeof window !== "undefined" ? `${window.location.origin}/card/${member.code}` : "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  if (d.showName && d.name) lines.push(`FN:${d.name}`);
  if (d.showCompany && d.company) lines.push(`ORG:${d.company}`);
  if (member.email) lines.push(`EMAIL:${member.email}`);
  if (member.phone) lines.push(`TEL:${member.phone}`);
  if (url) lines.push(`URL:${url}`);
  lines.push(`NOTE:Mã hội viên ${member.code}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

/** Downscale an image file to a small JPEG data URL (max 256px). */
function fileToThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được ảnh"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Ảnh không hợp lệ"));
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Không xử lý được ảnh"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

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

function CardScreen() {
  const t = useT();
  const { lang } = useLang();
  const fetchMember = useServerFn(getMyMember);
  const fetchSettings = useServerFn(getCardSettings);
  const fetchBenefits = useServerFn(getMyBenefits);
  const fetchAssocId = useServerFn(getActiveAssociationId);
  const fetchBrand = useServerFn(getMyAssociationBrand);
  const { data: member } = useServerData<MyMember | null>(() => fetchMember(), null);
  const { data: brand } = useServerData<MyAssociationBrand | null>(() => fetchBrand(), null);
  const fetchIdentity = useServerFn(getMyIdentityPassFn);
  const { data: identity } = useServerData<MyIdentityPass | null>(() => fetchIdentity(), null);
  const { data: benefits, reload: reloadBenefits } = useServerData<MemberBenefit[]>(
    () => fetchBenefits(),
    [],
  );
  const { data: activeAssocId } = useServerData<string | null>(() => fetchAssocId(), null);

  // Auto-refresh benefits when the active association changes, or when an admin
  // updates the benefits list — but only when the update targets the association
  // currently active for me (events carry an associationId in their detail).
  useEffect(() => {
    const onBenefitsUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ associationId?: string | null }>).detail;
      const targetId = detail?.associationId ?? null;
      // No key on the event → reload to stay safe; otherwise match my active one.
      if (!targetId || !activeAssocId || targetId === activeAssocId) reloadBenefits();
    };
    const onAssocChange = () => reloadBenefits();
    window.addEventListener("association-changed", onAssocChange);
    window.addEventListener("benefits-updated", onBenefitsUpdated);
    return () => {
      window.removeEventListener("association-changed", onAssocChange);
      window.removeEventListener("benefits-updated", onBenefitsUpdated);
    };
  }, [reloadBenefits, activeAssocId]);

  // Refetch benefits when the PWA returns to the foreground so data stays fresh.
  useEffect(() => {
    const onForeground = () => {
      if (document.visibilityState === "visible") reloadBenefits();
    };
    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("focus", onForeground);
    return () => {
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("focus", onForeground);
    };
  }, [reloadBenefits]);

  // Offline support: keep the latest fetched benefits in localStorage per
  // association, and re-sync as soon as the network comes back online.
  const cacheKey = `member-benefits:${activeAssocId ?? "default"}`;
  const [cachedBenefits, setCachedBenefits] = useState<MemberBenefit[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) setCachedBenefits(JSON.parse(raw));
    } catch {
      /* ignore corrupt cache */
    }
  }, [cacheKey]);

  useEffect(() => {
    if (benefits && benefits.length > 0) {
      setCachedBenefits(benefits);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(benefits));
      } catch {
        /* ignore quota errors */
      }
    }
  }, [benefits, cacheKey]);

  useEffect(() => {
    const onOnline = () => reloadBenefits();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reloadBenefits]);

  // Show live data when available, otherwise fall back to the cached copy.
  const displayBenefits = benefits && benefits.length > 0 ? benefits : cachedBenefits;
  const { data: settings, reload: reloadSettings } = useServerData<CardSettings | null>(
    () => fetchSettings(),
    null,
  );

  const [qrOpen, setQrOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nfcBusy, setNfcBusy] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<number | null>(null);

  // Persisted per-user theme preference (client-only).
  useEffect(() => {
    try {
      setThemeId(localStorage.getItem(THEME_KEY));
    } catch {
      /* ignore */
    }
  }, []);
  function pickTheme(id: string) {
    setThemeId(id);
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      /* ignore */
    }
    setThemeOpen(false);
  }

  // Offline awareness + last successful data sync timestamp.
  useEffect(() => {
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    if (member) setLastSync(Date.now());
  }, [member]);

  const d = resolveDisplay(member, settings);
  const vcard = buildVCard(member, d);
  const originForQr = typeof window !== "undefined" ? window.location.origin : "";
  // Prefer the server-signed, short-lived QR token. Fall back to the code-based
  // verify URL (still resolved server-side by verifyMemberPassFn), then vCard.
  const qrValue = identity?.qrToken
    ? `${originForQr}/verify?t=${encodeURIComponent(identity.qrToken)}`
    : member
      ? `${originForQr}/verify?code=${encodeURIComponent(member.code)}`
      : vcard;

  const theme: CardTheme = resolveTheme(themeId, brand?.brandPrimary ?? null);
  const state = resolveState(member?.status, member?.validUntil ?? null);
  const stateStyle = STATE_STYLES[state];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pass = member
    ? buildMembershipPass({
        memberCode: member.code,
        memberName: d.name || member.name,
        organization: d.company || member.title,
        associationName: brand?.name ?? null,
        associationLogoUrl: brand?.logoUrl ?? null,
        membershipLevel: member.type === "company" ? "Doanh nghiệp" : "Cá nhân",
        state,
        issuedAt: member.joinedAt,
        expiresAt: member.validUntil,
        themeId: theme.id,
        brandPrimary: brand?.brandPrimary ?? null,
        origin,
        photoUrl: d.photo,
      })
    : null;
  const wallets = walletCapabilities();

  const actions = [
    { label: t("m.card.actionBenefits"), icon: Heart, to: "/m/perks" as const },
    { label: t("m.card.actionHistory"), icon: ReceiptText, to: "/m/history" as const },
    { label: t("m.card.actionRenew"), icon: CalendarPlus, to: "/m/renew" as const },
    { label: t("m.card.actionUpdate"), icon: UserPen, to: "/m/profile" as const },
  ];

  async function shareNfc() {
    if (!member) return;
    if (typeof window === "undefined") {
      toast.error(t("m.card.nfcNotSupported"));
      return;
    }
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor);
    if (!window.isSecureContext && !isLocal) {
      toast.error("Ghi NFC yêu cầu kết nối HTTPS bảo mật hoặc ứng dụng di động ViOne.");
      return;
    }
    const NDEFReader = (window as any).NDEFReader;
    if (!NDEFReader || typeof NDEFReader !== "function") {
      toast.error("Trình duyệt chưa hỗ trợ Web NFC. Vui lòng mở bằng Google Chrome trên Android.");
      return;
    }
    try {
      setNfcBusy(true);
      toast.info("Đang chờ chạm thẻ... Hãy áp thẻ NFC vào giữa mặt lưng điện thoại.");

      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          { recordType: "url", data: `${window.location.origin}/card/${member.code}` },
          { recordType: "text", data: vcard },
        ],
      });
      toast.success(t("m.card.nfcWriteSuccess"));
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.message?.includes("not allowed")) {
        toast.error("Quyền ghi NFC bị từ chối trong trình duyệt.");
      } else {
        toast.error(
          e instanceof Error
            ? t("m.card.nfcWriteError", { msg: e.message })
            : t("m.card.nfcWriteErrorGeneric"),
        );
      }
    } finally {
      setNfcBusy(false);
    }
  }

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.card.headerTitle")} back />

      <div className="px-4 pt-4">
        {/* Membership card */}
        <div
          className="relative mx-auto max-w-md overflow-hidden rounded-2xl border p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]"
          style={{ background: theme.surface, borderColor: theme.border }}
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl"
            style={{ background: theme.accentSoft }}
          />
          {theme.shine && (
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(115deg,transparent 30%,rgba(255,255,255,0.14) 48%,transparent 62%)",
                backgroundSize: "250% 250%",
                animation: "vba-shine 5s ease-in-out infinite",
              }}
            />
          )}

          <button
            onClick={() => setThemeOpen((v) => !v)}
            className="absolute right-12 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/90 hover:text-white backdrop-blur transition cursor-pointer"
            aria-label={lang === "en" ? "Change card theme" : "Đổi giao diện thẻ"}
          >
            <Palette className="h-4 w-4" />
          </button>
          <button
            onClick={() => member && setEditOpen(true)}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/90 hover:text-white backdrop-blur transition cursor-pointer"
            aria-label={t("m.card.editAriaLabel")}
          >
            <Pencil className="h-4 w-4" />
          </button>

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={appIcon}
                alt="ViOne"
                className="h-10 w-10 rounded-lg shadow-sm"
                width={40}
                height={40}
              />
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-white tracking-wide">{t("m.index.brandLine1")}</div>
                <div className="text-[9px] font-medium text-white/70">
                  {t("m.index.brandLine2")}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="text-[16px] font-black tracking-wider text-white drop-shadow-sm">
              {t("m.card.cardLabel")}
            </div>
            <div className="text-[10px] font-semibold tracking-[0.2em] text-white/60">
              MEMBER CARD
            </div>
          </div>

          <div className="relative mt-5 flex items-center gap-3">
            {d.showPhoto &&
              (d.photo ? (
                <img
                  src={d.photo}
                  alt={d.name}
                  className="h-12 w-12 rounded-full border border-white/20 object-cover shadow-sm"
                />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-[14px] font-bold text-white border border-white/20 shadow-sm">
                  {initials(d.name)}
                </span>
              ))}
            <div className="min-w-0">
              {d.showName && (
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[17px] font-bold text-white drop-shadow-xs">
                    {d.name || "..."}
                  </span>
                  {member?.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-sky-300" />
                  )}
                </div>
              )}
              {d.showCompany && d.company && (
                <div className="truncate text-[12px] font-medium text-white/80">{d.company}</div>
              )}
              <span
                className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-xs"
                style={{ background: stateStyle.bg, color: stateStyle.color }}
              >
                {lang === "en" ? stateStyle.labelEn : stateStyle.labelVi}
              </span>
            </div>
          </div>

          <div className="relative mt-4 flex justify-between border-t border-white/15 pt-3">
            <div>
              <div className="text-[10px] font-medium text-white/60">{t("m.card.memberId")}</div>
              <div className="text-[13px] font-bold tracking-wider text-white">{member?.code}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium text-white/60">{t("m.card.validUntil")}</div>
              <div className="text-[13px] font-bold tracking-wider text-white">
                {member?.validUntil ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Theme picker */}
        {themeOpen && (
          <div className="mt-3 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] p-3">
            <div className="mb-2 text-[12px] font-semibold text-[var(--vba-text-muted)]">
              {lang === "en" ? "Card theme" : "Giao diện thẻ"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CARD_THEME_LIST.map((th) => {
                const selected = th.id === theme.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => pickTheme(th.id)}
                    className="relative h-14 overflow-hidden rounded-xl border text-left"
                    style={{
                      background: th.surface,
                      borderColor: selected ? th.accent : "transparent",
                    }}
                    aria-label={th.label}
                  >
                    <span
                      className="absolute bottom-1 left-1.5 text-[9px] font-semibold"
                      style={{ color: th.text }}
                    >
                      {th.label}
                    </span>
                    {selected && (
                      <span
                        className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full"
                        style={{ background: th.accent }}
                      >
                        <Check className="h-3 w-3 text-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Offline / last sync indicator */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[var(--vba-text-dim)]">
          {online ? (
            <>
              <span className="h-2 w-2 rounded-full bg-[var(--vba-gold)]" />
              {lang === "en" ? "Synced" : "Đã đồng bộ"}
              {lastSync ? ` · ${new Date(lastSync).toLocaleTimeString()}` : ""}
            </>
          ) : (
            <>
              <CloudOff className="h-3.5 w-3.5" />
              {lang === "en"
                ? "Offline — showing cached card"
                : "Ngoại tuyến — hiển thị thẻ đã lưu"}
            </>
          )}
        </div>

        {/* QR + NFC sharing */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => member && setQrOpen(true)}
            disabled={!member}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] py-3 text-[13px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
          >
            <QrCode className="h-5 w-5 text-[var(--vba-gold)]" /> {t("m.card.showQr")}
          </button>
          <button
            onClick={shareNfc}
            disabled={!member || nfcBusy}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] py-3 text-[13px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
          >
            <Nfc className="h-5 w-5 text-[var(--vba-gold)]" />{" "}
            {nfcBusy ? t("m.card.nfcWriting") : t("m.card.shareNfc")}
          </button>
        </div>

        {/* Add to Wallet + public verification. Availability is decided by the
            server (real cert/config presence) — never a fake pass. */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {wallets.map((w) => {
            const serverAvailable =
              w.id === "apple"
                ? Boolean(identity?.walletAppleAvailable)
                : Boolean(identity?.walletGoogleAvailable);
            const url = serverAvailable && pass ? walletAddUrl(w.id, pass) : null;
            return (
              <button
                key={w.id}
                onClick={() => {
                  if (url) window.open(url, "_blank");
                  else
                    toast.info(
                      lang === "en"
                        ? `${w.label} is not configured on the server`
                        : `${w.label} chưa được cấu hình trên máy chủ`,
                    );
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] py-3 text-[12px] font-semibold text-[var(--vba-text)] disabled:opacity-50"
              >
                <Wallet className="h-4 w-4 text-[var(--vba-gold)]" /> {w.label}
                {!serverAvailable && (
                  <span className="text-[10px] font-normal text-[var(--vba-text-muted)]">
                    {lang === "en" ? "(off)" : "(tắt)"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {pass && (
          <a
            href={pass.verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] py-3 text-[13px] font-semibold text-[var(--vba-gold)]"
          >
            <ShieldCheck className="h-5 w-5" />{" "}
            {lang === "en" ? "Public verification page" : "Trang xác thực công khai"}
          </a>
        )}

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {actions.map((a: any) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} to={a.to} className="flex flex-col items-center gap-2">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--vba-border-soft)] bg-[var(--vba-surface)] text-[var(--vba-gold)]">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-center text-[10px] font-medium leading-tight text-[var(--vba-text-muted)]">
                  {a.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="mt-5 vba-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[var(--vba-text)]">
              {t("m.card.benefitsTitle")}
            </h3>
            <Link to="/m/perks" className="text-[12px] font-medium text-[var(--vba-gold)]">
              {t("m.card.viewAll")}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {displayBenefits.map((b, i) => {
              const title = lang === "en" ? b.titleEn || b.titleVi : b.titleVi;
              const desc = lang === "en" ? b.descEn || b.descVi : b.descVi;
              return (
                <div key={i}>
                  <div className="mx-auto mb-1.5 grid h-10 w-10 place-items-center rounded-full bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="text-[11px] font-semibold leading-tight text-[var(--vba-text)]">
                    {title}
                  </div>
                  <div className="text-[10px] text-[var(--vba-text-muted)]">{desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-screen QR modal */}
      {qrOpen && member && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-6 backdrop-blur-sm"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-3xl border border-[var(--vba-border)] bg-[var(--vba-surface)] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--vba-surface-2)] text-[var(--vba-text-muted)]"
              aria-label={t("m.card.closeAriaLabel")}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-3 text-[13px] font-bold vba-gold-text">
              {t("m.card.qrScanPrompt")}
            </div>
            <div className="mx-auto w-fit">
              <QrCanvas value={qrValue} size={232} />
            </div>
            {d.showName && (
              <div className="mt-4 text-[15px] font-bold text-[var(--vba-text)]">{d.name}</div>
            )}
            <div className="text-[13px] font-semibold text-[var(--vba-gold)]">{member.code}</div>
            {identity?.hasPass && (
              <div className="mt-3 space-y-1 border-t border-[var(--vba-border-soft)] pt-3 text-[11px] text-[var(--vba-text-muted)]">
                <div>
                  Serial:{" "}
                  <span className="font-semibold text-[var(--vba-text)]">{identity.serial}</span>
                </div>
                <div>
                  {lang === "en" ? "Status" : "Trạng thái"}:{" "}
                  <span className="font-semibold text-[var(--vba-text)]">
                    {identity.effectiveStatus}
                  </span>
                  {" · v"}
                  {identity.cardVersion}
                </div>
                {identity.expiresAt && (
                  <div>
                    {lang === "en" ? "Valid until" : "Hiệu lực đến"}:{" "}
                    <span className="font-semibold text-[var(--vba-text)]">
                      {new Date(identity.expiresAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
                {identity.qrToken && (
                  <div className="text-[10px] text-[var(--vba-text-dim)]">
                    {lang === "en"
                      ? "Signed QR · refreshes each open"
                      : "QR ký số · làm mới mỗi lần mở"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit display modal */}
      {editOpen && member && (
        <EditCardModal
          member={member}
          current={d}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            reloadSettings();
          }}
        />
      )}
    </div>
  );
}

function EditCardModal({
  member,
  current,
  onClose,
  onSaved,
}: {
  member: MyMember;
  current: Display;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const save = useServerFn(saveCardSettings);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(current.name);
  const [company, setCompany] = useState(current.company);
  const [photo, setPhoto] = useState<string | null>(current.photo);
  const [showName, setShowName] = useState(current.showName);
  const [showCompany, setShowCompany] = useState(current.showCompany);
  const [showPhoto, setShowPhoto] = useState(current.showPhoto);
  const [busy, setBusy] = useState(false);

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const thumb = await fileToThumbnail(file);
      setPhoto(thumb);
      setShowPhoto(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("m.card.photoLoadError"));
    }
  }

  async function submit() {
    setBusy(true);
    try {
      await save({
        data: {
          displayName: name.trim() || null,
          displayCompany: company.trim() || null,
          photoUrl: photo,
          showName,
          showCompany,
          showPhoto,
        },
      });
      toast.success(t("m.card.saveSuccess"));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("m.card.saveError"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-[var(--vba-border-soft)] bg-[var(--vba-surface-2)] px-3 text-[14px] text-[var(--vba-text)] outline-none focus:border-[var(--vba-gold)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl border border-[var(--vba-border)] bg-[var(--vba-surface)] p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--vba-surface-2)] text-[var(--vba-text-muted)]"
          aria-label={t("m.card.closeAriaLabel")}
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="mb-4 text-[15px] font-bold text-[var(--vba-text)]">
          {t("m.card.editTitle")}
        </h2>

        {/* Photo */}
        <div className="mb-4 flex items-center gap-3">
          {photo ? (
            <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--vba-gold-soft)] text-[16px] font-bold text-[var(--vba-gold)]">
              {initials(name || member.name)}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] bg-[var(--vba-surface-2)] px-3 py-2 text-[12px] font-semibold text-[var(--vba-text)]"
            >
              <ImagePlus className="h-4 w-4 text-[var(--vba-gold)]" /> {t("m.card.pickPhoto")}
            </button>
            {photo && (
              <button
                onClick={() => setPhoto(null)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--vba-border-soft)] bg-[var(--vba-surface-2)] px-3 py-2 text-[12px] font-semibold text-[var(--vba-danger)]"
              >
                <Trash2 className="h-4 w-4" /> {t("m.card.deletePhoto")}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickPhoto}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--vba-text-muted)]">
              {t("m.card.displayName")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={member.name}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--vba-text-muted)]">
              {t("m.card.displayCompany")}
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={member.title}
              className={inputCls}
            />
          </div>
        </div>

        {/* Visibility toggles */}
        <div className="mt-4 space-y-1">
          <Toggle label={t("m.card.showName")} checked={showName} onChange={setShowName} />
          <Toggle label={t("m.card.showCompany")} checked={showCompany} onChange={setShowCompany} />
          <Toggle label={t("m.card.showPhoto")} checked={showPhoto} onChange={setShowPhoto} />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--vba-border-soft)] py-2.5 text-[14px] font-semibold text-[var(--vba-text)]"
          >
            {t("m.card.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[var(--vba-gold)] py-2.5 text-[14px] font-bold text-[#1a1304] disabled:opacity-60"
          >
            {busy ? t("m.card.saving") : t("m.card.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-1 py-2"
    >
      <span className="text-[13px] text-[var(--vba-text)]">{label}</span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-[var(--vba-gold)]" : "bg-[var(--vba-surface-2)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
