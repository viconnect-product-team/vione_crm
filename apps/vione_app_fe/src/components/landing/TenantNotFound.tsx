import { Globe } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useT } from "@/lib/i18n";

/** Shown when a tenant hostname doesn't match any association or the landing isn't published. */
export function TenantNotFound({ host }: { host?: string }) {
  const t = useT();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-end px-5 py-5">
        <LangSwitcher />
      </header>
      <main className="mx-auto flex max-w-lg flex-col items-center px-5 pt-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{t("tenant.nf.title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("tenant.nf.desc")}</p>
        {host && (
          <code className="mt-4 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            {host}
          </code>
        )}
        <a
          href="https://qlhh.lovable.app/landing"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {t("tenant.nf.home")}
        </a>
      </main>
    </div>
  );
}
