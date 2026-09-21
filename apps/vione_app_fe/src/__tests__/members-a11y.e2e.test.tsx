// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { DirectoryMember } from "@/lib/member-app.functions";

// End-to-end a11y test for the member directory screen. Mounts the REAL
// /m/members route with only the data layer + auth mocked, then asserts the
// accessibility contract: role="list" + aria-live="polite" (+ aria-busy) on the
// list region, and a role="status" announcement that reflects the filtered count.

vi.setConfig({ testTimeout: 20000 });

const BASE: DirectoryMember[] = [
  {
    code: "M1",
    name: "Acme Corp",
    industry: "Manufacturing",
    region: "Hanoi",
    type: "company",
    verified: true,
  },
  {
    code: "M2",
    name: "Beta LLC",
    industry: "Retail",
    region: "Da Nang",
    type: "company",
    verified: false,
  },
  {
    code: "M3",
    name: "Charlie Nguyen",
    industry: "Tech",
    region: "HCM",
    type: "individual",
    verified: true,
  },
];

let dataset: DirectoryMember[] = BASE.map((m) => ({ ...m }));
const listMembers = vi.fn(async () => dataset.map((m) => ({ ...m })));

vi.mock("@/lib/member-app.functions", () => ({
  checkRenewalReminder: vi.fn(async () => ({ created: false })),
  listMembers: (...a: unknown[]) => listMembers(...(a as [])),
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
  dataset = BASE.map((m) => ({ ...m }));
  window.localStorage.clear();
  window.localStorage.setItem("vba.lang", "en");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("members screen — a11y contract (end to end)", () => {
  it("exposes role=list with aria-live=polite and renders listitems", async () => {
    await renderAt("/m/members");
    const list = await getList();
    expect(list.getAttribute("role")).toBe("list");
    expect(list.getAttribute("aria-live")).toBe("polite");
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem").length).toBe(3);
    });
    expect(list.getAttribute("aria-busy")).toBe("false");
  });

  it("announces the filtered member count as the search narrows results", async () => {
    await renderAt("/m/members");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));
    await waitFor(() =>
      expect(screen.getByTestId("members-announcement").textContent).toBe("3 members."),
    );

    const search = screen.getByRole("textbox");
    await userEvent.type(search, "Acme");
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(1));
    expect(screen.getByTestId("members-announcement").textContent).toBe("1 members.");
  });

  it("has no axe violations once the list has loaded", async () => {
    const { container } = await renderAt("/m/members");
    const list = await getList();
    await waitFor(() => expect(within(list).getAllByRole("listitem").length).toBe(3));
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
