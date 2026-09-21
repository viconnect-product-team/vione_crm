// BC-Mobile-5C — NFC tag registry validation. STRICT schemas: forged
// owner/identity/link ids or status keys are REJECTED, never mapped.

import { z } from "zod";
import { normalizeText } from "./identity.validation";
import { publicTokenSchema } from "./identity.validation";

export const NFC_TAG_LABEL_MAX = 60;

/**
 * Tag registration after a confirmed NFC write. The share token proves
 * which link the tag was programmed with; the server re-verifies ownership
 * and link status — the client never supplies link/identity ids.
 */
export const nfcTagRegisterSchema = z
  .object({
    shareToken: publicTokenSchema,
    label: z
      .string()
      .max(NFC_TAG_LABEL_MAX + 40)
      .transform((s) => normalizeText(s))
      .refine((s) => s.length <= NFC_TAG_LABEL_MAX, `exceeds ${NFC_TAG_LABEL_MAX} chars`)
      .transform((s) => (s === "" ? null : s))
      .nullish(),
  })
  .strict();

export type NfcTagRegisterInput = z.infer<typeof nfcTagRegisterSchema>;

export const nfcTagRevokeSchema = z
  .object({
    tagId: z.string().uuid(),
  })
  .strict();

export type NfcTagRevokeInput = z.infer<typeof nfcTagRevokeSchema>;

/** Đổi tên/nhãn thẻ đã đăng ký. Nhãn rỗng = xoá nhãn (về tên mặc định). */
export const nfcTagRenameSchema = z
  .object({
    tagId: z.string().uuid(),
    label: z
      .string()
      .max(NFC_TAG_LABEL_MAX + 40)
      .transform((s) => normalizeText(s))
      .refine((s) => s.length <= NFC_TAG_LABEL_MAX, `exceeds ${NFC_TAG_LABEL_MAX} chars`)
      .transform((s) => (s === "" ? null : s))
      .nullish(),
  })
  .strict();

export type NfcTagRenameInput = z.infer<typeof nfcTagRenameSchema>;
