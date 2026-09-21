// Phiên & thiết bị — DTO cho màn hình quản lý phiên đăng nhập theo thiết bị.

export type DeviceSessionInfo = {
  id: string;
  deviceKey: string;
  label: string;
  platform: string | null;
  browser: string | null;
  isStandalone: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
};

/** Mô tả thiết bị hiện tại — chỉ dữ liệu công khai của trình duyệt, không PII. */
export type DeviceDescriptor = {
  deviceKey: string;
  label: string;
  platform: string | null;
  browser: string | null;
  isStandalone: boolean;
};
