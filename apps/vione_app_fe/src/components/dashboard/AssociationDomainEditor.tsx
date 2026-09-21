import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useServerData } from "@/hooks/use-server-data";
import { useT, type TKey } from "@/lib/i18n";
import {
  checkAssociationSslFn,
  getActiveAssociationFn,
  getAssociationDomainFn,
  updateAssociationDomainFn,
  verifyAssociationDomainFn,
  type ActiveAssociation,
  type DomainState,
} from "@/lib/associations.functions";

const ERR_MAP: Record<string, TKey> = {
  INVALID_DOMAIN: "set.domain.invalidDomain",
  INVALID_SUBDOMAIN: "set.domain.invalidSubdomain",
};

function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const map: Record<string, { icon: typeof Clock; cls: string; key: TKey }> = {
    unset: { icon: Globe, cls: "text-muted-foreground bg-muted", key: "set.domain.status.unset" },
    pending: {
      icon: Clock,
      cls: "text-warning bg-warning/10",
      key: "set.domain.status.pending",
    },
    verified: {
      icon: CheckCircle2,
      cls: "text-success bg-success/10",
      key: "set.domain.status.verified",
    },
    failed: {
      icon: XCircle,
      cls: "text-destructive bg-destructive/10",
      key: "set.domain.status.failed",
    },
  };
  const s = map[status] ?? map.unset;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(s.key)}
    </span>
  );
}

function SslBadge({ status }: { status: string }) {
  const t = useT();
  const map: Record<string, { icon: typeof Clock; cls: string; key: TKey }> = {
    none: { icon: Lock, cls: "text-muted-foreground bg-muted", key: "set.domain.ssl.status.none" },
    provisioning: {
      icon: Clock,
      cls: "text-warning bg-warning/10",
      key: "set.domain.ssl.status.provisioning",
    },
    active: {
      icon: CheckCircle2,
      cls: "text-success bg-success/10",
      key: "set.domain.ssl.status.active",
    },
    failed: {
      icon: XCircle,
      cls: "text-destructive bg-destructive/10",
      key: "set.domain.ssl.status.failed",
    },
  };
  const s = map[status] ?? map.none;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(s.key)}
    </span>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-xs text-foreground">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          toast.success(t("set.domain.copied"));
        }}
        className="shrink-0 rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={t("set.domain.copied")}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AssociationDomainEditor() {
  const t = useT();
  const fetchActive = useServerFn(getActiveAssociationFn);
  const fetchDomain = useServerFn(getAssociationDomainFn);
  const saveDomain = useServerFn(updateAssociationDomainFn);
  const verifyDomain = useServerFn(verifyAssociationDomainFn);
  const checkSsl = useServerFn(checkAssociationSslFn);

  const { data: assoc } = useServerData<ActiveAssociation | null>(() => fetchActive(), null);
  const associationId = assoc?.associationId ?? null;

  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [state, setState] = useState<DomainState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checkingSsl, setCheckingSsl] = useState(false);

  useEffect(() => {
    if (!associationId) return;
    let active = true;
    fetchDomain({ data: { associationId } })
      .then((d) => {
        if (!active) return;
        if (d) {
          setSubdomain(d.subdomain ?? "");
          setCustomDomain(d.customDomain ?? "");
          setState(d);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associationId]);

  const save = async () => {
    if (!associationId) return;
    setSaving(true);
    try {
      const res = await saveDomain({
        data: {
          associationId,
          subdomain: subdomain.trim() || null,
          customDomain: customDomain.trim() || null,
        },
      });
      setState(res);
      toast.success(t("common.savedToast"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(ERR_MAP[msg] ? t(ERR_MAP[msg]) : t("common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    if (!associationId) return;
    setVerifying(true);
    try {
      const res = await verifyDomain({ data: { associationId } });
      setState((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              verifiedAt: res.verified ? new Date().toISOString() : null,
              sslStatus: res.verified && res.cnameFound ? "provisioning" : prev.sslStatus,
            }
          : prev,
      );
      if (res.verified) toast.success(t("set.domain.verified.toast"));
      else toast.error(t("set.domain.failed.toast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setVerifying(false);
    }
  };

  const runSslCheck = async () => {
    if (!associationId) return;
    setCheckingSsl(true);
    try {
      const res = await checkSsl({ data: { associationId } });
      setState((prev) =>
        prev
          ? {
              ...prev,
              sslStatus: res.sslStatus,
              sslCheckedAt: new Date().toISOString(),
              sslActiveAt: res.reachable ? new Date().toISOString() : prev.sslActiveAt,
            }
          : prev,
      );
      if (res.reachable) toast.success(t("set.domain.ssl.activeToast"));
      else toast.message(t("set.domain.ssl.pendingToast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.saveError"));
    } finally {
      setCheckingSsl(false);
    }
  };

  if (!associationId) {
    return <p className="text-sm text-muted-foreground">{t("set.landing.noAssoc")}</p>;
  }

  const records = state?.records;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-1 text-base font-semibold text-foreground">{t("set.domain.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("set.domain.desc")}</p>
        </div>
        <StatusBadge status={state?.status ?? "unset"} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.domain.subdomain")}
        </label>
        <input
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder="ceo1983"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">{t("set.domain.subdomainHint")}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">
          {t("set.domain.custom")}
        </label>
        <input
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="hoi.example.com"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">{t("set.domain.customHint")}</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving || !loaded}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("set.domain.save")}
        </button>
      </div>

      {records?.cname && records?.txt && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">{t("set.domain.records")}</h4>
            <p className="text-[11px] text-muted-foreground">{t("set.domain.recordsHint")}</p>
          </div>
          <RecordRow
            label={`${records.cname.type} · ${records.cname.host}`}
            value={records.cname.value}
          />
          <RecordRow
            label={`${records.txt.type} · ${records.txt.host}`}
            value={records.txt.value}
          />

          <button
            onClick={verify}
            disabled={verifying}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {verifying ? t("set.domain.verifying") : t("set.domain.verify")}
          </button>
        </div>
      )}

      {state?.status === "verified" && state?.customDomain && (
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Lock className="h-4 w-4" />
                {t("set.domain.ssl.title")}
              </h4>
              <p className="text-[11px] text-muted-foreground">{t("set.domain.ssl.desc")}</p>
            </div>
            <SslBadge status={state?.sslStatus ?? "none"} />
          </div>
          <button
            onClick={runSslCheck}
            disabled={checkingSsl}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            {checkingSsl ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {checkingSsl ? t("set.domain.ssl.checking") : t("set.domain.ssl.check")}
          </button>
        </div>
      )}
    </div>
  );
}
