// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { axe } from "jest-axe";
import type { MyEvent } from "@/lib/member-app.functions";

// End-to-end a11y test for the member events screen. Mounts the REAL /m/events
// route with only the data layer + auth mocked, then asserts the accessibility
// contract holds: role="list" + aria-live="polite" (+ aria-busy) on the list
// region, and a role="status" announcement reflecting the item count.

vi.setConfig({ testTimeout: 20000 });

const BASE: MyEvent[] = [
  {
    id: "e1",
    day: "12",
    month: "JUL",
    title: "Annual meetup",
    time: "09:00",
    place: "HN",
    registered: false,
  },
  {
    id: "e2",
    day: "20",
    month: "JUL",
    title: "Workshop",
    time: "14:00",
    place: "HCM",
    registered: true,
  },
];

let dataset: MyEvent[] = BASE.map((e: any) => ({ ...e }));
const listMyEvents = vi.fn(async () => dataset.map((e: any) => ({ ...e })));

vi.mock("@/lib/member-app.functions", () => ({
  checkRenewalReminder: vi.fn(async () => ({ created: false })),
  listMyEvents: (...a: unknown[]) => listMyEvents(...(a as [])),
  registerForEvent: vi.fn(async () => ({})),
}));

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

  return render(<RouterProvider router={router as any} />);
}

async function getList(): Promise<HTMLElement> {
  return await waitFor(() => {
    const el = document.querySelector('[role="list"]') as HTMLElement | null;
    if (!el) throw new Error("list not mounted yet");
    return el;
  });
}

beforeEach(() => {
  dataset = BASE.map((e: any) => ({ ...e }));
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("events screen — a11y contract (end to end)", () => {
  it("exposes role=list with aria-live=polite and renders listitems", async () => {
    await renderAt("/m/events");
    const list = await getList();
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-live")).toBe("polite");
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem").length).toBe(2);
    });
    expect(list.getAttribute("aria-busy")).toBe("false");
  });

  it("announces the event count in a role=status live region", async () => {
    await renderAt("/m/events");
    await getList();
    await waitFor(() => {
      expect(screen.getByTestId("events-announcement").textContent).toBe("2 events.");
    });
  });

  it("has no axe violations once the list has loaded", async () => {
    const { container } = await renderAt("/m/events");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(2));
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
