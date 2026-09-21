// AI card import — analyze a business card image and extract structured design
// + content hints. Uses the Lovable AI Gateway (Gemini vision) server-side so
// LOVABLE_API_KEY never leaves the server. Returns a normalized suggestion
// that the builder can apply to its form and QR options.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireNestAuth } from "@/integrations/supabase/nest-auth-middleware";
import { checkAiRateLimit } from "@/lib/ai-rate-limit";
import { CARD_TEMPLATES, recommendTemplate, type CardLayout } from "@/lib/card-templates";

const InputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .refine((s) => s.startsWith("data:image/"), "must be a data:image/* URL")
    .refine((s) => s.length < 8 * 1024 * 1024, "image too large (max ~6MB)"),
});

const HEX = /^#[0-9a-fA-F]{6}$/;

const LAYOUTS: CardLayout[] = ["classic", "centered", "sidebar", "split", "minimal"];

export type ConfidenceKey =
  | "displayName"
  | "professionalTitle"
  | "companyName"
  | "headline"
  | "website"
  | "workEmail"
  | "workPhone"
  | "palette"
  | "qrBackground"
  | "templateId";

export type CardAiSuggestion = {
  displayName: string | null;
  professionalTitle: string | null;
  companyName: string | null;
  headline: string | null;
  website: string | null;
  workEmail: string | null;
  workPhone: string | null;
  industryHint: string | null;
  styleKeywords: string[];
  palette: { surface: string | null; accent: string | null; text: string | null };
  layout: CardLayout | null;
  templateId: string;
  qrBackground: "white" | "template" | "transparent";
  notes: string | null;
  /** 0..1 per-field confidence; missing = unknown. */
  confidence: Partial<Record<ConfidenceKey, number>>;
};

const SYSTEM = `You are an expert business-card designer. Analyze the uploaded card image and return STRICT JSON only, no prose.
Extract both content (text) and design (colors, layout, style) so it can be recreated in a template system.
For every extracted field also report your confidence 0..1 (0 = guessed, 1 = clearly legible in the image).
JSON schema:
{
  "displayName": string|null,
  "professionalTitle": string|null,
  "companyName": string|null,
  "headline": string|null,
  "website": string|null,
  "workEmail": string|null,
  "workPhone": string|null,
  "industryHint": string|null,
  "styleKeywords": string[],
  "palette": {
    "surface": "#RRGGBB"|null,
    "accent":  "#RRGGBB"|null,
    "text":    "#RRGGBB"|null
  },
  "layout": "classic"|"centered"|"sidebar"|"split"|"minimal"|null,
  "qrBackground": "white"|"template"|"transparent",
  "confidence": {
    "displayName": number, "professionalTitle": number, "companyName": number,
    "headline": number, "website": number, "workEmail": number, "workPhone": number,
    "palette": number, "qrBackground": number
  }
}
Rules: return #RRGGBB hex only; leave fields null if not confident; do NOT invent contact details; confidence must reflect actual legibility.`;

function pickHex(v: unknown): string | null {
  return typeof v === "string" && HEX.test(v) ? v.toLowerCase() : null;
}
function pickStr(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
}

// Color distance in RGB. Good enough to pick a nearby template.
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function dist(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}
// Extract first hex color from a CSS surface value (solid or gradient).
function firstHex(css: string): string | null {
  const m = css.match(/#([0-9a-fA-F]{6})/);
  return m ? `#${m[1].toLowerCase()}` : null;
}

function chooseTemplate(
  industryHint: string | null,
  palette: { surface: string | null; accent: string | null },
  layout: CardLayout | null,
): string {
  const byIndustry = recommendTemplate(industryHint ?? "").id as unknown as string;
  if (!palette.surface && !palette.accent) return byIndustry;

  let best = byIndustry;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const tpl of Object.values(CARD_TEMPLATES)) {
    const tSurface = firstHex(tpl.surface);
    if (!tSurface) continue;
    let score = 0;
    if (palette.surface) score += dist(palette.surface, tSurface);
    if (palette.accent) score += dist(palette.accent, tpl.accent) * 0.6;
    if (layout && tpl.layout === layout) score -= 4000; // small bonus for layout match
    if (score < bestScore) {
      bestScore = score;
      best = tpl.id as unknown as string;
    }
  }
  return best;
}

