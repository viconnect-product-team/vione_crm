// SaveCardButton — BC-2.4 / BC-Mobile-3A. Lets a signed-in visitor save a
// public Business Card as a persistent relationship (Saved Business Card).
// Client-only: it reads the auth session in the browser and toggles the
// owner→card edge via the SDK.
//
// BC-Mobile-3A: identified by PUBLIC SLUG only — the internal card id is
// resolved server-side and never transported to the anonymous page.
//
// For anonymous visitors it renders a "sign in to save" CTA (no redirect) so
// the public profile stays shareable.

import { useEffect, useState } from "react";
import { BookmarkCheck, BookmarkPlus, Loader2, LogIn } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCardSDK } from "@/lib/business-card";
import { useT } from "@/lib/i18n";

type AuthState = "checking" | "anon" | "self" | "ready";

export function SaveCardButton({
  slug,
  source = "profile",
}: {
  slug: string;
  source?: "profile" | "qr" | "nfc" | "url" | "import";
}) {
  const t = useT();
  const [auth, setAuth] = useState<AuthState>("checking");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!active) return;
      if (!uid) {
        setAuth("anon");
        return;
      }
      try {
        const isSaved = await BusinessCardSDK.relationships.isSavedBySlug(slug);
        if (!active) return;
        setSaved(isSaved);
        setAuth("ready");
      } catch (e) {
        if (!active) return;
        // Self-save (own card) or resolution issue — hide the toggle.
        setAuth(e instanceof Error && e.message.includes("SELF") ? "self" : "ready");
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      if (saved) {
        await BusinessCardSDK.relationships.removeBySlug(slug);
        setSaved(false);
      } else {
        await BusinessCardSDK.relationships.saveBySlug(slug, source);
        setSaved(true);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (auth === "checking" || auth === "self") return null;

  if (auth === "anon") {
    return (
      <Link
        to="/auth"
        search={{ redirect: `/b/${slug}` }}
        className="focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl border border-[var(--vba-border-soft)] px-4 py-2 text-[13px] font-semibold text-[var(--vba-text)] hover:bg-[var(--vba-gold-soft)]"
      >
        <LogIn className="h-4 w-4" />
        {t("connect.saveSignIn")}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? t("connect.saved") : t("connect.saveCard")}
        className={`focus-visible:ring-2 focus-visible:ring-[var(--vba-gold)] inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold transition disabled:opacity-60 ${
          saved
            ? "bg-[var(--vba-gold-soft)] text-[var(--vba-gold)]"
            : "bg-[var(--vba-gold)] text-foreground hover:opacity-90"
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <BookmarkPlus className="h-4 w-4" />
        )}
        {saved ? t("connect.saved") : t("connect.saveCard")}
      </button>
      {err ? <span className="text-[11px] text-[var(--vba-danger)]">{err}</span> : null}
    </div>
  );
}
