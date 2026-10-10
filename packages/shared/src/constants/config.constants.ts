/**
 * ViOne Platform - System & Validation Constants
 */

export const VIONE_SYSTEM_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MAX_UPLOAD_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_AVATAR_SIZE_BYTES: 5 * 1024 * 1024,  // 5MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  SUPPORTED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  SLA_RESPONSE_HOURS: 24,
  MAX_MOMENT_PHOTOS: 9,
} as const;

export const REGEX_PATTERNS = {
  VIETNAM_PHONE: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;