export const analyzeCardImage = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }): Promise<CardAiSuggestion> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing on server");

    // Identity comes from the verified auth context — never client input.
    // Rate limit is bound to the authenticated user; users without an active
    // association share a fallback bucket so the card builder keeps working.
    // Get associationId from NestJS roles endpoint for rate limiting
    let associationId: string | null = null;
    try {
      const { fetchNestApiFromServer } = await import("@/lib/api-client");
      const roles = await fetchNestApiFromServer("/ai/roles", context.token) as any;
      associationId = roles?.associationId ?? null;
    } catch { /* fallback: no association */ }
    const rl = checkAiRateLimit({
      userId: context.userId,
      associationId: associationId ?? "no-association",
      role: "member",
    });
    if (!rl.allowed) throw new Error(rl.message);


    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this business card image and return JSON per schema.",
                },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
        }),
      });
    } catch (e) {
      throw new Error(
        (e as Error)?.name === "AbortError" ? "AI request timed out" : "AI request failed",
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) throw new Error("AI is rate-limited. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up in Settings.");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

    const json = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      // Some models wrap JSON in ```json fences — strip and retry once.
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned invalid JSON");
      parsed = JSON.parse(m[0]) as Record<string, unknown>;
    }

    const paletteRaw = (parsed.palette ?? {}) as Record<string, unknown>;
    const palette = {
      surface: pickHex(paletteRaw.surface),
      accent: pickHex(paletteRaw.accent),
      text: pickHex(paletteRaw.text),
    };
    const layoutRaw = pickStr(parsed.layout, 20)?.toLowerCase() ?? null;
    const layout = (LAYOUTS as string[]).includes(layoutRaw ?? "")
      ? (layoutRaw as CardLayout)
      : null;
    const industryHint = pickStr(parsed.industryHint, 80);
    const styleKeywords = Array.isArray(parsed.styleKeywords)
      ? (parsed.styleKeywords.map((s: any) => pickStr(s, 40)).filter(Boolean) as string[]).slice(0, 8)
      : [];
    const qrBgRaw = pickStr(parsed.qrBackground, 20);
    const qrBackground: CardAiSuggestion["qrBackground"] =
      qrBgRaw === "template" || qrBgRaw === "transparent" ? qrBgRaw : "white";

    const templateId = chooseTemplate(industryHint, palette, layout);

    const confRaw = (parsed.confidence ?? {}) as Record<string, unknown>;
    const pickConf = (v: unknown): number | undefined => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      if (!Number.isFinite(n)) return undefined;
      return Math.max(0, Math.min(1, n));
    };
    const confidence: CardAiSuggestion["confidence"] = {};
    const confKeys: ConfidenceKey[] = [
      "displayName",
      "professionalTitle",
      "companyName",
      "headline",
      "website",
      "workEmail",
      "workPhone",
      "palette",
      "qrBackground",
    ];
    for (const k of confKeys) {
      const v = pickConf(confRaw[k]);
      if (v !== undefined) confidence[k] = v;
    }
    // Template confidence derives from palette + industry evidence.
    const paletteConf = confidence.palette ?? 0.5;
    const industryConf = industryHint ? 0.8 : 0.4;
    confidence.templateId = Math.min(1, (paletteConf + industryConf) / 2);

    return {
      displayName: pickStr(parsed.displayName, 120),
      professionalTitle: pickStr(parsed.professionalTitle, 160),
      companyName: pickStr(parsed.companyName, 160),
      headline: pickStr(parsed.headline, 200),
      website: pickStr(parsed.website, 200),
      workEmail: pickStr(parsed.workEmail, 200),
      workPhone: pickStr(parsed.workPhone, 40),
      industryHint,
      styleKeywords,
      palette,
      layout,
      templateId,
      qrBackground,
      notes: null,
      confidence,
    };
  });

// ─────────────────────────────────────────────────────────────
// AI-optimal template pick — ranks all templates via layout+tone
// ─────────────────────────────────────────────────────────────

export type OptimalTemplatePick = {
  templateId: string;
  confidence: number;
  rationale: string;
  alternates: { templateId: string; reason: string }[];
};

