import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const getDb = (ctx?: any) => ctx?.supabase || supabaseAdmin;

// ============================================================
// Domain: subdomain / custom domain + DNS ownership verification
// ============================================================

/** Hostname that custom domains must CNAME to (the platform published host). */
const PLATFORM_CNAME_TARGET = "qlhh.lovable.app";

export type DomainState = {
  subdomain: string | null;
  customDomain: string | null;
  status: string; // unset | pending | verified | failed
  verificationToken: string | null;
  verifiedAt: string | null;
  /** SSL/HTTPS certificate lifecycle: none | provisioning | active | failed */
  sslStatus: string;
  sslCheckedAt: string | null;
  sslActiveAt: string | null;
  /** DNS records the admin must create. */
  records: {
    cname: { host: string; type: "CNAME"; value: string } | null;
    txt: { host: string; type: "TXT"; value: string } | null;
  };
};

const domainRegex = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/;
const subdomainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

function buildRecords(customDomain: string | null, token: string | null) {
  if (!customDomain || !token) return { cname: null, txt: null };
  return {
    cname: { host: customDomain, type: "CNAME" as const, value: PLATFORM_CNAME_TARGET },
    txt: {
      host: `_lovable-verify.${customDomain}`,
      type: "TXT" as const,
      value: `lovable-verify=${token}`,
    },
  };
}

/** Admin read of own association domain configuration. */
export const getAssociationDomainFn = createServerFn({ method: "GET" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<DomainState | null> => {
    const { data: row, error } = await getDb(context)
      .from("associations")
      .select(
        "subdomain, custom_domain, domain_status, domain_verification_token, domain_verified_at, ssl_status, ssl_checked_at, ssl_active_at",
      )
      .eq("id", data.associationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const r: any = row;
    return {
      subdomain: r.subdomain,
      customDomain: r.custom_domain,
      status: r.domain_status ?? "unset",
      verificationToken: r.domain_verification_token,
      verifiedAt: r.domain_verified_at,
      sslStatus: r.ssl_status ?? "none",
      sslCheckedAt: r.ssl_checked_at,
      sslActiveAt: r.ssl_active_at,
      records: buildRecords(r.custom_domain, r.domain_verification_token),
    };
  });

/** Admin sets/updates subdomain + custom domain. Generates a fresh token and
 * resets verification whenever the custom domain changes. */
export const updateAssociationDomainFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) =>
    z
      .object({
        associationId: z.string().uuid(),
        subdomain: z.string().trim().toLowerCase().max(63).nullable().or(z.literal("")),
        customDomain: z.string().trim().toLowerCase().max(253).nullable().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<DomainState> => {
    const sub = data.subdomain ? data.subdomain.trim().toLowerCase() : null;
    const dom = data.customDomain ? data.customDomain.trim().toLowerCase() : null;
    if (sub && !subdomainRegex.test(sub)) throw new Error("INVALID_SUBDOMAIN");
    if (dom && !domainRegex.test(dom)) throw new Error("INVALID_DOMAIN");

    // Read current to detect changes.
    const { data: cur } = await getDb(context)
      .from("associations")
      .select("custom_domain, domain_verification_token")
      .eq("id", data.associationId)
      .maybeSingle();
    const prevDom = (cur as any)?.custom_domain ?? null;
    const prevToken = (cur as any)?.domain_verification_token ?? null;

    const domainChanged = dom !== prevDom;
    // Generate token when a custom domain exists and (changed or no token yet).
    let token = prevToken;
    if (dom) {
      if (domainChanged || !token) {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      }
    } else {
      token = null;
    }

    const status = dom ? (domainChanged ? "pending" : undefined) : "unset";

    const update: Record<string, any> = {
      subdomain: sub,
      custom_domain: dom,
      domain_verification_token: token,
    };
    if (status !== undefined) update.domain_status = status;
    if (dom && domainChanged) update.domain_verified_at = null;
    if (!dom) update.domain_verified_at = null;
    // Reset SSL lifecycle whenever the custom domain changes or is removed.
    if (domainChanged || !dom) {
      update.ssl_status = "none";
      update.ssl_checked_at = null;
      update.ssl_active_at = null;
    }

    const { error } = await getDb(context)
      .from("associations")
      .update(update as any)
      .eq("id", data.associationId);
    if (error) throw new Error(error.message);

    return {
      subdomain: sub,
      customDomain: dom,
      status: dom ? (status ?? "pending") : "unset",
      verificationToken: token,
      verifiedAt: null,
      sslStatus: "none",
      sslCheckedAt: null,
      sslActiveAt: null,
      records: buildRecords(dom, token),
    };
  });

type DohAnswer = { name: string; type: number; data: string };

async function dohQuery(name: string, type: "TXT" | "CNAME" | "A" | "AAAA"): Promise<DohAnswer[]> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) return [];
  const json: any = await res.json();
  return (json.Answer ?? []) as DohAnswer[];
}

