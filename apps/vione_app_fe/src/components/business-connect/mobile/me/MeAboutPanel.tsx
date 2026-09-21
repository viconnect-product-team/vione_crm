// BC-Mobile — "Về tôi" (một panel duy nhất).
// Gộp giới thiệu + (nếu có) dấu ấn/quan tâm vào MỘT card. Không bịa dữ liệu:
// bio lấy từ BusinessIdentity; nếu trống thì chỉ hiện gợi ý cho chủ sở hữu.

import { ChevronRight, User } from "lucide-react";
import { useT } from "@/lib/i18n";

export function MeAboutPanel({
  bio,
  metrics = [],
  interests = [],
  onEdit,
}: {
  bio: string | null;
  metrics?: { id: string; value: string; label: string }[];
  interests?: { id: string; label: string }[];
  onEdit: () => void;
}) {
  const t = useT();
  const text = bio?.trim() || null;

  return (
    <section
      aria-labelledby="me-about-title"
      className="rounded-2xl bc-translucent-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="me-about-title"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--bc-mobile-text)]"
        >
          <User
            aria-hidden="true"
            className="h-4 w-4 text-[#D8B282]"
            strokeWidth={1.8}
          />
          {t("bc.mobile.me.aboutTitle")}
        </h2>
        {text && (
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-11 items-center gap-0.5 text-[12.5px] font-medium text-[#D4C3A3] transition-colors hover:text-[#D8B282] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] motion-reduce:transition-none"
          >
            {t("bc.mobile.me.viewMore")}
            <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {text ? (
        <p className="mt-2 line-clamp-4 whitespace-pre-line break-words text-[13.5px] leading-relaxed text-[#D4C3A3]">
          {text}
        </p>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl bg-white/[0.03] border border-[#D8B282]/20 px-4 text-[13.5px] font-medium text-[#D4C3A3] transition-colors hover:border-[#D8B282]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B282] motion-reduce:transition-none"
        >
          {t("bc.mobile.me.aboutEmpty")}
          <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
        </button>
      )}

      {metrics.length > 0 && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--bc-mobile-border)]/60 pt-4">
          {metrics.slice(0, 3).map((m) => (
            <div key={m.id} className="min-w-0 text-center">
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <span className="block break-words text-[20px] font-semibold text-[var(--bc-mobile-accent)]">
                  {m.value}
                </span>
                <span className="mt-0.5 block break-words text-[11.5px] leading-snug text-[var(--bc-mobile-muted)]">
                  {m.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {interests.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {interests.map((tag) => (
            <li
              key={tag.id}
              className="rounded-full border border-[var(--bc-mobile-border)] bg-[var(--bc-mobile-surface-2)]/60 px-3 py-1.5 text-[12.5px] font-medium text-[var(--bc-mobile-text-2)]"
            >
              {tag.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
