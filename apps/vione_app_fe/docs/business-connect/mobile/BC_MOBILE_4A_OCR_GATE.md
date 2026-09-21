# BC-Mobile-4A — Business Card Capture + OCR Runtime + Candidate Model — EXIT GATE

BC-Mobile-0A → BC-Mobile-3B: **CLOSED / GO.** BC-Mobile-4A implements the third
acquisition channel's **first half only**:

**Capture → Image preparation → OCR → Extraction → Candidate Preview. STOP.**

There is deliberately **no save action**. OCR is an assistant, not an authority.
Canonical identity creation begins in BC-Mobile-4B (human review → save).

## 1. Scope delivered

| Area | Delivery | Evidence |
| --- | --- | --- |
| Activation | V sheet "Chụp danh thiếp" → `/connect-app/card-scan` (truthful availability: 3 available, 2 soon) | `VActionSheet.tsx`, `bcm0b` tests |
| Capture | Camera (`capture="environment"`) + library, 48px actions, guide frame, back to `/connect-app` | `BusinessCardCapture.tsx` |
| Image preparation | Client canvas: EXIF/GPS strip, orientation via `createImageBitmap`, max edge **2048px**, JPEG progressive re-encode, quality 0.85→0.6 until ≤ **2MB**, safe-center downscale (no card-text crop) | `card-scan-image.ts` |
| OCR runtime | **Reused** approved Lovable AI Gateway vision (Gemini-2.5-flash) — same path as desktop AI Card Import. Server-only; browser never holds a key. 60s timeout → truthful retry. | `card-scan.server.ts` |
| Extraction | Hybrid: deterministic regex (email / E.164 phone / http(s) URL) + model line-index classification (name/title/company/address). **Every candidate field carries `sourceText` evidence — a field exists only if it traces to an OCR line.** | `card-scan.extract.ts` |
| Candidate DTO | `BusinessCardCandidate` v1: 7 whitelisted fields, `{value, confidence, sourceText, label?}`, bounded confidence 0..1, opaque `scanId` (client uuid), `status: "candidate"`. No owner/tenant/storage/provider internals. | `card-scan.types.ts` |
| Confidence | Field-level, displayed as **text** bands: Rõ / Cần kiểm tra / Không chắc (Clear / Needs review / Unclear). No machine precision shown; not treated as truth. | `BusinessCardCandidatePreview.tsx` |
| Review-preview surface | Identity-first (name → title → company), phone(s) with labels, email(s), website, address; source image kept beside candidate; **Continue disabled** (4B). | `BusinessCardCandidatePreview.tsx` |
| Retry / retake | Retry reuses local prepared image (no re-pick); retake clears candidate + image; stage-wise errors (timeout / provider_down / rate_limited / invalid_output) map to truthful copy. | `CardScanFlow.tsx` |
| VI/EN | Full bilingual copy; name/title/company/address preserved **verbatim** (never translated). | `i18n.ts` `bc.mobile.cardScan.*` |
| Accessibility | `aria-live` stage announcements, focus → result heading after scan, `role="alert"` errors, `role="status"` progress, ≥44px targets, axe = 0 **light + dark** (capture, candidate, unusable). | `bcm4a` tests |
| Privacy & security | Authenticated-only (`requireSupabaseAuth`); per-user rate budget **20 scans / 10 min**; upload allowlist (JPEG/PNG/WebP ≤12MB, SVG/PDF/HEIC rejected); EXIF stripped **before** upload; transient request-scoped processing (no server-side image/result storage); no PII in logs; prompt-injection boundary (strict Zod schema, no extra keys, in-image text = untrusted data); guest public card page untouched. | `card-scan.functions.ts`, tests |

## 2. Explicit non-goals (verified absent)

- **No** write into `guest_contacts`, `user_connections`, saved cards, Journey, or
  Moments — static guard test asserts card-scan modules import no persistence
  modules and contain no `.from(` table access.
- **No** duplicate resolution, **no** back-side scanning, **no** QR payload
  parsing (QR presence → warning only, no navigation).
- **No** "Lưu vào Network / Save to Network" action anywhere in the flow.

## 3. Flow (frozen)

```text
V sheet → "Chụp danh thiếp"
  → /connect-app/card-scan  (capture: camera | library)
  → image preview (retake | recognize)
  → processing (preparing → reading; cancel)
  → candidate preview (identity-first, evidence chips, QR warning)
      ├─ usable   → [retake] [Tiếp tục — disabled, 4B]
      └─ unusable → truthful reason + [retake] [choose another]
```

## 4. Truthfulness rules honored

- Confidence is advisory context only; it never auto-fills canonical data.
- "Usable" = at least a display name **or** one contact channel; otherwise the
  candidate honestly reports unusable with rescan guidance (lighting/framing).
- Low-confidence fields surface "Cần kiểm tra"; no field is silently
  "corrected" (comma-TLD emails are flagged, not fixed).

## 5. Open items for BC-Mobile-4B (not started)

- Human review/edit screen per field → explicit save into the Guest Contact /
  Network domains (new Journey origin milestone).
- Duplicate & merge resolution against existing network.
- Optional back-side capture, batch review list.

**Gate verdict: BC-Mobile-4A GO — verified by
`src/__tests__/business-connect-mobile-card-scan.bcm4a.test.tsx` plus updated
`bcm0b` shell contract tests.**
