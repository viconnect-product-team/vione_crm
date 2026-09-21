// Kho danh thiếp (Card Vault) — hợp nhất hai nguồn CHÍNH DANH đã có:
//   1. Danh thiếp số đã lưu  → saved_business_cards (SavedCardSDK)
//   2. Danh thiếp giấy đã quét / khách chia sẻ → guest_contacts (GuestContactSDK)
//
// Không tạo backend song song: mọi đọc/ghi đều đi qua contract sẵn có và RLS
// giới hạn theo chủ sở hữu. Khoá cache luôn gắn viewerKey để không lẫn dữ liệu
// giữa các tài khoản.

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SavedCardSDK } from "@/lib/business-card/saved-card.sdk";
import { GuestContactSDK } from "@/lib/business-card/guest-contact.sdk";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";
import type { SavedCard } from "@/lib/business-card/relationship.types";
import type { GuestContact } from "@/lib/business-card/guest-contact";

export type CardVaultKind = "saved_card" | "scanned";

export type CardVaultItem = {
  /** `c:<targetCardId>` hoặc `g:<guestContactId>` — ổn định, an toàn cho URL. */
  key: string;
  kind: CardVaultKind;
  /** targetCardId (saved) | guestContactId (scanned) — khoá ghi của từng nguồn. */
  refId: string;
  displayName: string | null;
  title: string | null;
  companyName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  /** Nhãn riêng tư của chủ sở hữu. */
  labels: string[];
  /** Ghi chú riêng tư của chủ sở hữu. */
  note: string | null;
  /** Mốc thời gian dùng để sắp xếp (mới nhất trước). */
  sortAt: string;
};

export const cardVaultKeys = {
  root: ["bc-mobile", "card-vault"] as const,
  list: (viewerKey: string) => [...cardVaultKeys.root, viewerKey] as const,
};

function savedToItem(card: SavedCard): CardVaultItem {
  return {
    key: `c:${card.targetCardId}`,
    kind: "saved_card",
    refId: card.targetCardId,
    displayName: card.target.displayName,
    title: card.target.professionalTitle,
    companyName: card.target.companyName ?? card.company,
    avatarUrl: card.target.avatarUrl,
    phone: null,
    email: null,
    website: null,
    address: null,
    labels: card.tags ?? [],
    note: card.notes,
    sortAt: card.savedAt ?? card.createdAt ?? "",
  };
}

function guestToItem(g: GuestContact): CardVaultItem {
  return {
    key: `g:${g.id}`,
    kind: "scanned",
    refId: g.id,
    displayName: g.displayName,
    title: g.title,
    companyName: g.companyName,
    avatarUrl: null,
    phone: g.phone,
    email: g.email,
    website: g.website,
    address: g.address,
    labels: g.ownerLabel ? [g.ownerLabel] : [],
    note: g.ownerNote,
    sortAt: g.firstCapturedAt ?? g.lastSharedAt ?? g.firstSharedAt ?? "",
  };
}

export function useCardVault(search: string, kind: CardVaultKind | "all") {
  const viewerUserId = useViewerUserId();
  const viewerKey = viewerUserId ?? "anonymous";

  const query = useQuery({
    queryKey: cardVaultKeys.list(viewerKey),
    enabled: Boolean(viewerUserId),
    queryFn: async (): Promise<CardVaultItem[]> => {
      const [saved, guests] = await Promise.all([
        SavedCardSDK.search({ archived: false }).catch(() => [] as SavedCard[]),
        GuestContactSDK.listMine().catch(() => [] as GuestContact[]),
      ]);
      return [...saved.map(savedToItem), ...guests.map(guestToItem)].sort((a, b) =>
        b.sortAt.localeCompare(a.sortAt),
      );
    },
  });

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? [])
      .filter((i) => kind === "all" || i.kind === kind)
      .filter((i) => {
        if (!term) return true;
        return [i.displayName, i.companyName, i.title, i.note, ...i.labels]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(term));
      });
  }, [query.data, search, kind]);

  return {
    items,
    viewerKey,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCardVaultMutations(viewerKey: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: cardVaultKeys.list(viewerKey) });
    void qc.invalidateQueries({ queryKey: ["bc-mobile", "network"] });
    void qc.invalidateQueries({ queryKey: ["saved-cards"] });
  };

  const save = useMutation({
    mutationFn: async (input: { item: CardVaultItem; labels: string[]; note: string | null }) => {
      const { item, labels, note } = input;
      if (item.kind === "saved_card") {
        await SavedCardSDK.setNote(item.refId, note);
        await SavedCardSDK.tags.setForCard(item.refId, labels);
        return;
      }
      await GuestContactSDK.updateOwnerFields(item.refId, {
        ownerLabel: labels[0] ?? null,
        ownerNote: note,
      });
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (item: CardVaultItem) => {
      if (item.kind === "saved_card") {
        await SavedCardSDK.remove(item.refId);
        return;
      }
      await GuestContactSDK.deleteMine(item.refId);
    },
    onSuccess: invalidate,
  });

  return { save, remove };
}