/** True when the IP literal is a private/loopback/link-local/reserved address. */
function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10) return true;
    if (a === 127) return true; // loopback
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  // IPv6
  const v6 = ip.toLowerCase();
  if (v6 === "::1" || v6 === "::") return true;
  if (v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return true; // link-local / ULA
  // IPv4-mapped IPv6 ::ffff:a.b.c.d
  const mapped = v6.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return false;
}

/** Resolves a hostname and returns true only if it maps to at least one public IP
 *  and no private/internal IPs (blocks SSRF to internal infrastructure). */
async function resolvesToPublicOnly(host: string): Promise<boolean> {
  const [a, aaaa] = await Promise.all([dohQuery(host, "A"), dohQuery(host, "AAAA")]);
  const ips = [...a, ...aaaa]
    .filter((r) => r.type === 1 || r.type === 28)
    .map((r: any) => r.data.trim());
  if (ips.length === 0) return false;
  return ips.every((ip) => !isPrivateIp(ip));
}

/** Auto-checks DNS to verify ownership before public can be enabled. */
export const verifyAssociationDomainFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      verified: boolean;
      txtFound: boolean;
      cnameFound: boolean;
      status: string;
    }> => {
      const { data: row, error } = await getDb(context)
        .from("associations")
        .select("custom_domain, domain_verification_token")
        .eq("id", data.associationId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const dom = (row as any)?.custom_domain as string | null;
      const token = (row as any)?.domain_verification_token as string | null;
      if (!dom || !token) throw new Error("NO_DOMAIN");

      // TXT ownership check.
      const txtAnswers = await dohQuery(`_lovable-verify.${dom}`, "TXT");
      const expected = `lovable-verify=${token}`;
      const txtFound = txtAnswers.some((a) =>
        a.data.replace(/^"|"$/g, "").replace(/""/g, "").includes(expected),
      );

      // CNAME routing check (informational; not strictly required for ownership).
      const cnameAnswers = await dohQuery(dom, "CNAME");
      const cnameFound = cnameAnswers.some(
        (a) => a.data.replace(/\.$/, "").toLowerCase() === PLATFORM_CNAME_TARGET,
      );

      const verified = txtFound;
      const status = verified ? "verified" : "failed";

      const upd: Record<string, any> = {
        domain_status: status,
        domain_verified_at: verified ? new Date().toISOString() : null,
      };
      // Ownership confirmed + DNS routed → SSL can begin provisioning.
      if (verified && cnameFound) upd.ssl_status = "provisioning";

      await getDb(context)
        .from("associations")
        .update(upd as any)
        .eq("id", data.associationId);

      return { verified, txtFound, cnameFound, status };
    },
  );

/** Probes the tenant domain over HTTPS to confirm the SSL certificate is live.
 * SSL itself is provisioned by the platform once the domain is connected at the
 * project level; this only reflects the observed certificate state. */
export const checkAssociationSslFn = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d) => z.object({ associationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ sslStatus: string; reachable: boolean }> => {
    const { data: row, error } = await getDb(context)
      .from("associations")
      .select("custom_domain, domain_status")
      .eq("id", data.associationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const dom = (row as any)?.custom_domain as string | null;
    const verified = (row as any)?.domain_status === "verified";
    if (!dom) throw new Error("NO_DOMAIN");
    if (!verified) throw new Error("NOT_VERIFIED");

    let reachable = false;
    // SSRF guard: only probe domains that resolve exclusively to public IPs.
    // A/AAAA records for an admin-controlled domain could point to internal
    // hosts (RFC1918, 169.254.x cloud metadata, loopback), so reject those.
    const hostOk = /^[a-z0-9.-]+$/i.test(dom) && (await resolvesToPublicOnly(dom));
    if (hostOk) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        // A successful HTTPS handshake means a valid certificate is being served.
        const res = await fetch(`https://${dom}/`, {
          method: "HEAD",
          redirect: "manual",
          signal: ctrl.signal,
        });
        clearTimeout(t);
        reachable = res.status > 0;
      } catch {
        reachable = false;
      }
    }

    const sslStatus = reachable ? "active" : "provisioning";
    await getDb(context)
      .from("associations")
      .update({
        ssl_status: sslStatus,
        ssl_checked_at: new Date().toISOString(),
        ssl_active_at: reachable ? new Date().toISOString() : null,
      })
      .eq("id", data.associationId);

    return { sslStatus, reachable };
  });
