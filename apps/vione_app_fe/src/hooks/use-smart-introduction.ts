// BC-6.1 — useSmartIntroduction hook.
// Read-only query wrapper over SmartIntroductionSDK. RLS is enforced server-
// side; this hook never touches raw fetch. Auto-disabled without a target.

import { useQuery } from "@tanstack/react-query";
import { SmartIntroductionSDK } from "@/lib/graph";
import type { SmartIntroductionPageDTO } from "@/lib/graph";

export const smartIntroductionQueryKey = (
  targetPersonNodeId: string | undefined,
  opts?: { maxDepth?: 2 | 3; limit?: number },
) =>
  [
    "smart-introduction",
    "v1",
    targetPersonNodeId ?? null,
    opts?.maxDepth ?? 2,
    opts?.limit ?? 10,
  ] as const;

export function useSmartIntroduction(
  targetPersonNodeId: string | undefined,
  opts: { maxDepth?: 2 | 3; limit?: number; enabled?: boolean } = {},
) {
  return useQuery<SmartIntroductionPageDTO>({
    queryKey: smartIntroductionQueryKey(targetPersonNodeId, opts),
    queryFn: () =>
      SmartIntroductionSDK.findPaths({
        targetPersonNodeId: targetPersonNodeId!,
        maxDepth: opts.maxDepth ?? 2,
        limit: opts.limit ?? 10,
      }),
    enabled: Boolean(targetPersonNodeId) && (opts.enabled ?? true),
    staleTime: 60_000,
    retry: 1,
  });
}
