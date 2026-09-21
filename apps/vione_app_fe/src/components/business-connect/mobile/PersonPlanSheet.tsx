// BC-Mobile-6D — PersonPlanSheet.
// Tạo kế hoạch RIÊNG TƯ (việc theo dõi / cuộc gặp dự kiến) gắn với một người
// đã được uỷ quyền. Không mời, không thông báo cho người kia — phụ đề nói rõ.
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { bcMobilePersonPlanCreateFn } from "@/lib/business-connect/mobile/person-plan.functions";
import {
  PERSON_PLAN_MAX_LOCATION_LEN,
  PERSON_PLAN_MAX_NOTE_LEN,
  PERSON_PLAN_MAX_TITLE_LEN,
  type BcMobilePersonPlanKind,
} from "@/lib/business-connect/mobile/person-plan.types";

export type PersonPlanSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string;
  personName: string;
  kind: BcMobilePersonPlanKind;
  onCreated?: () => void;
};

const PRESETS: { key: TKey; days: number }[] = [
  { key: "bc.mobile.plan.preset.tomorrow", days: 1 },
  { key: "bc.mobile.plan.preset.in3days", days: 3 },
  { key: "bc.mobile.plan.preset.nextWeek", days: 7 },
  { key: "bc.mobile.plan.preset.in2weeks", days: 14 },
];

/** `datetime-local` value (giờ địa phương) cho N ngày tới, 09:00. */
function localValue(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PersonPlanSheet({
  open,
  onOpenChange,
  personId,
  personName,
  kind,
  onCreated,
}: PersonPlanSheetProps) {
  const t = useT();
  const createPlan = useServerFn(bcMobilePersonPlanCreateFn);
  const [when, setWhen] = useState(() => localValue(1));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const dueAt = new Date(when).toISOString();
      return createPlan({
        data: {
          personId,
          kind,
          dueAt,
          title: title.trim() || null,
          note: note.trim() || null,
          locationLabel: kind === "meeting" ? location.trim() || null : null,
        },
      });
    },
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(t(`bc.mobile.plan.error.${res.error}` as TKey));
        return;
      }
      toast.success(
        t(kind === "meeting" ? "bc.mobile.plan.saved.meeting" : "bc.mobile.plan.saved.followUp"),
      );
      setTitle("");
      setNote("");
      setLocation("");
      onCreated?.();
      onOpenChange(false);
    },
    onError: () => toast.error(t("bc.mobile.plan.error.unavailable")),
  });

  const busy = mutation.isPending;
  const label = "text-xs font-medium text-muted-foreground";

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <DrawerContent className="bc-app">
        <DrawerHeader className="relative border-b border-border px-4 pb-3 text-left">
          <DrawerTitle className="text-base font-semibold">
            {t(
              kind === "meeting"
                ? "bc.mobile.plan.sheet.meeting.title"
                : "bc.mobile.plan.sheet.followUp.title",
            )}
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-xs text-muted-foreground">
            {t("bc.mobile.plan.sheet.subtitle", { name: personName })}
          </DrawerDescription>
          <DrawerClose asChild>
            <button
              type="button"
              disabled={busy}
              aria-label={t("bc.mobile.sheet.close")}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--bc-mobile-surface)] disabled:opacity-40"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            <span className={label}>{t("bc.mobile.plan.field.when")}</span>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {PRESETS.map((p) => {
                const value = localValue(p.days);
                const active = value === when;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setWhen(value)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {t(p.key)}
                  </button>
                );
              })}
            </div>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-label={t("bc.mobile.plan.field.when")}
              data-testid="bc6d-plan-when"
            />
          </div>

          <div className="space-y-2">
            <span className={label}>{t("bc.mobile.plan.field.title")}</span>
            <Input
              value={title}
              maxLength={PERSON_PLAN_MAX_TITLE_LEN}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("bc.mobile.plan.field.title.placeholder")}
              aria-label={t("bc.mobile.plan.field.title")}
            />
          </div>

          {kind === "meeting" ? (
            <div className="space-y-2">
              <span className={label}>{t("bc.mobile.plan.field.location")}</span>
              <Input
                value={location}
                maxLength={PERSON_PLAN_MAX_LOCATION_LEN}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("bc.mobile.plan.field.location.placeholder")}
                aria-label={t("bc.mobile.plan.field.location")}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <span className={label}>{t("bc.mobile.plan.field.note")}</span>
            <Textarea
              value={note}
              maxLength={PERSON_PLAN_MAX_NOTE_LEN}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("bc.mobile.plan.field.note.placeholder")}
              aria-label={t("bc.mobile.plan.field.note")}
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={busy || !when}
            data-testid="bc6d-plan-save"
            onClick={() => mutation.mutate()}
          >
            {busy ? t("bc.mobile.plan.saving") : t("bc.mobile.plan.save")}
          </Button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </DrawerContent>
    </Drawer>
  );
}
