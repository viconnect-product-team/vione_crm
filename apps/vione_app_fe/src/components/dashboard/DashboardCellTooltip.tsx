import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export interface DashboardCellTooltipProps {
  /** Nội dung text cần hiển thị */
  text?: string | number | null;
  /** Custom children nếu không truyền text */
  children?: React.ReactNode;
  /** Nội dung hiển thị trong tooltip (mặc định lấy text nếu không truyền) */
  tooltip?: React.ReactNode;
  /** Lớp giới hạn chiều rộng tối đa (mặc định max-w-[260px]) */
  maxWidth?: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Bật/tắt tooltip */
  showTooltip?: boolean;
}

/**
 * Component chuẩn hóa hiển thị dữ liệu văn bản trên Dashboard & Bảng biểu CRM:
 * - Khi văn bản ngắn: hiển thị trọn vẹn, không cắt xén.
 * - Khi văn bản dài vượt quá khung: tự động hiện dấu ba chấm ellipsis (...)
 * - Hover chuột: hiển thị tooltip nổi sắc nét chuẩn phong cách Dashboard cao cấp, hiển thị 100% nội dung.
 */
export function DashboardCellTooltip({
  text,
  children,
  tooltip,
  maxWidth = "max-w-[260px]",
  className = "",
  side = "top",
  align = "center",
  showTooltip = true,
}: DashboardCellTooltipProps) {
  const displayContent = children ?? (text !== undefined && text !== null ? String(text) : "");
  const tooltipContent = tooltip ?? (typeof text === "string" || typeof text === "number" ? String(text) : displayContent);

  if (!displayContent && displayContent !== 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const triggerNode = (
    <span
      className={`inline-block truncate align-middle cursor-default transition-colors hover:text-foreground/90 ${maxWidth} ${className}`}
    >
      {displayContent}
    </span>
  );

  if (!showTooltip || !tooltipContent) {
    return triggerNode;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{triggerNode}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className="z-[9999] max-w-md break-words rounded-lg border border-white/10 bg-[#16181d] px-3 py-2 text-xs font-medium leading-relaxed text-slate-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.4)] backdrop-blur-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            <div>{tooltipContent}</div>
            <TooltipPrimitive.Arrow className="fill-[#16181d]" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export default DashboardCellTooltip;
