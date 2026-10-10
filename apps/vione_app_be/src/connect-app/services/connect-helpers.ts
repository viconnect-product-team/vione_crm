import * as crypto from 'crypto';
import { z } from 'zod';

export function parsePersonId(personId?: string) {
  if (!personId || typeof personId !== 'string') {
    const fallbackGuestId = crypto.randomUUID();
    return {
      targetKind: 'guest_contact',
      targetUserId: null,
      targetCardId: null,
      targetGuestId: fallbackGuestId,
    };
  }
  const kindChar = personId.substring(0, 1);
  const idVal = personId.includes(':') ? personId.substring(2) : personId;
  let targetKind = 'connection';
  let targetUserId: string | null = null;
  let targetCardId: string | null = null;
  let targetGuestId: string | null = null;

  if (kindChar === 'u') {
    targetKind = 'connection';
    targetUserId = idVal;
  } else if (kindChar === 'c') {
    targetKind = 'saved_card';
    targetCardId = idVal;
  } else if (kindChar === 'g') {
    targetKind = 'guest_contact';
    targetGuestId = idVal;
  } else {
    targetKind = 'guest_contact';
    targetGuestId = idVal;
  }

  return { targetKind, targetUserId, targetCardId, targetGuestId };
}

export function composePersonId(
  targetKind: string,
  targetUserId: string | null,
  targetCardId: string | null,
  targetGuestId: string | null,
) {
  if (targetKind === 'connection' && targetUserId) return `u:${targetUserId}`;
  if (targetKind === 'saved_card' && targetCardId) return `c:${targetCardId}`;
  if (targetKind === 'guest_contact' && targetGuestId) return `g:${targetGuestId}`;
  return '';
}

