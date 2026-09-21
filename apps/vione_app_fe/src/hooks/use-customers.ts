// BC-Mobile-8A — "Khách hàng của tôi" (viewer-scoped cache key).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bcMobileCustomerCreateFn,
  bcMobileCustomerDeleteFn,
  bcMobileCustomerLogAddFn,
  bcMobileCustomerLogsFn,
  bcMobileCustomerNeedAddFn,
  bcMobileCustomerNeedDeleteFn,
  bcMobileCustomerNeedUpdateFn,
  bcMobileCustomerNeedsFn,
  bcMobileCustomerSetTagsFn,
  bcMobileCustomerTagCreateFn,
  bcMobileCustomerTagDeleteFn,
  bcMobileCustomerTagRenameFn,
  bcMobileCustomerTagSuggestFeedbackFn,
  bcMobileCustomerTagSuggestFeedbackListFn,
  bcMobileCustomerTagSuggestFn,
  bcMobileCustomerTagSuggestHistoryFn,
  bcMobileCustomerTagsFn,
  bcMobileCustomerUpdateFn,
  bcMobileCustomersFn,
} from "@/lib/business-connect/mobile/customer.functions";
import type {
  BcCustomer,
  BcCustomerLog,
  BcCustomerNeed,
  BcCustomerTag,
  BcCustomerTagSuggestionFeedback,
  BcCustomerTagSuggestionRun,
} from "@/lib/business-connect/mobile/customer.types";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

export const customerKeys = {
  root: ["bc-mobile", "customers"] as const,
  list: (viewerId: string) => [...customerKeys.root, viewerId] as const,
  logs: (viewerId: string, customerId: string) =>
    [...customerKeys.root, viewerId, "logs", customerId] as const,
  tags: (viewerId: string) => [...customerKeys.root, viewerId, "tags"] as const,
  tagSuggestRuns: (viewerId: string, customerId: string) =>
    [...customerKeys.root, viewerId, "tag-suggest-runs", customerId] as const,
  tagSuggestFeedback: (viewerId: string, customerId: string) =>
    [...customerKeys.root, viewerId, "tag-suggest-feedback", customerId] as const,
};

export function useCustomers() {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();
  const key = customerKeys.list(viewerId ?? "viewer-pending");

  const query = useQuery({
    queryKey: key,
    enabled: viewerId !== null,
    staleTime: 30_000,
    queryFn: async () => {
      const res: any = await bcMobileCustomersFn();
      if (res?.ok && Array.isArray(res?.customers)) return res.customers;
      if (Array.isArray(res?.customers)) return res.customers;
      if (Array.isArray(res)) return res;
      return [];
    },
  });

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: customerKeys.root });
  };

  const create = useMutation({
    mutationFn: (input: {
      personId: string;
      displayName?: string | null;
      companyName?: string | null;
      stage?: BcCustomer["stage"];
      expectedValue?: number | null;
      currency?: "VND" | "USD";
      sourceLabel?: string | null;
      note?: string | null;
      nextActionAt?: string | null;
    }) => bcMobileCustomerCreateFn({ data: input }),
    onSuccess: async (res: any) => {
      const newCust = res?.customer || res;
      if (newCust && newCust.id) {
        qc.setQueryData(key, (old: BcCustomer[] | undefined) => {
          if (!old) return [newCust];
          if (old.some((c) => c.id === newCust.id)) return old;
          return [newCust, ...old];
        });
      }
      await invalidate();
    },
  });

  const update = useMutation({
    mutationFn: (input: {
      customerId: string;
      stage?: BcCustomer["stage"];
      expectedValue?: number | null;
      currency?: "VND" | "USD";
      sourceLabel?: string | null;
      note?: string | null;
      nextActionAt?: string | null;
    }) => bcMobileCustomerUpdateFn({ data: input }),
    onSuccess: async (res: any) => {
      const updated = res?.customer || res;
      if (updated && updated.id) {
        qc.setQueryData(key, (old: BcCustomer[] | undefined) => {
          if (!old) return [updated];
          return old.map((c) => (c.id === updated.id ? { ...c, ...updated } : c));
        });
      }
      await invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (customerId: string) => bcMobileCustomerDeleteFn({ data: { customerId } }),
    onSuccess: async (_data, customerId) => {
      qc.setQueryData(key, (old: BcCustomer[] | undefined) => {
        if (!old) return [];
        return old.filter((c) => c.id !== customerId);
      });
      await invalidate();
    },
  });

  const setTags = useMutation({
    mutationFn: (input: { customerId: string; names: string[] }) =>
      bcMobileCustomerSetTagsFn({ data: input }),
    onSuccess: invalidate,
  });

  return {
    setTags,
    customers: (query.data ?? []) as BcCustomer[],
    initialLoading: query.isPending && viewerId !== null,
    error: query.isError,
    retry: () => void query.refetch(),
    create,
    update,
    remove,
  };
}

