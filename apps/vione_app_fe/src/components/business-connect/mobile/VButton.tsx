// BC-Mobile-0B — V button: the visual signature of Business Connect.
// Center action trigger in the bottom nav. It NEVER navigates; it opens
// the VActionSheet. Champagne gold luxury accent, restrained, ≥52×52 touch target.

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { VIconMark } from "./VIconMark";

export function VButton({
  onClick,
  disabled,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("bc.mobile.v.open")}
      aria-disabled={disabled ?? undefined}
      className={cn(
        "group relative grid h-[58px] w-[58px] min-h-[52px] min-w-[52px] place-items-center rounded-full",
        "bg-gradient-to-tr from-[#C29B69] via-[#F6E1C3] to-[#D8B282]",
        "border-2 border-[#FFF2DC] dark:border-[#524128]",
        "shadow-[0_4px_20px_rgba(216,178,130,0.55),0_0_12px_rgba(246,225,195,0.35)]",
        "transition-all duration-200 ease-out cursor-pointer",
        "hover:brightness-105 active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_70%)] pointer-events-none" />
      <VIconMark size={32} />
    </button>
  );
}