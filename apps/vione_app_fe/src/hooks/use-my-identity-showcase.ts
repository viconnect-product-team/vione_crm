// BC-Mobile — showcase (lĩnh vực kinh doanh + khách hàng) của người đang đăng nhập.
// Cache tách theo viewer để không rò dữ liệu giữa các tài khoản.

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bcIdentityShowcaseGetMineFn } from "@/lib/business-connect/mobile/identity-showcase.functions";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

export function useMyIdentityShowcase(options?: { enabled?: boolean }) {
  const viewerUserId = useViewerUserId();
  const getMine = useServerFn(bcIdentityShowcaseGetMineFn);
  return useQuery({
    queryKey: ["bc-mobile", "identity", "showcase", viewerUserId ?? "anon"] as const,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    queryFn: async () => (await getMine()) ?? { businessAreas: [], clients: [], metrics: [], interests: [], clientMetrics: [] },
  });
}
