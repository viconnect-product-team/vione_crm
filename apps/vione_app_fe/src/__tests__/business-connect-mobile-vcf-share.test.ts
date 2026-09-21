// @vitest-environment jsdom
//
// shareOrDownloadVcf — Share Sheet (Web Share API Level 2) delivery contract.
//
// Mobile-first behavior: when the device can share files, the .vcf goes
// through the native Share Sheet (iOS/Android) so the user can push it
// straight into Contacts/WhatsApp/Zalo/Mail. Desktop browsers and rejected
// share calls fall back to the anchor download — EXCEPT when the user
// intentionally dismissed the sheet (AbortError), which must stay a no-op.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareOrDownloadVcf } from "@/lib/business-connect/mobile/person-vcard";

const VCF = "BEGIN:VCARD\r\nVERSION:3.0\r\nFN;CHARSET=UTF-8:Trần Minh Anh\r\nEND:VCARD\r\n";
const FILENAME = "tran-minh-anh.vcf";

// jsdom has no URL.createObjectURL — stub it so the download fallback path
// is observable without a real blob store.
const createUrlSpy = vi.fn((_blob: Blob) => "blob:vcf-mock");
const revokeUrlSpy = vi.fn();
const anchorClickSpy = vi.fn();

function stubShare(opts: {
  canShare?: boolean;
  shareImpl?: (data: { files: File[] }) => Promise<void>;
}) {
  if (opts.shareImpl) {
    vi.stubGlobal("navigator", {
      share: vi.fn(opts.shareImpl),
      canShare: vi.fn(() => opts.canShare ?? true),
    });
  } else if (opts.canShare !== undefined) {
    vi.stubGlobal("navigator", {
      canShare: vi.fn(() => opts.canShare),
    });
  } else {
    // Device with no Web Share API at all.
    vi.stubGlobal("navigator", {});
  }
  const nav = globalThis.navigator as unknown as {
    share?: ReturnType<typeof vi.fn>;
    canShare?: ReturnType<typeof vi.fn>;
  };
  return { shareSpy: nav.share, canShareSpy: nav.canShare };
}

beforeEach(() => {
  createUrlSpy.mockClear();
  revokeUrlSpy.mockClear();
  anchorClickSpy.mockClear();
  Object.defineProperty(URL, "createObjectURL", { value: createUrlSpy, configurable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: revokeUrlSpy, configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(anchorClickSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shareOrDownloadVcf — Share Sheet first", () => {
  it("opens the native Share Sheet with the .vcf file and skips the download", async () => {
    const { shareSpy, canShareSpy } = stubShare({ shareImpl: async () => {} });

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("shared");
    expect(canShareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledTimes(1);
    const data = shareSpy!.mock.calls[0]![0] as { files: File[] };
    expect(data.files).toHaveLength(1);
    expect(data.files[0]!.name).toBe(FILENAME);
    expect(data.files[0]!.type).toBe("text/vcard");
    // Files-only payload: no text/title that Android targets might mishandle.
    expect(Object.keys(data)).toEqual(["files"]);
    expect(createUrlSpy).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
  });

  it("honours canShare=false and falls back to download", async () => {
    const { shareSpy } = stubShare({ canShare: false, shareImpl: async () => {} });

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("downloaded");
    expect(shareSpy).not.toHaveBeenCalled();
    expect(createUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
  });

  it("stays a no-op when the user dismisses the sheet (AbortError)", async () => {
    const { shareSpy } = stubShare({
      shareImpl: async () => {
        throw new DOMException("Share canceled", "AbortError");
      },
    });

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("cancelled");
    expect(shareSpy).toHaveBeenCalledTimes(1);
    // Critical: a dismissed sheet must NOT trigger a surprise download.
    expect(createUrlSpy).not.toHaveBeenCalled();
    expect(anchorClickSpy).not.toHaveBeenCalled();
  });

  it("falls back to download when the platform rejects the share (NotAllowedError)", async () => {
    stubShare({
      shareImpl: async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
    });

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("downloaded");
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
  });

  it("downloads on devices with no Web Share API (desktop browsers)", async () => {
    stubShare({});

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("downloaded");
    expect(createUrlSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeUrlSpy).toHaveBeenCalledTimes(1);
  });

  it("downloads when only canShare exists (partial Web Share support)", async () => {
    stubShare({ canShare: true });

    const channel = await shareOrDownloadVcf(VCF, FILENAME);

    expect(channel).toBe("downloaded");
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
  });
});