const OptimalInput = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .refine((s) => s.startsWith("data:image/"), "must be a data:image/* URL")
    .refine((s) => s.length < 8 * 1024 * 1024, "image too large (max ~6MB)"),
  currentTemplateId: z.string().nullable().optional(),
  industryHint: z.string().nullable().optional(),
});

function buildTemplateCatalogText(): string {
  return Object.values(CARD_TEMPLATES)
    .map((t: any) => {
      const surface = firstHex(t.surface) ?? t.surface.slice(0, 24);
      return `- id="${t.id}" · label="${t.label}" · layout=${t.layout} · surface=${surface} · accent=${t.accent} · industries=[${t.industries.join(",")}]`;
    })
    .join("\n");
}

export const recommendOptimalTemplate = createServerFn({ method: "POST" })
  .middleware([requireNestAuth])
  .inputValidator((d: unknown) => OptimalInput.parse(d))
  .handler(async ({ data, context }): Promise<OptimalTemplatePick> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing on server");

    // Same identity + spend guard as analyzeCardImage.
    let associationId2: string | null = null;
    try {
      const { fetchNestApiFromServer } = await import("@/lib/api-client");
      const roles = await fetchNestApiFromServer("/ai/roles", context.token) as any;
      associationId2 = roles?.associationId ?? null;
    } catch { /* fallback */ }
    const rl = checkAiRateLimit({
      userId: context.userId,
      associationId: associationId2 ?? "no-association",
      role: "member",
    });
    if (!rl.allowed) throw new Error(rl.message);

    const catalog = buildTemplateCatalogText();
    const system = `You are an expert business-card art director. Choose the SINGLE best template from the catalog that matches the uploaded card's layout, color tone, industry cues and overall energy.
Return STRICT JSON only:
{
  "templateId": "<must be an id from the catalog>",
  "confidence": 0..1,
  "rationale": "1-2 sentences in Vietnamese explaining why this template fits (mention layout + tone).",
  "alternates": [ { "templateId": "<catalog id>", "reason": "short VI reason" } ]
}
Rules:
- Pick templateId ONLY from the catalog ids below.
- Provide up to 2 alternates.
- rationale MUST be in Vietnamese.
Catalog:
${catalog}
${data.currentTemplateId ? `\nCurrent selection: ${data.currentTemplateId} (feel free to keep or replace).` : ""}
${data.industryHint ? `Industry hint: ${data.industryHint}` : ""}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "text", text: "Choose the best template for this card." },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
        }),
      });
    } catch (e) {
      throw new Error(
        (e as Error)?.name === "AbortError" ? "AI request timed out" : "AI request failed",
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 429) throw new Error("AI is rate-limited. Please retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please top up in Settings.");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);

    const json = (await res.json().catch(() => null)) as {
      choices?: { message?: { content?: string } }[];
    } | null;
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned invalid JSON");
      parsed = JSON.parse(m[0]) as Record<string, unknown>;
    }

    const ids = new Set(Object.keys(CARD_TEMPLATES));
    const rawId = pickStr(parsed.templateId, 60) ?? "";
    const templateId = ids.has(rawId)
      ? rawId
      : chooseTemplate(
          pickStr(parsed.industryHint, 80) ?? data.industryHint ?? null,
          { surface: null, accent: null },
          null,
        );
    const confidenceRaw =
      typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence);
    const confidence = Number.isFinite(confidenceRaw)
      ? Math.max(0, Math.min(1, confidenceRaw))
      : 0.6;
    const rationale = pickStr(parsed.rationale, 400) ?? "";
    const alts = Array.isArray(parsed.alternates) ? parsed.alternates : [];
    const alternates = alts
      .map((a: any) => {
        const rec = a as Record<string, unknown>;
        const id = pickStr(rec.templateId, 60) ?? "";
        const reason = pickStr(rec.reason, 200) ?? "";
        return id && ids.has(id) && id !== templateId ? { templateId: id, reason } : null;
      })
      .filter(Boolean)
      .slice(0, 2) as OptimalTemplatePick["alternates"];

    return { templateId, confidence, rationale, alternates };
  });
