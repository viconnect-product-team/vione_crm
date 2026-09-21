import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/dashboard/StateKit";
import { GlobalCardBuilder } from "@/components/connect/GlobalCardBuilder";
import { BusinessCardSDK } from "@/lib/business-card";
import type { BusinessCard } from "@/lib/business-card/business-card.types";

export const Route = createFileRoute("/connect/cards/$cardId/edit")({
  ssr: false,
  component: ConnectCardEditPage,
});

function ConnectCardEditPage() {
  const { cardId } = useParams({ from: "/connect/cards/$cardId/edit" });
  const navigate = useNavigate();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    BusinessCardSDK.getGlobal(cardId)
      .then((c) => active && setCard(c))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Error"));
    return () => {
      active = false;
    };
  }, [cardId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <ErrorState description={error} onRetry={() => navigate({ to: "/connect/cards" })} />
      </div>
    );
  }
  if (!card) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <GlobalCardBuilder card={card} />;
}