/** Gợi ý nhãn từ lịch sử chăm sóc + ghi chú của một khách hàng. */
export function useCustomerTagSuggestions(customerId: string | null) {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sources?: { note: boolean; logs: boolean; needs: boolean }) =>
      bcMobileCustomerTagSuggestFn({
        data: { customerId: customerId as string, ...(sources ? { sources } : {}) },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: customerKeys.tagSuggestRuns(viewerId ?? "viewer-pending", customerId ?? "none"),
      });
    },
  });
}

/** Lịch sử các lần gợi ý nhãn của một khách hàng (riêng tư theo người xem). */
export function useCustomerTagSuggestionHistory(customerId: string | null, enabled: boolean) {
  const viewerId = useViewerUserId();
  const query = useQuery({
    queryKey: customerKeys.tagSuggestRuns(viewerId ?? "viewer-pending", customerId ?? "none"),
    enabled: enabled && viewerId !== null && customerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await bcMobileCustomerTagSuggestHistoryFn({
        data: { customerId: customerId as string },
      });
      return res.ok ? res.runs : [];
    },
  });
  return {
    runs: (query.data ?? []) as BcCustomerTagSuggestionRun[],
    loading: query.isPending && enabled,
    error: query.isError,
  };
}

/** Phản hồi Đúng/Sai cho từng nhãn được gợi ý (riêng tư theo người xem). */
export function useCustomerTagSuggestionFeedback(customerId: string | null) {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();
  const key = customerKeys.tagSuggestFeedback(viewerId ?? "viewer-pending", customerId ?? "none");

  const query = useQuery({
    queryKey: key,
    enabled: viewerId !== null && customerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await bcMobileCustomerTagSuggestFeedbackListFn({
        data: { customerId: customerId as string },
      });
      return res.ok ? res.feedback : [];
    },
  });

  const submit = useMutation({
    mutationFn: (input: { tagName: string; verdict: "good" | "bad"; runId?: string | null }) =>
      bcMobileCustomerTagSuggestFeedbackFn({
        data: { customerId: customerId as string, ...input },
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  });

  const list = (query.data ?? []) as BcCustomerTagSuggestionFeedback[];
  const verdictOf = (tagName: string) =>
    list.find((f) => f.tagName.toLowerCase() === tagName.toLowerCase())?.verdict ?? null;

  return { feedback: list, verdictOf, submit };
}

export function useCustomerLogs(customerId: string | null) {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: customerKeys.logs(viewerId ?? "viewer-pending", customerId ?? "none"),
    enabled: viewerId !== null && customerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await bcMobileCustomerLogsFn({ data: { customerId: customerId as string } });
      return res.ok ? res.logs : [];
    },
  });

  const add = useMutation({
    mutationFn: (input: {
      kind: "call" | "meeting" | "email" | "message" | "note";
      body?: string | null;
      occurredAt?: string | null;
    }) => bcMobileCustomerLogAddFn({ data: { customerId: customerId as string, ...input } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: customerKeys.root }),
  });

  return {
    logs: (query.data ?? []) as BcCustomerLog[],
    loading: query.isPending && customerId !== null,
    add,
  };
}

