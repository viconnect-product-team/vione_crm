// BC-4.1B — pure viewer-capability derivation contract.
import { describe, expect, it } from "vitest";
import { deriveMeetingViewerCapabilities } from "@/lib/business-meetings/capabilities";

describe("BC-4.1B deriveMeetingViewerCapabilities", () => {
  it("non-participant sees nothing", () => {
    const c = deriveMeetingViewerCapabilities({ status: "confirmed", viewerRole: null });
    expect(c).toEqual({
      canView: false,
      canAccept: false,
      canDecline: false,
      canTentative: false,
      canProposeNewTime: false,
      canCancel: false,
      canComplete: false,
      canMarkNoShow: false,
    });
  });

  it("BC-7.6 participant with pending response can accept/decline/tentative", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "required",
      viewerResponseStatus: "pending",
    });
    expect(c.canAccept).toBe(true);
    expect(c.canDecline).toBe(true);
    expect(c.canTentative).toBe(true);
  });

  it("BC-7.6 participant already accepted cannot re-respond in v1", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "required",
      viewerResponseStatus: "accepted",
    });
    expect(c.canAccept).toBe(false);
    expect(c.canDecline).toBe(false);
    expect(c.canTentative).toBe(false);
  });

  it("BC-7.6 participant with tentative may still accept or decline", () => {
    const c = deriveMeetingViewerCapabilities({
      status: "proposed",
      viewerRole: "required",
      viewerResponseStatus: "tentative",
    });
    expect(c.canAccept).toBe(true);
    expect(c.canDecline).toBe(true);
    expect(c.canTentative).toBe(true);
  });

  it("organizer on a draft can only propose (no accept/decline)", () => {
    const c = deriveMeetingViewerCapabilities({ status: "draft", viewerRole: "organizer" });
    expect(c.canView).toBe(true);
    expect(c.canAccept).toBe(false);
    expect(c.canDecline).toBe(false);
  });

  it("invited participant on a proposed meeting can accept, decline, reschedule", () => {
    const c = deriveMeetingViewerCapabilities({ status: "proposed", viewerRole: "required" });
    expect(c.canAccept).toBe(true);
    expect(c.canDecline).toBe(true);
    expect(c.canProposeNewTime).toBe(true);
    expect(c.canCancel).toBe(false); // only organizer cancels
    expect(c.canComplete).toBe(false);
  });

  it("organizer on a proposed meeting can cancel/reschedule but not accept own proposal", () => {
    const c = deriveMeetingViewerCapabilities({ status: "proposed", viewerRole: "organizer" });
    expect(c.canCancel).toBe(true);
    expect(c.canProposeNewTime).toBe(true);
    expect(c.canAccept).toBe(false);
    expect(c.canDecline).toBe(false);
  });

  it("either participant on a confirmed meeting can complete / no-show / reschedule", () => {
    for (const role of ["organizer", "required", "optional"] as const) {
      const c = deriveMeetingViewerCapabilities({ status: "confirmed", viewerRole: role });
      expect(c.canComplete).toBe(true);
      expect(c.canMarkNoShow).toBe(true);
      expect(c.canProposeNewTime).toBe(true);
    }
  });

  it("terminal states expose no lifecycle actions", () => {
    for (const status of ["declined", "cancelled", "completed", "no_show"] as const) {
      const c = deriveMeetingViewerCapabilities({ status, viewerRole: "organizer" });
      expect(c.canAccept).toBe(false);
      expect(c.canDecline).toBe(false);
      expect(c.canProposeNewTime).toBe(false);
      expect(c.canCancel).toBe(false);
      expect(c.canComplete).toBe(false);
      expect(c.canMarkNoShow).toBe(false);
      expect(c.canView).toBe(true);
    }
  });
});
