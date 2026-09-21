// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { MyNotification } from "@/lib/member-app.functions";

// End-to-end a11y test for the member notifications screen. It mounts the REAL
// /m/notifications route in a memory router with only the data layer + auth
// mocked, then asserts the accessibility contract holds while the user changes
// the filter, changes the sort, and refreshes the list:
//   - the list region exposes role="list" + aria-live="polite" (+ aria-busy)
//   - filter/sort toggle buttons expose the correct aria-pressed state
//   - refreshing (mark all as read) re-renders inside the live region

vi.setConfig({ testTimeout: 20000 });

const BASE: MyNotification[] = [
  {
    id: "n-lead",
    title: "New lead from Acme",
    body: "Someone scanned your card.",
    time: "1m",
    createdAt: "2026-07-11T10:00:00.000Z",
    type: "lead",
    unread: true,
    dismissed: false,
    priority: "high",
    personal: true,
    refType: "lead",
    refId: "lead-1",
    leadStatus: "new",
  },
  {
    id: "n-event",
    title: "Upcoming event",
    body: "Annual meetup next week.",
    time: "2h",
    createdAt: "2026-07-11T08:00:00.000Z",
    type: "event",
    unread: true,
    dismissed: false,
    priority: "medium",
    personal: true,
    refType: null,
    refId: null,
    leadStatus: null,
  },
  {
    id: "n-fee",
    title: "Fee receipt",
    body: "Your membership fee was received.",
    time: "1d",
    createdAt: "2026-07-10T10:00:00.000Z",
    type: "fee",
    unread: false,
    dismissed: false,
    priority: "low",
    personal: true,
    refType: null,
    refId: null,
    leadStatus: null,
  },
];

// Mutable dataset the mocked list fn reads from, so a "refresh" (reload) can
// return a different snapshot (e.g. all-read after mark-all-read).
let dataset: MyNotification[] = BASE.map((n: any) => ({ ...n }));

const listMyNotifications = vi.fn(async () => dataset.map((n: any) => ({ ...n })));
const markAllNotificationsReadFn = vi.fn(async () => {
  dataset = dataset.map((n: any) => ({ ...n, unread: false }));
  return { ids: BASE.filter((n) => n.unread).map((n: any) => n.id) };
});

vi.mock("@/lib/member-app.functions", () => ({
  listMyNotifications: (...a: unknown[]) => listMyNotifications(...(a as [])),
  markAllNotificationsReadFn: (...a: unknown[]) => markAllNotificationsReadFn(...(a as [])),
  unmarkAllNotificationsReadFn: vi.fn(async () => ({})),
  markNotificationReadFn: vi.fn(async () => ({})),
  dismissNotificationFn: vi.fn(async () => ({})),
  dismissAllNotificationsFn: vi.fn(async () => ({ ids: [] })),
  dismissBroadcastNotificationsFn: vi.fn(async () => ({})),
  restoreNotificationFn: vi.fn(async () => ({})),
  restoreBroadcastNotificationsFn: vi.fn(async () => ({})),
  restoreAllPersonalNotificationsFn: vi.fn(async () => ({})),
  checkRenewalReminder: vi.fn(async () => ({ created: false })),
}));

vi.mock("@/lib/business-card.functions", () => ({
  processLeadWorkflowFn: vi.fn(async () => ({})),
}));

// Root AuthGate + the /m gate read the Supabase session. Provide an
// authenticated stub so the route renders instead of redirecting to /auth.
vi.mock("@/integrations/supabase/client", () => {
  const user = { id: "auth-user-test", email: "tester@example.com" };
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: (v: { data: unknown[]; error: null }) => unknown) =>
      resolve({ data: [], error: null }),
  };
  const channel: any = { on: () => channel, subscribe: () => channel };
  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user }, error: null }),
        getSession: async () => ({ data: { session: { user } }, error: null }),
        onAuthStateChange: (cb: (e: string, s: { user: typeof user }) => void) => {
          cb("SIGNED_IN", { user });
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
      },
      from: () => builder,
      rpc: async () => ({ data: [], error: null }),
      channel: () => channel,
      removeChannel: () => {},
    },
  };
});

async function renderAt(path: string) {
  const { createRouter, RouterProvider, createMemoryHistory } =
    await import("@tanstack/react-router");
  const { routeTree } = await import("@/routeTree.gen");
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history, defaultPreloadStaleTime: 0 });

  const utils = render(<RouterProvider router={router as any} />);
  return { router, ...utils };
}

async function getList(): Promise<HTMLElement> {
  return await waitFor(() => {
    const el = document.querySelector('[role="list"]') as HTMLElement | null;
    if (!el) throw new Error("list not mounted yet");
    return el;
  });
}

