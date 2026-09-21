// @vitest-environment jsdom
// BC-Mobile — Header Connect-app: kiểm thử responsive/snapshot chống lỗi
// header bị đè lên thanh trạng thái (giờ / sóng / pin).
//
// Hợp đồng được khoá bởi shard này:
//   1. styles.css khai báo đủ bộ token baseline của header.
//   2. Công thức safe-area cho ra khoảng cách >= 16px trên mọi máy phổ biến
//      (không notch, notch, Dynamic Island) và không dư thừa trên máy phẳng.
//   3. Mọi header Connect-app dùng token safe-area + token kích thước,
//      không hardcode padding/kích thước icon.
//   4. Snapshot cấu trúc header "Tôi" ở các độ phân giải phổ biến.

import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, cleanup } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { LangContext } from "@/lib/i18n";
import { MeHeader } from "@/components/business-connect/mobile/me/MeHeader";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const CSS = read("src/styles.css");
const HEADER_FILES = {
  me: read("src/components/business-connect/mobile/me/MeHeader.tsx"),
  home: read("src/components/business-connect/mobile/ExecutiveHome.tsx"),
  network: read("src/components/business-connect/mobile/NetworkHome.tsx"),
  topbar: read("src/components/business-connect/mobile/BusinessConnectTopBar.tsx"),
};

/** Thiết bị phổ biến: [nhãn, chiều rộng, chiều cao, safe-area-inset-top]. */
const DEVICES: Array<[string, number, number, number]> = [
  ["iPhone SE (không notch)", 375, 667, 0],
  ["iPhone 8 Plus (không notch)", 414, 736, 0],
  ["iPhone 13 mini (notch)", 375, 812, 50],
  ["iPhone 14 (notch)", 390, 844, 47],
  ["iPhone 15 Pro Max (Dynamic Island)", 430, 932, 59],
];

/** Mô phỏng đúng công thức trong styles.css: max(inset, 12px) + 4px. */
const safeTopCompact = (inset: number) => Math.max(inset, 12) + 4;

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

afterEach(() => cleanup());

describe("BC-Mobile header — token baseline", () => {
  it("khai báo đủ token baseline của header", () => {
    for (const token of [
      "--bc-mobile-safe-top-compact",
      "--bc-mobile-header-h",
      "--bc-mobile-header-avatar",
      "--bc-mobile-header-action",
      "--bc-mobile-header-title",
      "--bc-mobile-header-gap",
      "--bc-mobile-header-icon",
    ]) {
      expect(CSS).toContain(`${token}:`);
    }
  });

  it("công thức safe-area giữ nguyên (max(inset, 12px) + 4px)", () => {
    expect(CSS).toMatch(
      /--bc-mobile-safe-top-compact:\s*calc\(max\(env\(safe-area-inset-top,\s*0px\),\s*12px\)\s*\+\s*4px\)/,
    );
  });

  it("nút chạm >= 44px và icon <= nút", () => {
    const action = Number(/--bc-mobile-header-action:\s*(\d+)px/.exec(CSS)?.[1]);
    const icon = Number(/--bc-mobile-header-icon:\s*(\d+)px/.exec(CSS)?.[1]);
    const height = Number(/--bc-mobile-header-h:\s*(\d+)px/.exec(CSS)?.[1]);
    const avatar = Number(/--bc-mobile-header-avatar:\s*(\d+)px/.exec(CSS)?.[1]);
    expect(action).toBeGreaterThanOrEqual(44);
    expect(icon).toBeLessThanOrEqual(action);
    expect(avatar).toBeLessThanOrEqual(height);
  });
});

describe("BC-Mobile header — khoảng cách an toàn theo thiết bị", () => {
  for (const [label, width, height, inset] of DEVICES) {
    it(`${label}: header không đè thanh trạng thái`, () => {
      setViewport(width, height);
      const top = safeTopCompact(inset);
      // Luôn cách mép trên tối thiểu 16px, và luôn phủ hết vùng notch.
      expect(top).toBeGreaterThanOrEqual(16);
      expect(top).toBeGreaterThanOrEqual(inset);
      // Không tạo khoảng trắng thừa trên máy không notch.
      if (inset === 0) expect(top).toBeLessThanOrEqual(20);
    });
  }
});

describe("BC-Mobile header — không hardcode kích thước", () => {
  for (const [name, source] of Object.entries(HEADER_FILES)) {
    it(`${name}: dùng token thay vì số cứng`, () => {
      if (name !== "network") {
        expect(source).toContain("var(--bc-mobile-safe-top-compact)");
      }
      expect(source).toContain("var(--bc-mobile-header-");
      // Không được quay lại padding-top cố định theo px.
      expect(source).not.toMatch(/paddingTop:\s*"\d+px"/);
    });
  }

  it("Network dùng chung chiều cao baseline của header", () => {
    expect(HEADER_FILES.network).toContain("var(--bc-mobile-header-h)");
  });
});

describe("BC-Mobile header — snapshot cấu trúc", () => {
  function renderMeHeader() {
    const rootRoute = createRootRoute({
      component: () => (
        <LangContext.Provider value={{ lang: "vi", setLang: () => {} }}>
          <MeHeader
            avatarUrl={null}
            displayName="Nguyễn Tuấn Trường"
            email="truong@vione.vn"
            verified
          />
        </LangContext.Provider>
      ),
    });
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    return render(<RouterProvider router={router as never} />);
  }

  for (const [label, width, height] of DEVICES) {
    it(`${label}: cấu trúc header "Tôi" ổn định`, async () => {
      setViewport(width, height);
      const { container, findByRole } = renderMeHeader();
      await findByRole("banner");
      const header = container.querySelector("header") as HTMLElement;
      // Snapshot bám vào style nội tuyến (token) chứ không phải px cụ thể.
      expect(header.getAttribute("style")).toMatchSnapshot();
      cleanup();
    });
  }
});
