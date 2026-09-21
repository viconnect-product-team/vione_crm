// Structural test: 12 industry-mapped card templates exist and are well-formed.
import { describe, it, expect } from "vitest";
import {
  CARD_TEMPLATES,
  CARD_TEMPLATE_LIST,
  CARD_INDUSTRIES,
  templatesForIndustry,
  recommendTemplate,
  getTemplate,
} from "@/lib/card-templates";
import { resolveTheme } from "@/lib/business-card/business-card.share";

describe("card-templates registry", () => {
  it("exposes exactly 12 curated templates", () => {
    expect(CARD_TEMPLATE_LIST).toHaveLength(12);
  });

  it("every template is well-formed", () => {
    for (const t of CARD_TEMPLATE_LIST) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.surface).toMatch(/gradient/);
      expect(t.accent).toMatch(/^#|rgb|hsl/);
      expect(t.industries.length).toBeGreaterThan(0);
      expect(["classic", "centered", "sidebar", "split", "minimal"]).toContain(t.layout);
      expect(t.headingFont).toBeTruthy();
      expect(t.bodyFont).toBeTruthy();
      expect(t.tagline.vi).toBeTruthy();
      expect(t.tagline.en).toBeTruthy();
    }
  });

  it("covers every declared industry with at least one template", () => {
    for (const i of CARD_INDUSTRIES) {
      expect(templatesForIndustry(i).length).toBeGreaterThan(0);
    }
  });

  it("uses all 5 layouts across the set", () => {
    const layouts = new Set(CARD_TEMPLATE_LIST.map((t) => t.layout));
    expect(layouts.size).toBe(5);
  });

  it("recommendTemplate picks a sensible template per industry hint", () => {
    expect(recommendTemplate("Luật sư").id).toBe("navy-trust");
    expect(recommendTemplate("Software engineer").id).toBe("midnight-tech");
    expect(recommendTemplate("Bất động sản cao cấp").id).toBe("emerald-estate");
    expect(recommendTemplate("Bệnh viện nhi").id).toBe("clinical-white");
    expect(recommendTemplate("Thời trang couture").id).toBe("couture-blush");
    expect(recommendTemplate("Kiến trúc sư").id).toBe("arch-mono");
    expect(recommendTemplate("").id).toBe("navy-trust");
  });

  it("resolveTheme resolves both template ids and legacy theme ids", () => {
    for (const id of Object.keys(CARD_TEMPLATES)) {
      const theme = resolveTheme(id);
      expect(theme.surface).toBe(CARD_TEMPLATES[id].surface);
    }
    // Legacy still works.
    expect(resolveTheme("classic").id).toBe("classic");
    // Unknown falls back to classic.
    expect(resolveTheme("__unknown__").id).toBe("classic");
  });

  it("getTemplate returns null for unknown or missing ids", () => {
    expect(getTemplate(null)).toBeNull();
    expect(getTemplate("__nope__")).toBeNull();
    expect(getTemplate("navy-trust")?.label).toBe("Navy Trust");
  });
});
