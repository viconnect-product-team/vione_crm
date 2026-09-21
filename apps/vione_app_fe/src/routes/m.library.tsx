// ============= Full file contents =============

import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { MemberHeader } from "@/components/member/MemberShell";
import { useServerData } from "@/hooks/use-server-data";
import { listDocuments, type LibraryDoc } from "@/lib/member-app.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/m/library")({
  component: LibraryScreen,
});

function LibraryScreen() {
  const t = useT();
  const fetchDocs = useServerFn(listDocuments);
  const { data: docs, loading } = useServerData<LibraryDoc[]>(() => fetchDocs(), []);

  return (
    <div className="vba-animate">
      <MemberHeader title={t("m.library.title")} back />

      <div className="mt-3 space-y-2.5 px-4">
        {loading && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.library.loading")}
          </p>
        )}
        {!loading && docs.length === 0 && (
          <p className="py-10 text-center text-[13px] text-[var(--vba-text-dim)]">
            {t("m.library.empty")}
          </p>
        )}
        {docs.map((d) => (
          <div key={d.id} className="vba-card flex items-center gap-3 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--vba-surface-2)] text-[var(--vba-gold)]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-[var(--vba-text)]">
                {d.name}
              </div>
              <div className="truncate text-[11px] text-[var(--vba-text-muted)]">
                {[d.category, d.type?.toUpperCase(), d.size, d.time].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
