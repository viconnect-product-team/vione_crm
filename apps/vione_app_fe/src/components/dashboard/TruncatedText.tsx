import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TruncatedTextProps {
  text?: string | null;
  /** Max width class or custom limit (defaults to max-w-[300px] which stretches up to 300px) */
  maxWidth?: string;
  className?: string;
  /** Allow disabling tooltip if needed */
  showTooltip?: boolean;
}

/**
 * Hiển thị nội dung cột CRM tự co dãn vừa khít theo nội dung thật đến tối đa 300px.
 * Nếu vượt quá 300px: tự động hiện dấu ba chấm ... (ellipsis) và hiển thị tooltip
 * chuẩn phong cách Ant Design (nền đen sắc nét #1f1f1f, chữ trắng, mũi tên định hướng, bóng đổ cao cấp).
 */
export function TruncatedText({
  text,
  maxWidth = "max-w-[300px]",
  className = "",
  showTooltip = true,
}: TruncatedTextProps) {
  if (!text) return <span className="text-muted-foreground">-</span>;

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span
            style={{ maxWidth: 300, width: "max-content" }}
            className={`inline-block max-w-[300px] truncate align-middle cursor-pointer select-all transition-colors hover:text-primary ${maxWidth} ${className}`}
          >
            {text}
          </span>
        </TooltipPrimitive.Trigger>
        {showTooltip && (
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="top"
              align="center"
              sideOffset={6}
              className="z-[9999] max-w-sm break-words rounded-[6px] bg-[#1f1f1f] px-2.5 py-1.5 text-xs leading-normal text-white shadow-[0_6px_16px_0_rgba(0,0,0,0.25),0_3px_6px_-4px_rgba(0,0,0,0.35)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              <span>{text}</span>
              <TooltipPrimitive.Arrow className="fill-[#1f1f1f]" width={10} height={5} />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
