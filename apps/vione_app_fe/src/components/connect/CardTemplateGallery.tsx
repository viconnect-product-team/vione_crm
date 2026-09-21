// Card Template Gallery — modal grid of 12 industry-mapped templates.
// Pure presentation + selection callback. No data access. Filter by industry;
// click a card to preview and apply.

import { useMemo, useState } from "react";
import { Check, Sparkles, AlertTriangle } from "lucide-react";
import { resolveSafeQrColors } from "@/lib/qr-contrast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { baseLang, useT, type Lang } from "@/lib/i18n";
import { useContext } from "react";
import { LangContext } from "@/lib/i18n";
import {
  CARD_INDUSTRIES,
  CARD_TEMPLATE_LIST,
  templatesForIndustry,
  type CardIndustry,
  type CardTemplate,
} from "@/lib/card-templates";

export function CardTemplateGallery({
  currentId,
  onSelect,
  trigger,
}: {
  currentId: string | null | undefined;
  onSelect: (templateId: string) => void;
  trigger: React.ReactNode;
}) {
  const t = useT();
  const { lang } = useContext(LangContext);
  const [open, setOpen] = useState(false);
  const [industry, setIndustry] = useState<CardIndustry | "all">("all");

  const shown = useMemo(() => templatesForIndustry(industry), [industry]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            {t("connect.template.galleryTitle")}
          </DialogTitle>
          <DialogDescription>{t("connect.template.galleryDescription")}</DialogDescription>
        </DialogHeader>

        <div
          className="flex flex-wrap gap-1.5 pb-3 border-b"
          role="tablist"
          aria-label={t("connect.template.filterLabel")}
        >
          <IndustryChip
            active={industry === "all"}
            onClick={() => setIndustry("all")}
            label={t("connect.industry.all")}
          />
          {CARD_INDUSTRIES.map((i) => (
            <IndustryChip
              key={i}
              active={industry === i}
              onClick={() => setIndustry(i)}
              label={t(`connect.industry.${i}` as never)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-auto pt-3">
          {shown.map((tpl) => (
            <TemplateTile
              key={tpl.id}
              template={tpl}
              lang={lang}
              selected={currentId === tpl.id}
              onSelect={() => {
                onSelect(tpl.id as string);
                setOpen(false);
              }}
            />
          ))}
          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
              {t("connect.template.emptyFilter")}
            </p>
          )}
        </div>

        <p className="pt-2 text-xs text-muted-foreground">
          {t("connect.template.footerHint").replace("{count}", String(CARD_TEMPLATE_LIST.length))}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function IndustryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "text-xs px-2.5 py-1 rounded-full border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

function TemplateTile({
  template,
  lang,
  selected,
  onSelect,
}: {
  template: CardTemplate;
  lang: Lang;
  selected: boolean;
  onSelect: () => void;
}) {
  // Auto-suggest safe QR colours so we can flag templates whose native
  // pairing (accent-on-surface gradient) can't be handed to the QR encoder.
  const safeQr = resolveSafeQrColors({
    requestedDark: template.accent,
    requestedLight: template.surface,
    theme: template,
  });
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={template.label}
      className={cn(
        "group relative text-left rounded-xl border overflow-hidden transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="h-32 relative" style={{ background: template.surface }}>
        <div
          className="absolute inset-x-3 top-3 h-px opacity-60"
          style={{ backgroundColor: template.accent }}
        />
        <div className="absolute left-3 bottom-3 right-3">
          <div
            className="text-[13px] font-semibold leading-tight"
            style={{
              color: template.text,
              fontFamily: `"${template.headingFont}", serif`,
            }}
          >
            {template.label}
          </div>
          <div
            className="text-[10px] uppercase tracking-widest mt-0.5"
            style={{ color: template.accent, fontFamily: `"${template.bodyFont}", sans-serif` }}
          >
            {template.layout}
          </div>
        </div>
        {selected && (
          <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
            <Check className="size-3.5" />
          </div>
        )}
        {safeQr.substituted && (
          <div
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-warning/95 border border-warning px-1.5 py-0.5 text-[10px] font-medium text-warning shadow-sm"
            title={`QR ${safeQr.report.ratio.toFixed(1)}:1 → auto-safe`}
          >
            <AlertTriangle className="h-3 w-3" />
            QR
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5 bg-card">
        <p className="text-xs text-muted-foreground line-clamp-2">{template.tagline[baseLang(lang)]}</p>
        <div className="flex flex-wrap gap-1">
          {template.industries.slice(0, 3).map((i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {i}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
