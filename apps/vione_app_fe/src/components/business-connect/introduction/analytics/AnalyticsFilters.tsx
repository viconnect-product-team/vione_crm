// BC-6.7 — Analytics filters bar.
import { useT } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CONFIDENCE_BUCKETS,
  INTRODUCTION_ANALYTICS_SCOPES,
  PATH_DEPTH_FILTERS,
  type AnalyticsFilters as Filters,
  type ConfidenceBucket,
  type IntroductionAnalyticsScopeType,
  type PathDepthFilter,
} from "@/lib/graph/introduction/analytics";

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
  isAdmin?: boolean;
}

export function AnalyticsFilters({ value, onChange, isAdmin }: Props) {
  const t = useT();
  const allowedScopes = INTRODUCTION_ANALYTICS_SCOPES.filter((s) => s !== "platform" || isAdmin);

  return (
    <div
      role="group"
      aria-label={t("bc.introAnalytics.filters.label")}
      className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ia-scope">{t("bc.introAnalytics.filters.scope")}</Label>
        <Select
          value={value.scope}
          onValueChange={(v) => onChange({ ...value, scope: v as IntroductionAnalyticsScopeType })}
        >
          <SelectTrigger id="ia-scope">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedScopes.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`bc.introAnalytics.scope.${s}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ia-from">{t("bc.introAnalytics.filters.from")}</Label>
        <Input
          id="ia-from"
          type="date"
          value={value.fromDate}
          max={value.toDate}
          onChange={(e) => onChange({ ...value, fromDate: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ia-to">{t("bc.introAnalytics.filters.to")}</Label>
        <Input
          id="ia-to"
          type="date"
          value={value.toDate}
          min={value.fromDate}
          onChange={(e) => onChange({ ...value, toDate: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ia-depth">{t("bc.introAnalytics.filters.pathDepth")}</Label>
        <Select
          value={String(value.pathDepth)}
          onValueChange={(v) => onChange({ ...value, pathDepth: Number(v) as PathDepthFilter })}
        >
          <SelectTrigger id="ia-depth">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PATH_DEPTH_FILTERS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d === 0
                  ? t("bc.introAnalytics.pathDepth.all")
                  : t(`bc.introAnalytics.pathDepth.${d}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ia-conf">{t("bc.introAnalytics.filters.confidence")}</Label>
        <Select
          value={value.confidence}
          onValueChange={(v) => onChange({ ...value, confidence: v as ConfidenceBucket })}
        >
          <SelectTrigger id="ia-conf">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONFIDENCE_BUCKETS.map((c: any) => (
              <SelectItem key={c} value={c}>
                {t(`bc.introAnalytics.confidence.${c}` as never)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
