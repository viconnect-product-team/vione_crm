// @vitest-environment jsdom
// BC-Mobile-0B — shell contract, a11y, i18n, and structural security gates.
//
// Covers: frozen 5-position nav order (EN/VI), V-is-center + non-navigation,
// aria-current active semantics, touch targets ≥ 52px, V sheet frozen
// capabilities with truthful "coming soon" states, keyboard dismissal,
// axe audit, and the server/mock boundary scans for the BC mobile layer.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { axe } from "jest-axe";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangContext } from "@/lib/i18n";
import { BusinessConnectMobileShell } from "@/components/business-connect/mobile/BusinessConnectMobileShell";
import { V_ACTIONS } from "@/components/business-connect/mobile/VActionSheet";

// vaul (drawer) references ResizeObserver; jsdom does not implement it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver ??= ResizeObserverStub;

const MOBILE_DIR = join(process.cwd(), "src/components/business-connect/mobile");
const ROUTES_DIR = join(process.cwd(), "src/routes");

/** Fails with a readable summary when axe finds a violation. */
async function assertNoAxeViolations(container: Element) {
  const results = await axe(container);
  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `- ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join("\n");
    throw new Error(`axe found accessibility violations:\n${summary}`);
  }
}

async function renderShellAt(pathname: string, lang: "vi" | "en" = "en") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <LangContext.Provider value={{ lang, setLang: () => {} }}>
          <BusinessConnectMobileShell>
            <Outlet />
          </BusinessConnectMobileShell>
        </LangContext.Provider>
      </QueryClientProvider>
    ),
  });
  const leaf = (path: string, label: string) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => <h1>{label}</h1> });
  const routeTree = rootRoute.addChildren([
    leaf("/connect-app", "home page"),
    leaf("/connect-app/network", "network page"),
    leaf("/connect-app/community", "community page"),
    leaf("/connect-app/me", "me page"),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });
  const utils = render(<RouterProvider router={router} />);
  await screen.findByRole("navigation", {
    name: lang === "vi" ? "Điều hướng chính" : "Primary navigation",
  });
  return { router, ...utils };
}

afterEach(() => cleanup());

/** Interactive nav items in DOM order (links + the V button). */
function navItems(nav: HTMLElement): HTMLElement[] {
  return Array.from(nav.querySelectorAll<HTMLElement>("a, button"));
}

function itemName(el: HTMLElement): string | null {
  return el.getAttribute("aria-label") ?? el.textContent;
}

describe("BC-Mobile-0B — frozen 5-position navigation", () => {
  it("renders exactly 5 positions in the frozen order with EN labels", async () => {
    await renderShellAt("/connect-app");
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const items = navItems(nav);
    expect(items).toHaveLength(5);
    expect(items.map(itemName)).toEqual([
      "Home",
      "Network",
      "Open V quick actions",
      "Community",
      "Me",
    ]);
  });

  it("renders the same frozen order with VI labels", async () => {
    await renderShellAt("/connect-app", "vi");
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    const items = navItems(nav);
    expect(items).toHaveLength(5);
    expect(items.map(itemName)).toEqual([
      "Trang chủ",
      "Network",
      "Mở hành động nhanh V",
      "Cộng đồng",
      "Tôi",
    ]);
  });

  it("V is always the center (3rd) position", async () => {
    await renderShellAt("/connect-app");
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const items = navItems(nav);
    expect(items[2].getAttribute("aria-label")).toBe("Open V quick actions");
    expect(items[2].tagName).toBe("BUTTON");
  });

  it("marks the active tab with aria-current=page and others without", async () => {
    await renderShellAt("/connect-app/network");
    const nav = screen.getByRole("navigation", { name: "Primary navigation" });
    const network = within(nav).getByRole("link", { name: "Network" });
    expect(network.getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
    expect(
      within(nav).getByRole("link", { name: "Community" }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("V touch target is at least 52×52", async () => {
    await renderShellAt("/connect-app");
    const v = screen.getByRole("button", { name: "Open V quick actions" });
    expect(v.className).toContain("min-h-[52px]");
    expect(v.className).toContain("min-w-[52px]");
    expect(v.className).toMatch(/h-\[(?:58|72)px\]/);
    expect(v.className).toMatch(/w-\[(?:58|72)px\]/);
  });

  it("has no axe violations on the shell", async () => {
    const { container } = await renderShellAt("/connect-app");
    await assertNoAxeViolations(container);
  });
});

describe("BC-Mobile-0B — V action sheet", () => {
  it("exposes all five frozen capabilities with truthful availability states", () => {
    expect(V_ACTIONS.map((a: any) => a.id)).toEqual([
      "presentQr",
      "nfc",
      "scanQr",
      "scanCard",
      "meetingMoment",
    ]);
    for (const action of V_ACTIONS) {
      expect(["available", "soon"]).toContain(action.status);
    }
  });

  it("opens on V press WITHOUT navigating and lists the five capabilities with truthful states", async () => {
    const { router } = await renderShellAt("/connect-app");
    fireEvent.click(screen.getByRole("button", { name: "Open V quick actions" }));
    const dialog = await screen.findByRole("dialog", { name: "Quick actions" });

    // The V button must never change the route.
    expect(router.state.location.pathname).toBe("/connect-app");

    const items = within(dialog).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const texts = items.map((i) => i.textContent ?? "");
    const expected = [
      "Present QR",
      "NFC tap",
      "Scan QR",
      "Scan business card",
      "Save meeting moment",
    ];
    expected.forEach((name, idx) => expect(texts[idx]).toContain(name));
    // Truthful availability: NFC + Scan QR now reuse the shipped 5B/5E flows,
    // so every capability is available — nothing is "coming soon".
    for (const text of texts) expect(text).not.toContain("Coming soon");
  });

  it("renders the sheet in Vietnamese", async () => {
    await renderShellAt("/connect-app", "vi");
    fireEvent.click(screen.getByRole("button", { name: "Mở hành động nhanh V" }));
    const dialog = await screen.findByRole("dialog", { name: "Hành động nhanh" });
    const items = within(dialog).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const texts = items.map((i) => i.textContent ?? "");
    for (const text of texts) expect(text).not.toContain("Sắp ra mắt");
  });

  // NOTE: jsdom never fires transitionend, so vaul keeps the drawer mounted
  // after close; the observable close signal is data-state="closed". Reopen
  // paths are therefore covered by separate fresh renders.
  const expectSheetClosed = async () => {
    await waitFor(() => {
      const drawer = document.querySelector("[data-vaul-drawer]");
      expect(drawer?.getAttribute("data-state")).toBe("closed");
    });
  };

  it("closes via the named close button", async () => {
    await renderShellAt("/connect-app");
    fireEvent.click(screen.getByRole("button", { name: "Open V quick actions" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Close quick actions" }));
    await expectSheetClosed();
  });

  it("closes via Escape (keyboard dismissal path)", async () => {
    await renderShellAt("/connect-app");
    fireEvent.click(screen.getByRole("button", { name: "Open V quick actions" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await expectSheetClosed();
  });
});

describe("BC-Mobile-0B — structural gates", () => {
  const mobileFiles = readdirSync(MOBILE_DIR).filter((f) => /\.tsx?$/.test(f));

  it("all six frozen shell files exist", () => {
    for (const f of [
      "BusinessConnectMobileShell.tsx",
      "BusinessConnectBottomNav.tsx",
      "BusinessConnectTopBar.tsx",
      "MobilePage.tsx",
      "VButton.tsx",
      "VActionSheet.tsx",
    ]) {
      expect(mobileFiles).toContain(f);
    }
  });

  it("shell boundary: no server-only, service-role, or mock imports in the BC mobile layer", () => {
    const FORBIDDEN_TOKENS = [
      ".server",
      "client.server",
      "service_role",
      "serviceRole",
      "SERVICE_ROLE",
      "supabaseAdmin",
      "CURRENT_USER_ID",
      '-data"',
      "-data'",
      "member-app-data",
      "networking-data",
      "members-data",
    ];
    const bcRouteFiles = readdirSync(ROUTES_DIR).filter((f) => f.startsWith("connect-app"));
    for (const [dir, file] of [
      ...mobileFiles.map((f) => [MOBILE_DIR, f] as const),
      ...bcRouteFiles.map((f) => [ROUTES_DIR, f] as const),
    ]) {
      const src = readFileSync(join(dir, file), "utf8");
      for (const token of FORBIDDEN_TOKENS) {
        expect(src.includes(token), `${file} must not contain "${token}"`).toBe(false);
      }
    }
  });

  it("BC mobile layer consumes only --bc-mobile-* tokens (never --vba-*)", () => {
    for (const file of mobileFiles) {
      const src = readFileSync(join(MOBILE_DIR, file), "utf8");
      expect(src.includes("vba-"), `${file} must not reference legacy vba tokens`).toBe(false);
    }
  });

  it("design tokens and safe-area utilities are registered in styles.css", () => {
    const css = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
    for (const token of [
      "--bc-mobile-bg",
      "--bc-mobile-surface",
      "--bc-mobile-navy",
      "--bc-mobile-accent",
      "--bc-mobile-muted",
      "--bc-mobile-border",
      "--bc-mobile-safe-top",
      "--bc-mobile-safe-bottom",
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toContain("env(safe-area-inset-bottom");
  });

  it("all five /connect-app routes exist with SEO head()", () => {
    // BC-7A: /connect-app/community is now an Outlet layout route — the SEO
    // head lives on its index leaf, so the leaf is asserted here instead.
    // Same for /connect-app/me (layout + index) since the Me sub-pages shipped.
    for (const routeFile of [
      "connect-app.tsx",
      "connect-app.index.tsx",
      "connect-app.network.tsx",
      "connect-app.community.index.tsx",
      "connect-app.me.index.tsx",
    ]) {
      const path = join(ROUTES_DIR, routeFile);
      expect(existsSync(path), `${routeFile} must exist`).toBe(true);
      expect(readFileSync(path, "utf8")).toContain("head:");
    }
  });

  it("BC PWA manifest exists with the Executive Minimal Luxury theme", () => {
    const manifest = JSON.parse(
      readFileSync(join(process.cwd(), "public/manifest-bc.webmanifest"), "utf8"),
    );
    expect(manifest.start_url).toBe("/connect-app");
    expect(manifest.theme_color).toBe("#050C15");
    expect(manifest.background_color).toBe("#050C15");
  });

  it("legacy /m shell is untouched (MemberScreen + MemberTabBar intact)", () => {
    const memberShell = readFileSync(
      join(process.cwd(), "src/components/member/MemberShell.tsx"),
      "utf8",
    );
    expect(memberShell).toContain("export function MemberScreen");
    expect(memberShell).toContain("function MemberTabBar");
  });
});
