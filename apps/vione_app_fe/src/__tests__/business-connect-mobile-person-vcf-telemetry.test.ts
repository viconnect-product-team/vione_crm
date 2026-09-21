// Person Detail .vcf export telemetry — privacy boundary contract.
// Allowlisted metric names + numeric latency only; never throws; never PII.

import { describe, expect, it, vi, afterEach } from "vitest";
import {
  reportPersonVcfMetric,
  type PersonVcfMetric,
} from "@/lib/business-connect/mobile/person-vcf.telemetry";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reportPersonVcfMetric", () => {
  it("emits every allowlisted funnel metric with the bc-person-vcf prefix", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const names: PersonVcfMetric[] = [
      "PERSON_VCF_PREVIEW_OPENED",
      "PERSON_VCF_EXPORTED_SHARED",
      "PERSON_VCF_EXPORTED_DOWNLOADED",
      "PERSON_VCF_EXPORT_CANCELLED",
      "PERSON_VCF_EXPORT_FAILED",
    ];
    for (const name of names) reportPersonVcfMetric(name);
    expect(info).toHaveBeenCalledTimes(names.length);
    for (const name of names) {
      expect(info).toHaveBeenCalledWith(`[bc-person-vcf] ${name}`);
    }
  });

  it("appends rounded, clamped latency when provided", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    reportPersonVcfMetric("PERSON_VCF_EXPORTED_SHARED", { latencyMs: 123.6 });
    expect(info).toHaveBeenCalledWith("[bc-person-vcf] PERSON_VCF_EXPORTED_SHARED 124ms");
    reportPersonVcfMetric("PERSON_VCF_EXPORTED_DOWNLOADED", { latencyMs: -5 });
    expect(info).toHaveBeenCalledWith("[bc-person-vcf] PERSON_VCF_EXPORTED_DOWNLOADED 0ms");
  });

  it("silently drops non-allowlisted names (PII can never ride along as a metric)", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    // @ts-expect-error — deliberate misuse must be rejected
    reportPersonVcfMetric("Nguyễn Văn A — 0901234567");
    expect(info).not.toHaveBeenCalled();
  });

  it("never throws into the user path even when console.info blows up", () => {
    vi.spyOn(console, "info").mockImplementation(() => {
      throw new Error("sink down");
    });
    expect(() => reportPersonVcfMetric("PERSON_VCF_EXPORT_FAILED")).not.toThrow();
  });
});