export const OCR_MODEL_MAX_LINES = 40;
export const ocrModelOutputSchema = z
  .object({
    isBusinessCard: z.boolean(),
    unusableReason: z.string().max(120).nullish(),
    lines: z
      .array(
        z
          .object({
            text: z.string().min(1).max(200),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(OCR_MODEL_MAX_LINES),
    displayNameLine: z.number().int().min(0).nullable(),
    titleLine: z.number().int().min(0).nullable(),
    companyNameLine: z.number().int().min(0).nullable(),
    addressLine: z.number().int().min(0).nullable(),
    qrPresent: z.boolean().nullish(),
  })
  .strict();

export function normalizeText(s: string): string {
  return s.normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
export const EMAIL_SUSPECT_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*,[A-Za-z]{2,}/g;

export function extractEmails(lines: any[], warnings: string[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    for (const m of line.text.matchAll(EMAIL_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      out.push({ value, confidence: clamp01(line.confidence), sourceText: line.text });
    }
    for (const m of line.text.matchAll(EMAIL_SUSPECT_RE)) {
      const value = m[0].toLowerCase();
      if (seen.has(value)) continue;
      seen.add(value);
      uncertain = true;
      out.push({
        value,
        confidence: round2(clamp01(line.confidence) * 0.5),
        sourceText: line.text,
      });
    }
  }
  if (uncertain) warnings.push('email_uncertain');
  return out;
}

export const PHONE_RE = /\+?\d[\d\s().-]{5,}\d/g;

export function detectPhoneLabel(lineText: string): string | undefined {
  const s = lineText.toLowerCase();
  if (s.includes('fax')) return 'fax';
  if (s.includes('hotline')) return 'hotline';
  const tokens = s.split(/[^a-z0-9à-ỹ]+/u).filter(Boolean);
  const has = (set: readonly string[]) => tokens.some((tok) => set.includes(tok));
  if (has(['mobile', 'mobi', 'cell', 'hp']) || s.includes('di động') || s.includes('di dong')) {
    return 'mobile';
  }
  if (
    has(['office', 'tel', 'phone', 'đt', 'dt']) ||
    s.includes('văn phòng') ||
    s.includes('van phong')
  ) {
    return 'office';
  }
  return undefined;
}

export function normalizePhoneDigits(raw: string): string {
  const plus = raw.trimStart().startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return plus ? `+${digits}` : digits;
}

export function extractPhones(lines: any[], warnings: string[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  let uncertain = false;
  for (const line of lines) {
    for (const m of line.text.matchAll(PHONE_RE)) {
      const digits = m[0].replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) continue;
      const value = normalizePhoneDigits(m[0]);
      if (seen.has(value)) continue;
      seen.add(value);
      const label = detectPhoneLabel(line.text);
      if (line.confidence < 0.5 || digits.length < 8) uncertain = true;
      out.push({
        value,
        confidence: clamp01(line.confidence),
        sourceText: line.text,
        ...(label ? { label } : {}),
      });
    }
  }
  if (uncertain) warnings.push('phone_uncertain');
  return out;
}

export const URL_RE = /(?:https?:\/\/|www\.)[^\s<>()"']+/gi;

export function extractWebsite(lines: any[]): any | undefined {
  for (const line of lines) {
    for (const m of line.text.matchAll(URL_RE)) {
      let raw = m[0].replace(/[.,;:!?)}\]]+$/, '');
      if (raw.includes('@')) continue;
      if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
      try {
        const u = new URL(raw);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
        return { value: u.toString(), confidence: clamp01(line.confidence), sourceText: line.text };
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

export const CONTACT_PATTERN = /@|\(?\+?\d[\d\s().-]{6,}\d/;

export function pickClassifiedLine(
  lines: any[],
  index: number | null,
  opts: { maxLen: number; forbidContactPattern?: boolean },
): any | undefined {
  if (index === null) return undefined;
  const line = lines[index];
  if (!line) return undefined;
  const value = normalizeText(line.text);
  if (!value || value.length > opts.maxLen) return undefined;
  if (opts.forbidContactPattern && CONTACT_PATTERN.test(value)) return undefined;
  return { value, confidence: clamp01(line.confidence), sourceText: line.text };
}

export function buildCandidateFromModel(model: any, scanId: string): any {
  if (!model.isBusinessCard) return { ok: false, code: 'unusable' };

  const lines: any[] = model.lines
    .map((l: any) => ({ text: normalizeText(l.text), confidence: clamp01(l.confidence) }))
    .filter((l: any) => l.text.length > 0);
  if (lines.length === 0) return { ok: false, code: 'unusable' };

  const warnings: string[] = [];
  if (model.qrPresent) warnings.push('qr_present');

  const displayName = pickClassifiedLine(lines, model.displayNameLine, {
    maxLen: 80,
    forbidContactPattern: true,
  });
  if (model.displayNameLine !== null && !displayName) warnings.push('name_needs_review');

  const title = pickClassifiedLine(lines, model.titleLine, { maxLen: 120 });
  if (model.titleLine !== null && !title) warnings.push('title_needs_review');

  const companyName = pickClassifiedLine(lines, model.companyNameLine, { maxLen: 120 });
  if (model.companyNameLine !== null && !companyName) warnings.push('company_needs_review');

  const address = pickClassifiedLine(lines, model.addressLine, { maxLen: 160 });
  if (model.addressLine !== null && !address) warnings.push('address_needs_review');

  const emails = extractEmails(lines, warnings);
  const phones = extractPhones(lines, warnings);
  const website = extractWebsite(lines);

  if (!displayName) warnings.push('no_name');
  const hasChannel = phones.length > 0 || emails.length > 0 || website !== undefined;
  if (!hasChannel) warnings.push('no_contact_channel');
  if (!displayName && !hasChannel) return { ok: false, code: 'unusable' };

  const present: any[] = [
    ...(displayName ? [displayName] : []),
    ...(title ? [title] : []),
    ...(companyName ? [companyName] : []),
    ...(website ? [website] : []),
    ...(address ? [address] : []),
    ...phones,
    ...emails,
  ];
  const overallConfidence =
    present.length === 0
      ? 0
      : round2(present.reduce((sum, f) => sum + f.confidence, 0) / present.length);

  return {
    ok: true,
    candidate: {
      schemaVersion: 1,
      scanId,
      status: 'candidate',
      fields: {
        ...(displayName ? { displayName } : {}),
        ...(title ? { title } : {}),
        ...(companyName ? { companyName } : {}),
        phones,
        emails,
        ...(website ? { website } : {}),
        ...(address ? { address } : {}),
      },
      warnings,
      overallConfidence,
    },
  };
}

export function candidateFromRawModelOutput(raw: unknown, scanId: string): any {
  const parsed = ocrModelOutputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'invalid_output' };
  const built = buildCandidateFromModel(parsed.data, scanId);
  if (!built.ok) return { ok: false, code: 'unusable' };
  return { ok: true, candidate: built.candidate };
}

export async function runCardOcrVision(imageDataUrl: string): Promise<unknown> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error('OCR runtime is not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a business-card OCR extraction engine inside a contact-acquisition pipeline.
Return STRICT JSON only:
{
  "isBusinessCard": boolean,
  "unusableReason": string | null,
  "lines": [ { "text": string, "confidence": number } ],
  "displayNameLine": number | null,
  "titleLine": number | null,
  "companyNameLine": number | null,
  "addressLine": number | null,
  "qrPresent": boolean
}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Read this business card image and return JSON.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OCR provider error ${response.status}`);
  const json = (await response.json()) as any;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OCR provider returned an empty response');
  return JSON.parse(content);
}

export async function callSuggestCustomerTagsAi(input: {
  stageLabel: string;
  displayName: string;
  companyName: string;
  note: string;
  logs: string[];
  needs: string[];
  existingTagNames: string[];
  currentTagNames: string[];
  approvedTagNames?: string[];
  rejectedTagNames?: string[];
}) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return { ok: false, error: 'unavailable' as const };

  const context = [
    `Tên: ${input.displayName || '(không rõ)'}`,
    `Công ty: ${input.companyName || '(không rõ)'}`,
    `Giai đoạn: ${input.stageLabel}`,
    `Ghi chú: ${input.note || '(trống)'}`,
    `Lịch sử chăm sóc:\n${input.logs.length ? input.logs.map((l) => `- ${l}`).join('\n') : '(trống)'}`,
    `Điểm đau & nhu cầu:\n${input.needs.length ? input.needs.map((n) => `- ${n}`).join('\n') : '(trống)'}`,
    `Nhãn đã gắn: ${input.currentTagNames.join(', ') || '(chưa có)'}`,
    `Danh mục nhãn hiện có: ${input.existingTagNames.join(', ') || '(chưa có)'}`,
    `Nhãn người dùng đánh giá ĐÚNG trước đây: ${(input.approvedTagNames ?? []).join(', ') || '(chưa có)'}`,
    `Nhãn người dùng đánh giá SAI trước đây (tuyệt đối không đề xuất lại): ${
      (input.rejectedTagNames ?? []).join(', ') || '(chưa có)'
    }`,
  ].join('\n');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý phân nhóm khách hàng cho một người bán hàng cá nhân.
Đề xuất tối đa 5 NHÃN ngắn để phân nhóm khách hàng.
Trả về DUY NHẤT JSON dạng: {"suggestions":[{"name":"...","reason":"...","confidence":0.8}]}. Không markdown.`,
        },
        { role: 'user', content: context },
      ],
    }),
  });

  if (!response.ok) return { ok: false, error: 'unavailable' as const };
  const json = (await response.json()) as any;
  const content = json?.choices?.[0]?.message?.content ?? '';

  try {
    const text = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return { ok: false, error: 'unavailable' as const };
    const parsed = JSON.parse(text.slice(start, end + 1)) as any;
    const rawSuggestions = (parsed.suggestions ?? [])
      .map((s: any) => ({
        name: String(s.name || '').trim().slice(0, 24),
        reason: String(s.reason || '').trim().slice(0, 120),
        confidence: typeof s.confidence === 'number' ? s.confidence : 0.5,
      }))
      .filter((s: any) => s.name.length > 0)
      .slice(0, 5);

    const existing = new Set(input.existingTagNames.map((n) => n.toLowerCase()));
    const already = new Set(input.currentTagNames.map((n) => n.toLowerCase()));
    const seen = new Set<string>();
    const suggestions: any[] = [];

    for (const s of rawSuggestions) {
      const key = s.name.toLowerCase();
      if (seen.has(key) || already.has(key)) continue;
      seen.add(key);
      suggestions.push({
        name: s.name,
        reason: s.reason,
        existing: existing.has(key),
        confidence: s.confidence,
      });
    }

    return { ok: true, suggestions };
  } catch {
    return { ok: false, error: 'unavailable' as const };
  }
}
