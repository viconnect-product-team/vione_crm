// BC-Mobile-7B+ — Yêu cầu tham gia cộng đồng (client-safe contracts).
// Trạng thái là canonical: pending / approved / rejected / cancelled / none.

export type CommunityJoinStatus = "none" | "pending" | "approved" | "rejected" | "cancelled";

/** Một cộng đồng có thể yêu cầu tham gia (viewer chưa là thành viên). */
export type CommunityJoinCandidateDTO = {
  communityId: string;
  name: string;
  logoUrl: string | null;
  shortDescription: string | null;
  status: CommunityJoinStatus;
  requestedAt: string | null;
};

/** Một mục lịch sử yêu cầu tham gia của viewer. */
export type CommunityJoinHistoryItemDTO = {
  requestId: string;
  communityId: string;
  name: string;
  logoUrl: string | null;
  status: CommunityJoinStatus;
  requestedAt: string | null;
  decidedAt: string | null;
  reason: string | null;
  /** Lý do người gửi nhập khi tự huỷ yêu cầu (tuỳ chọn). */
  cancelReason: string | null;
};

/** Một yêu cầu tham gia hiển thị trong màn quản trị yêu cầu. */
export type CommunityJoinAdminRequestDTO = {
  requestId: string;
  communityId: string;
  communityName: string;
  requesterName: string | null;
  status: CommunityJoinStatus;
  /** Ghi chú / lý do người gửi kèm theo yêu cầu. */
  note: string | null;
  requestedAt: string | null;
  decidedAt: string | null;
};
