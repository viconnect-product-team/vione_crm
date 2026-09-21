// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  hasRememberedVioneAppContext,
  rememberVioneAppContext,
  resolveVionePostLoginPath,
  shouldUseVioneAuth,
} from "@/lib/business-connect/mobile/vione-auth-context";

describe("ViOne auth context", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists the Vione context independently from the manifest", () => {
    expect(hasRememberedVioneAppContext()).toBe(false);
    rememberVioneAppContext();
    expect(hasRememberedVioneAppContext()).toBe(true);
  });

  it("uses Connect-app login for direct /auth", () => {
    expect(
      shouldUseVioneAuth({
        mobileParam: false,
        redirectPath: "",
        directAuth: true,
        remembered: false,
        standalone: false,
      }),
    ).toBe(true);
  });

  it.each([
    ["explicit marker", true, false, false],
    ["remembered device", false, true, false],
    ["standalone shortcut", false, false, true],
  ])("uses Connect-app login for %s", (_label, mobileParam, remembered, standalone) => {
    expect(
      shouldUseVioneAuth({
        mobileParam,
        redirectPath: "/m",
        directAuth: false,
        remembered,
        standalone,
      }),
    ).toBe(true);
  });

  it("does not change an ordinary web redirect without Vione signals", () => {
    expect(
      shouldUseVioneAuth({
        mobileParam: false,
        redirectPath: "/profile",
        directAuth: false,
        remembered: false,
        standalone: false,
      }),
    ).toBe(false);
  });

  it("overrides a legacy member start route in Vione context", () => {
    expect(resolveVionePostLoginPath("/m", true)).toBe("/connect-app");
    expect(resolveVionePostLoginPath("/connect-app/network", true)).toBe("/connect-app/network");
    expect(resolveVionePostLoginPath("/profile", false)).toBe("/profile");
  });
});
