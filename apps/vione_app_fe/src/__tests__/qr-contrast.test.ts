import { describe, it, expect } from "vitest";
import {
  parseColor,
  contrastRatio,
  classifyContrast,
  evaluateQrContrast,
  resolveSafeQrColors,
  evaluateTemplateQr,
} from "@/lib/qr-contrast";

describe("qr-contrast", () => {
  it("parses hex / rgb / gradient inputs", () => {
    expect(parseColor("#000")).toEqual([0, 0, 0]);
    expect(parseColor("#ffffff")).toEqual([255, 255, 255]);
    expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
    expect(parseColor("linear-gradient(135deg,#14306a 0%,#0e1f44 100%)")).toEqual([20, 48, 106]);
    expect(parseColor("not-a-color")).toBeNull();
  });

  it("computes WCAG ratio ~21 for black/white and ~1 for identical", () => {
    expect(contrastRatio("#000", "#fff")).toBeGreaterThan(20);
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 2);
  });

  it("classifies buckets", () => {
    expect(classifyContrast(21)).toBe("excellent");
    expect(classifyContrast(5)).toBe("ok");
    expect(classifyContrast(3.5)).toBe("warn");
    expect(classifyContrast(2)).toBe("fail");
  });

  it("flags gradient light as unsafe", () => {
    const r = evaluateQrContrast("#0a1834", "linear-gradient(135deg,#14306a,#0a1834)");
    expect(r.safe).toBe(false);
    expect(r.hadInvalidInput).toBe(true);
  });

  it("keeps safe colour pair unchanged", () => {
    const out = resolveSafeQrColors({ requestedDark: "#000", requestedLight: "#fff" });
    expect(out.substituted).toBe(false);
    expect(out.dark).toBe("#000");
  });

  it("substitutes safe colours when caller passes a gradient", () => {
    const out = resolveSafeQrColors({
      requestedDark: "#eef1f8",
      requestedLight: "linear-gradient(135deg,#14306a,#0a1834)",
      theme: { text: "#eef1f8", accent: "#c9a84c", surface: "linear-gradient(...)" },
    });
    expect(out.substituted).toBe(true);
    expect(out.light).toBe("#ffffff");
    expect(out.report.safe).toBe(true);
  });

  it("evaluateTemplateQr flags accent-on-dark-surface as risky", () => {
    const r = evaluateTemplateQr({
      accent: "#c9a84c",
      surface: "linear-gradient(160deg,#0f1b3d,#0a133a)",
    });
    // Gradient surface is not directly usable → hadInvalidInput true.
    expect(r.hadInvalidInput).toBe(true);
    expect(r.safe).toBe(false);
  });
});