/** Danh mục nhãn riêng của chủ tài khoản (dùng để lọc và chạy chiến dịch). */
export function useCustomerTags() {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: customerKeys.tags(viewerId ?? "viewer-pending"),
    enabled: viewerId !== null,
    staleTime: 60_000,
    queryFn: async () => {
      const res: any = await bcMobileCustomerTagsFn();
      if (res?.ok && Array.isArray(res?.tags)) return res.tags;
      if (Array.isArray(res?.tags)) return res.tags;
      if (Array.isArray(res)) return res;
      return [];
    },
  });

  const tagKey = customerKeys.tags(viewerId ?? "viewer-pending");

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: customerKeys.root });
  };

  const create = useMutation({
    mutationFn: (name: string) => bcMobileCustomerTagCreateFn({ data: { name } }),
    onSuccess: async (res: any) => {
      const newTag = res?.tag || res;
      if (newTag && newTag.id) {
        qc.setQueryData(tagKey, (old: BcCustomerTag[] | undefined) => {
          if (!old) return [newTag];
          if (old.some((t) => t.id === newTag.id)) return old;
          return [...old, newTag];
        });
      }
      await invalidate();
    },
  });

  const rename = useMutation({
    mutationFn: (input: { tagId: string; name: string }) =>
      bcMobileCustomerTagRenameFn({ data: input }),
    onSuccess: async (res: any, variables) => {
      const updated = res?.tag || res;
      qc.setQueryData(tagKey, (old: BcCustomerTag[] | undefined) => {
        if (!old) return [];
        return old.map((t) => (t.id === variables.tagId ? { ...t, name: variables.name, ...(updated?.id ? updated : {}) } : t));
      });
      await invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (tagId: string) => bcMobileCustomerTagDeleteFn({ data: { tagId } }),
    onSuccess: async (_data, tagId) => {
      qc.setQueryData(tagKey, (old: BcCustomerTag[] | undefined) => {
        if (!old) return [];
        return old.filter((t) => t.id !== tagId);
      });
      await invalidate();
    },
  });

  return {
    tags: (query.data ?? []) as BcCustomerTag[],
    loading: query.isPending && viewerId !== null,
    create,
    rename,
    remove,
  };
}

/** Điểm đau & nhu cầu của một khách hàng (riêng tư theo chủ tài khoản). */
export function useCustomerNeeds(customerId: string | null) {
  const viewerId = useViewerUserId();
  const qc = useQueryClient();
  const key = [...customerKeys.root, viewerId ?? "viewer-pending", "needs", customerId ?? "none"];

  const query = useQuery({
    queryKey: key,
    enabled: viewerId !== null && customerId !== null,
    staleTime: 15_000,
    queryFn: async () => {
      const res = await bcMobileCustomerNeedsFn({ data: { customerId: customerId as string } });
      return res.ok ? res.needs : [];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: customerKeys.root });

  const add = useMutation({
    mutationFn: (input: {
      kind: BcCustomerNeed["kind"];
      body: string;
      priority?: BcCustomerNeed["priority"];
    }) => bcMobileCustomerNeedAddFn({ data: { customerId: customerId as string, ...input } }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (input: {
      needId: string;
      body?: string;
      priority?: BcCustomerNeed["priority"];
      status?: "open" | "resolved";
    }) => bcMobileCustomerNeedUpdateFn({ data: input }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (needId: string) => bcMobileCustomerNeedDeleteFn({ data: { needId } }),
    onSuccess: invalidate,
  });

  return {
    needs: (query.data ?? []) as BcCustomerNeed[],
    loading: query.isPending && customerId !== null,
    add,
    update,
    remove,
  };
}