beforeEach(() => {
  dataset = BASE.map((n: any) => ({ ...n }));
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("notifications screen — a11y contract (end to end)", () => {
  it("exposes role=list with aria-live=polite on the notification list", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-live")).toBe("polite");
    // All three notifications render as listitems once loading resolves.
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem").length).toBe(3);
    });
    expect(list.getAttribute("aria-busy")).toBe("false");
  });

  it("updates aria-pressed on filter buttons and filters the visible list", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));

    // Default filter is "All" — it must be the pressed filter button.
    expect(screen.getByRole("button", { name: "All", pressed: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unread", pressed: false })).toBeTruthy();

    // Switch to "Unread": aria-pressed moves and only unread items remain.
    await userEvent.click(screen.getByRole("button", { name: "Unread" }));
    expect(screen.getByRole("button", { name: "Unread", pressed: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All", pressed: false })).toBeTruthy();
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem").length).toBe(2);
    });
  });

  it("updates aria-pressed on sort buttons", async () => {
    await renderAt("/m/notifications");
    await getList();

    // Default sort is priority-first.
    expect(screen.getByRole("button", { name: "Priority first", pressed: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Created time first", pressed: false })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Created time first" }));
    expect(screen.getByRole("button", { name: "Created time first", pressed: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Priority first", pressed: false })).toBeTruthy();
  });

  it("refreshes the list inside the live region after mark-all-read", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));

    // Two unread indicators (role=status) before refreshing.
    await waitFor(() => {
      expect(within(list).getAllByRole("status").length).toBe(2);
    });

    // The polite live region announces the current unread summary beforehand.
    const announcement = () => screen.getByTestId("noti-announcement") as HTMLElement;
    await waitFor(() => expect(announcement().textContent).toBe("3 notifications, 2 unread."));

    // "Mark all as read" mutates the dataset and reloads the list.
    await userEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

    // The refreshed data flows through the same aria-live list: no unread dots.
    await waitFor(() => {
      expect(within(list).queryAllByRole("status").length).toBe(0);
    });

    // The announcement message changes to the "all read" state so screen
    // readers hear the refresh, not just the silent DOM change.
    await waitFor(() => expect(announcement().textContent).toBe("All notifications are read."));

    expect(markAllNotificationsReadFn).toHaveBeenCalledTimes(1);
    // Fetched at least twice: initial mount + reload after the refresh.
    expect(listMyNotifications.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("announcement reflects the filtered unread count", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));

    const announcement = () => screen.getByTestId("noti-announcement") as HTMLElement;
    await waitFor(() => expect(announcement().textContent).toBe("3 notifications, 2 unread."));

    // Filtering to "Unread" leaves 2 items, all unread — the announcement
    // must update accordingly within the same live region.
    await userEvent.click(screen.getByRole("button", { name: "Unread" }));
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(2));
    await waitFor(() => expect(announcement().textContent).toBe("2 notifications, 2 unread."));

    // Filtering to "Read" leaves the single read item — no unread remain.
    await userEvent.click(screen.getByRole("button", { name: "Read" }));
    await waitFor(() => expect(announcement().textContent).toBe("All notifications are read."));
  });
});

describe("notifications screen — automated axe-core audit", () => {
  // Rules meaningful in jsdom (which has no layout engine, so colour-contrast
  // and any pixel-geometry rules can't run reliably). We focus axe on the
  // ARIA, role, name and landmark rules that ARE computable from the DOM.
  const AXE_OPTIONS = {
    runOnly: {
      type: "tag" as const,
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      // Contrast needs real layout/colours — not available under jsdom.
      "color-contrast": { enabled: false },
      // A memory-router mount of a single screen has no full page landmarks.
      region: { enabled: false },
    },
  };

  async function auditNoViolations() {
    const results = await axe(document.body, AXE_OPTIONS);
    if (results.violations.length) {
      const summary = results.violations
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
        .join("\n");
      throw new Error(`axe found accessibility violations:\n${summary}`);
    }
    expect(results.violations).toEqual([]);
  }

  it("has no axe violations on initial load, and across filter/sort/refresh", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));

    // 1) Initial rendered state.
    await auditNoViolations();

    // 2) After switching the filter to "Unread".
    await userEvent.click(screen.getByRole("button", { name: "Unread" }));
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(2));
    await auditNoViolations();

    // 3) After changing the sort order.
    await userEvent.click(screen.getByRole("button", { name: "Created time first" }));
    await auditNoViolations();

    // 4) After refreshing via "Mark all as read".
    await userEvent.click(screen.getByRole("button", { name: "All" }));
    await userEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    await waitFor(() => expect(within(list).queryAllByRole("status").length).toBe(0));
    await auditNoViolations();
  });
});

describe("notifications screen — aria-busy during reload", () => {
  // A tiny deferred so we can hold the next list fetch pending and observe the
  // in-flight (aria-busy="true") state before resolving it.
  function deferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  it("keeps aria-busy=false on filter/sort (client-side) and flips true→false on reload", async () => {
    await renderAt("/m/notifications");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));
    expect(list.getAttribute("aria-busy")).toBe("false");

    // Changing the filter is a pure client-side derivation — no refetch, so the
    // live region must NOT enter the busy state.
    await userEvent.click(screen.getByRole("button", { name: "Unread" }));
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(2));
    expect(list.getAttribute("aria-busy")).toBe("false");

    // Same for changing the sort order.
    await userEvent.click(screen.getByRole("button", { name: "Created time first" }));
    expect(list.getAttribute("aria-busy")).toBe("false");
    await userEvent.click(screen.getByRole("button", { name: "All" }));

    // Now trigger a REAL reload and hold the fetch pending so we can observe the
    // in-flight busy state announced to assistive tech.
    const pending = deferred<MyNotification[]>();
    listMyNotifications.mockImplementationOnce(async () => pending.promise);

    await userEvent.click(screen.getByRole("button", { name: "Mark all as read" }));

    // While the reload is in flight, the live region exposes aria-busy="true".
    await waitFor(() => expect(list.getAttribute("aria-busy")).toBe("true"));

    // Resolve the fetch with the refreshed (all-read) snapshot.
    pending.resolve(dataset.map((n: any) => ({ ...n })));

    // Once settled, aria-busy returns to "false" and unread indicators are gone.
    await waitFor(() => expect(list.getAttribute("aria-busy")).toBe("false"));
    expect(within(list).queryAllByRole("status").length).toBe(0);
  });
});
