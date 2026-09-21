import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface TruncatedTextProps {
  text?: string | null;
  maxWidth?: string;
  className?: string;
}

export function TruncatedText({ text, maxWidth = "max-w-[220px]", className = "" }: TruncatedTextProps) {
  if (!text) return <span>-</span>;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`block truncate cursor-pointer select-all transition-colors hover:text-primary ${maxWidth} ${className}`}>
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-sm break-words z-50 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
