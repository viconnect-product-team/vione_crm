// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import { axe } from "jest-axe";
import type { MyConversation } from "@/lib/member-app.functions";

// End-to-end a11y test for the member messages screen. Mounts the REAL
// /m/messages route with only the data layer + auth mocked, then asserts the
// accessibility contract: role="list" + aria-live="polite" (+ aria-busy) on the
// conversation list, and a role="status" announcement reflecting the count.

vi.setConfig({ testTimeout: 20000 });

const BASE: MyConversation[] = [
  { peerCode: "P1", name: "Acme Corp", last: "See you there", time: "1m", unread: 2 },
  { peerCode: "P2", name: "Beta LLC", last: "Thanks!", time: "1h", unread: 0 },
];

let dataset: MyConversation[] = BASE.map((c: any) => ({ ...c }));
const listConversations = vi.fn(async () => dataset.map((c: any) => ({ ...c })));

vi.mock("@/lib/member-app.functions", () => ({
  checkRenewalReminder: vi.fn(async () => ({ created: false })),
  listConversations: (...a: unknown[]) => listConversations(...(a as [])),
  listMessages: vi.fn(async () => []),
  sendMessage: vi.fn(async () => ({})),
  listMembers: vi.fn(async () => []),
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
  dataset = BASE.map((c: any) => ({ ...c }));
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("messages screen — a11y contract (end to end)", () => {
  it("exposes role=list with aria-live=polite and renders listitems", async () => {
    await renderAt("/m/messages");
    const list = await getList();
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-live")).toBe("polite");
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem").length).toBe(2);
    });
    expect(list.getAttribute("aria-busy")).toBe("false");
  });

  it("announces the conversation count in a role=status live region", async () => {
    await renderAt("/m/messages");
    await getList();
    await waitFor(() => {
      expect(screen.getByTestId("messages-announcement").textContent).toBe("2 conversations.");
    });
  });

  it("has no axe violations once the list has loaded", async () => {
    const { container } = await renderAt("/m/messages");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(2));
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
