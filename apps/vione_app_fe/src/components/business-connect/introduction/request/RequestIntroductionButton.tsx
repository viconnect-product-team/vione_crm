// BC-6.2 — "Request introduction" action on a Smart Introduction path.
// Hidden for unsupported paths (depth !== 2). Opens dialog.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { SmartIntroductionPathDTO } from "@/lib/graph";
import { RequestIntroductionDialog } from "./RequestIntroductionDialog";

interface Props {
  path: SmartIntroductionPathDTO;
  targetLabel: string;
  intermediaryLabel: string;
  disabled?: boolean;
}

export function RequestIntroductionButton({
  path,
  targetLabel,
  intermediaryLabel,
  disabled,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);

  // 2-hop only for v1.
  if (path.depth !== 2) return null;

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={t("bc.introReq.action.label", { name: intermediaryLabel })}
      >
        {t("bc.introReq.action.request")}
      </Button>
      {open && (
        <RequestIntroductionDialog
          open={open}
          onOpenChange={setOpen}
          path={path}
          targetLabel={targetLabel}
          intermediaryLabel={intermediaryLabel}
        />
      )}
    </>
  );
}
