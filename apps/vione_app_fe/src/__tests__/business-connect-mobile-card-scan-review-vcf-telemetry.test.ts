// Card-scan Review .vcf export telemetry — privacy boundary contract.
// Same allowlist shape as person-vcf.telemetry.ts: 5 funnel metric names +
// numeric latency only; never throws; never PII (name, filename, vCard content).

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  reportCardScanMetric,
  type CardScanMetric,
} from "@/lib/business-connect/mobile/card-scan.telemetry";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportCardScanMetric — review .vcf funnel", () => {
  it("emits every allowlisted .vcf metric with the bc-ocr prefix", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const names: CardScanMetric[] = [
      "OCR_REVIEW_VCF_PREVIEW_OPENED",
      "OCR_REVIEW_VCF_EXPORTED_SHARED",
      "OCR_REVIEW_VCF_EXPORTED_DOWNLOADED",
      "OCR_REVIEW_VCF_CANCELLED",
      "OCR_REVIEW_VCF_FAILED",
    ];
    for (const name of names) reportCardScanMetric(name);
    expect(info).toHaveBeenCalledTimes(names.length);
    for (const name of names) {
      expect(info).toHaveBeenCalledWith(`[bc-ocr] ${name}`);
    }
  });

  it("appends rounded, clamped latency when provided", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    reportCardScanMetric("OCR_REVIEW_VCF_EXPORTED_SHARED", { latencyMs: 42.4 });
    expect(info).toHaveBeenCalledWith("[bc-ocr] OCR_REVIEW_VCF_EXPORTED_SHARED 42ms");
    reportCardScanMetric("OCR_REVIEW_VCF_EXPORTED_DOWNLOADED", { latencyMs: -10 });
    expect(info).toHaveBeenCalledWith("[bc-ocr] OCR_REVIEW_VCF_EXPORTED_DOWNLOADED 0ms");
  });

  it("silently drops non-allowlisted names (PII can never ride along as a metric)", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    // @ts-expect-error — deliberate misuse must be rejected
    reportCardScanMetric("Nguyễn Văn A — nguyen.van.a@example.com");
    expect(info).not.toHaveBeenCalled();
  });

  it("never throws into the user path even when console.info blows up", () => {
    vi.spyOn(console, "info").mockImplementation(() => {
      throw new Error("sink down");
    });
    expect(() => reportCardScanMetric("OCR_REVIEW_VCF_FAILED")).not.toThrow();
  });
});
