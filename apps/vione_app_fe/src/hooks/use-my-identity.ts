// BC-Mobile — nguồn dữ liệu danh tính DUY NHẤT của người dùng đang đăng nhập.
//
// Trước đây mỗi màn (Trang chủ, V-Sheet, Tôi, Chỉnh sửa) tự gọi
// bcIdentityGetMineFn riêng lẻ nên ảnh đại diện lệch nhau sau khi cập nhật.
// Hook này gom về một khoá cache theo viewer để mọi vị trí đồng bộ tức thì.

import { useCallback, useContext } from "react";
import { useQuery, QueryClientContext, QueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bcIdentityGetMineFn } from "@/lib/business-connect/mobile/identity.functions";
import { useViewerUserId } from "@/hooks/use-viewer-user-id";

const fallbackClient = new QueryClient();

export function myIdentityQueryKey(viewerUserId: string | null | undefined) {
  return ["bc-mobile", "identity", "mine", viewerUserId ?? "anon"] as const;
}

export function useMyIdentity(options?: { enabled?: boolean }) {
  const viewerUserId = useViewerUserId();
  const getMine = useServerFn(bcIdentityGetMineFn);
  const client = useContext(QueryClientContext);

  const query = useQuery(
    {
      queryKey: myIdentityQueryKey(viewerUserId),
      enabled: Boolean(client) && (options?.enabled ?? true),
      staleTime: 30_000,
      queryFn: async () => (await getMine()) ?? null,
    },
    client ?? fallbackClient,
  );

  if (!client) {
    return { data: null, isPending: false, isError: false, refetch: () => {} } as any;
  }

  return query;
}

/** Làm mới danh tính ở MỌI màn sau khi người dùng lưu hồ sơ/ảnh đại diện. */
export function useInvalidateMyIdentity() {
  const client = useContext(QueryClientContext);
  return useCallback(
    () => client?.invalidateQueries({ queryKey: ["bc-mobile", "identity", "mine"] }),
    [client],
  );
}
