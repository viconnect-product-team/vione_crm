// Shared vCard field list — single source of truth for "what you see is
// what you export". Used by the pre-export preview sheet AND the inline
// live preview on the card-scan Review screen, so both render exactly the
// same parsed rows from the real .vcf content.

import { useT, type TKey } from "@/lib/i18n";
import { parseVCardPreview, type VcfPreviewField } from "@/lib/business-connect/mobile/vcf-preview";

export const VCF_FIELD_LABEL_KEY: Record<VcfPreviewField, TKey> = {
  name: "bc.mobile.vcfPreview.field.name",
  company: "bc.mobile.vcfPreview.field.company",
  title: "bc.mobile.vcfPreview.field.title",
  phone: "bc.mobile.vcfPreview.field.phone",
  email: "bc.mobile.vcfPreview.field.email",
  website: "bc.mobile.vcfPreview.field.website",
  cardUrl: "bc.mobile.vcfPreview.field.cardUrl",
  photo: "bc.mobile.vcfPreview.field.photo",
  address: "bc.mobile.vcfPreview.field.address",
  source: "bc.mobile.vcfPreview.field.source",
};

export function VcfPreviewRows({ vcf }: { vcf: string }) {
  const t = useT();
  const rows = parseVCardPreview(vcf);
  return (
    <dl className="divide-y divide-[var(--bc-mobile-border)] border-y border-[var(--bc-mobile-border)]">
      {rows.map((row, i) => (
        <div key={`${row.field}-${i}`} className="flex items-start gap-3 py-2.5">
          <dt className="w-24 shrink-0 pt-0.5 text-[12px] font-medium text-[var(--bc-mobile-muted)]">
            {t(VCF_FIELD_LABEL_KEY[row.field])}
          </dt>
          <dd className="min-w-0 flex-1 break-words text-[14px] leading-snug text-[var(--bc-mobile-text)]">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
