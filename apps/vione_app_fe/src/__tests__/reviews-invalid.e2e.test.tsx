// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Member } from "@/lib/members-data";

// Mounting the real member-360 route runs several async loaders before the
// networking/reviews tab is interactive, so give each case more headroom than
// the 5s default.
vi.setConfig({ testTimeout: 20000 });

// ---------------------------------------------------------------------------
// End-to-end test for the reviews tab 400-style UX. It mounts the REAL
// /members/$memberId route (loader, search validation, error UI, reset link)
// in a memory router, with only the data layer mocked so nothing hits the
// server functions / database.
//
// Note: we no-op the memory history's `replace` so the router does not rewrite
// the URL away from the invalid params. This mirrors a real browser, where the
// address bar keeps `?reviewFilter=bogus`; without it the in-memory history
// re-stringifies the validated (defaulted) search and the error state would
// never be observable.
// ---------------------------------------------------------------------------
const MEMBER: Member = {
  id: "test-id",
  code: "VBA-TEST",
  name: "Test Member Co.",
  contact: "Test Contact",
  email: "test@example.com",
  phone: "0900 000 000",
  type: "company",
  level: "memberLevel.medium",
  industry: "ind.trade",
  region: "region.north",
  status: "active",
  joinedAt: "2023-01-01",
  feeYear: 2024,
  feePaid: true,
  address: "123 Test St",
  about: "About test member.",
};

vi.mock("@/lib/members.functions", () => ({
  getMemberFn: vi.fn(async () => MEMBER),
  updateMemberContactFn: vi.fn(async () => MEMBER),
}));

vi.mock("@/lib/reviews.functions", () => ({
  listReviewsFn: vi.fn(async () => ({ reviews: [], stats: { count: 0, avg: 0 } })),
  addReviewFn: vi.fn(async () => ({})),
  updateReviewFn: vi.fn(async () => ({})),
  deleteReviewFn: vi.fn(async () => ({})),
}));

vi.mock("@/lib/marketplace-data", () => ({
  listProductsBySeller: () => [],
}));

vi.mock("@/lib/reviews-data", () => ({
  getInteractionsWith: () => [],
}));

// The /members/$memberId loader also calls these auth-gated server functions.
// In jsdom there is no TanStack server to resolve /_serverFn/*, so mock them
// with empty, correctly-shaped data (this test only exercises the reviews-tab
// search-param UX, not marketplace / activity data).
vi.mock("@/lib/marketplace.functions", () => ({
  listProductsFn: vi.fn(async () => []),
}));

vi.mock("@/lib/member-activity.functions", () => ({
  listInteractionsWithFn: vi.fn(async () => ({
    items: [],
    total: 0,
    hasMore: false,
    stats: {
      all: 0,
      week: 0,
      month: 0,
      byType: { connect: 0, message: 0, quote: 0, meeting: 0, event: 0 },
    },
  })),
}));

vi.mock("@/lib/member-account.functions", () => ({
  getMemberAccountStatusFn: vi.fn(async () => "none"),
}));

// AuthGate (root) and useRole read the Supabase session/tables. Provide an
// authenticated stub so the member page renders instead of redirecting to /auth.
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
  const channel: any = {
    on: () => channel,
    subscribe: () => channel,
  };
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
  // Keep the raw (possibly invalid) search params, like a real browser URL.
  history.replace = (() => {}) as typeof history.replace;
  const router = createRouter({ routeTree, history, defaultPreloadStaleTime: 0 });

  const utils = render(<RouterProvider router={router as any} />);
  return { router, ...utils };
}

async function openReviewsTab() {
  // Reviews now live inside the "Networking" (Kết nối) tab of the member 360
  // page. The page renders after several async loaders resolve, so allow extra
  // time for the tab control to appear.
  const reviewsTab = await screen.findByRole(
    "button",
    { name: /reviews|đánh giá|networking|kết nối/i },
    { timeout: 8000 },
  );
  await userEvent.click(reviewsTab);
}

beforeEach(() => {
  window.localStorage.setItem("vba.lang", "en");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("reviews tab — invalid query params (end to end)", () => {
  it("renders the 400-style error UI for an invalid reviewFilter and recovers via the reset link", async () => {
    const { router, container } = await renderAt("/members/test-id?reviewFilter=bogus");
    await openReviewsTab();

    // 400-style error UI is shown because a present param is invalid. The Zod
    // refinement message is language-independent, so assert on it directly.
    expect(await screen.findByText(/reviewFilter must be one of/i)).toBeTruthy();

    // The invalid value is still in the URL (lenient parse does not rewrite it).
    expect(router.state.location.searchStr).toContain("reviewFilter=bogus");

    // Click the reset link (the primary CTA inside the error section).
    const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
    expect(resetLink).toBeTruthy();
    await userEvent.click(resetLink);

    // URL now reflects the default valid params...
    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        reviewFilter: "all",
        reviewSort: "recent",
      });
    });
    expect(router.state.location.searchStr).not.toContain("bogus");

    // ...and the error UI is gone (normal reviews state renders).
    await waitFor(() => {
      expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();
    });
  });

  it("flags both fields when reviewFilter and reviewSort are both invalid", async () => {
    await renderAt("/members/test-id?reviewFilter=x&reviewSort=y");
    await openReviewsTab();

    expect(await screen.findByText(/reviewFilter must be one of/i)).toBeTruthy();
    expect(screen.getByText(/reviewSort must be one of/i)).toBeTruthy();
  });

  it("flags only reviewSort when reviewFilter is missing and reviewSort is invalid", async () => {
    const { router, container } = await renderAt("/members/test-id?reviewSort=nope");
    await openReviewsTab();

    // Missing reviewFilter falls back to its default; the present reviewSort is
    // invalid, so the 400-style UI shows for reviewSort only.
    expect(await screen.findByText(/reviewSort must be one of/i)).toBeTruthy();
    expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();

    // Reset restores valid defaults and clears the error.
    const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
    await userEvent.click(resetLink);
    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        reviewFilter: "all",
        reviewSort: "recent",
      });
    });
    await waitFor(() => {
      expect(screen.queryByText(/reviewSort must be one of/i)).toBeNull();
    });
  });

  it("flags only reviewFilter when reviewSort is missing and reviewFilter is invalid", async () => {
    const { router, container } = await renderAt("/members/test-id?reviewFilter=bogus");
    await openReviewsTab();

    expect(await screen.findByText(/reviewFilter must be one of/i)).toBeTruthy();
    expect(screen.queryByText(/reviewSort must be one of/i)).toBeNull();

    const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
    await userEvent.click(resetLink);
    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        reviewFilter: "all",
        reviewSort: "recent",
      });
    });
    await waitFor(() => {
      expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();
    });
  });

  it("shows the normal reviews state (no error) when both params are missing (defaults)", async () => {
    await renderAt("/members/test-id");
    await openReviewsTab();

    // Absent params silently use defaults — no 400 error.
    expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();
    expect(screen.queryByText(/reviewSort must be one of/i)).toBeNull();
  });

  it("shows the normal reviews state (no error) when params are valid", async () => {
    const { router } = await renderAt("/members/test-id?reviewFilter=event&reviewSort=highest");
    await openReviewsTab();

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        reviewFilter: "event",
        reviewSort: "highest",
      });
    });
    expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();
    expect(screen.queryByText(/reviewSort must be one of/i)).toBeNull();
  });
});

describe("reviews tab — 400 error UI is localized (vi + en)", () => {
  const COPY = {
    en: {
      code: "Error 400 — Invalid parameters",
      title: "Invalid link",
      desc: "The review filter or sort parameters in this link are not valid.",
      reset: "Reset to defaults",
    },
    vi: {
      code: "Lỗi 400 — Tham số không hợp lệ",
      title: "Đường liên kết không hợp lệ",
      desc: "Tham số lọc hoặc sắp xếp đánh giá trong đường dẫn không hợp lệ.",
      reset: "Đặt lại về mặc định",
    },
  } as const;

  for (const lang of ["en", "vi"] as const) {
    it(`renders the error UI and reset link in ${lang}`, async () => {
      window.localStorage.setItem("vba.lang", lang);
      const { router, container } = await renderAt("/members/test-id?reviewFilter=bogus");
      await openReviewsTab();

      const c = COPY[lang];
      expect(await screen.findByText(c.code)).toBeTruthy();
      expect(screen.getByText(c.title)).toBeTruthy();
      expect(screen.getByText(c.desc)).toBeTruthy();

      const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
      expect(resetLink.textContent).toContain(c.reset);

      await userEvent.click(resetLink);
      await waitFor(() => {
        expect(router.state.location.search).toMatchObject({
          reviewFilter: "all",
          reviewSort: "recent",
        });
      });
      await waitFor(() => {
        expect(screen.queryByText(c.code)).toBeNull();
      });
    });
  }
});

describe("reviews tab — invalid reviewSort 400 UI is localized (vi + en)", () => {
  const COPY = {
    en: { code: "Error 400 — Invalid parameters", reset: "Reset to defaults" },
    vi: { code: "Lỗi 400 — Tham số không hợp lệ", reset: "Đặt lại về mặc định" },
  } as const;

  for (const lang of ["en", "vi"] as const) {
    it(`renders the error UI and reset link for an invalid reviewSort in ${lang}`, async () => {
      window.localStorage.setItem("vba.lang", lang);
      const { router, container } = await renderAt("/members/test-id?reviewSort=nope");
      await openReviewsTab();

      const c = COPY[lang];
      // The invalid reviewSort triggers the localized 400-style UI...
      expect(await screen.findByText(c.code)).toBeTruthy();
      // ...with the language-independent Zod message scoped to reviewSort only.
      expect(screen.getByText(/reviewSort must be one of/i)).toBeTruthy();
      expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();

      const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
      expect(resetLink.textContent).toContain(c.reset);

      await userEvent.click(resetLink);
      await waitFor(() => {
        expect(router.state.location.search).toMatchObject({
          reviewFilter: "all",
          reviewSort: "recent",
        });
      });
      await waitFor(() => {
        expect(screen.queryByText(c.code)).toBeNull();
      });
    });
  }
});

describe("reviews tab — both params invalid, localized 400 UI (vi + en)", () => {
  const COPY = {
    en: { code: "Error 400 — Invalid parameters", reset: "Reset to defaults" },
    vi: { code: "Lỗi 400 — Tham số không hợp lệ", reset: "Đặt lại về mặc định" },
  } as const;

  for (const lang of ["en", "vi"] as const) {
    it(`renders the error UI listing both fields and reset link in ${lang}`, async () => {
      window.localStorage.setItem("vba.lang", lang);
      const { router, container } = await renderAt("/members/test-id?reviewFilter=x&reviewSort=y");
      await openReviewsTab();

      const c = COPY[lang];
      // Localized 400-style header...
      expect(await screen.findByText(c.code)).toBeTruthy();
      // ...with both language-independent Zod messages listed.
      expect(screen.getByText(/reviewFilter must be one of/i)).toBeTruthy();
      expect(screen.getByText(/reviewSort must be one of/i)).toBeTruthy();

      const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
      expect(resetLink.textContent).toContain(c.reset);

      await userEvent.click(resetLink);
      await waitFor(() => {
        expect(router.state.location.search).toMatchObject({
          reviewFilter: "all",
          reviewSort: "recent",
        });
      });
      await waitFor(() => {
        expect(screen.queryByText(c.code)).toBeNull();
      });
      expect(screen.queryByText(/reviewFilter must be one of/i)).toBeNull();
      expect(screen.queryByText(/reviewSort must be one of/i)).toBeNull();
    });
  }
});

describe("reviews tab — one valid + one invalid param, localized 400 UI (vi + en)", () => {
  const COPY = {
    en: { code: "Error 400 — Invalid parameters", reset: "Reset to defaults" },
    vi: { code: "Lỗi 400 — Tham số không hợp lệ", reset: "Đặt lại về mặc định" },
  } as const;

  // [path, invalidField, presentValidField]
  const CASES = [
    ["/members/test-id?reviewFilter=service&reviewSort=nope", "reviewSort", "reviewFilter"],
    ["/members/test-id?reviewFilter=bogus&reviewSort=highest", "reviewFilter", "reviewSort"],
  ] as const;

  for (const lang of ["en", "vi"] as const) {
    for (const [path, invalidField, validField] of CASES) {
      it(`flags only ${invalidField} (with valid ${validField}) in ${lang}`, async () => {
        window.localStorage.setItem("vba.lang", lang);
        const { router, container } = await renderAt(path);
        await openReviewsTab();

        const c = COPY[lang];
        // Localized 400-style header shows because one present param is invalid.
        expect(await screen.findByText(c.code)).toBeTruthy();
        // Only the invalid field is reported; the valid one is not.
        expect(screen.getByText(new RegExp(`${invalidField} must be one of`, "i"))).toBeTruthy();
        expect(screen.queryByText(new RegExp(`${validField} must be one of`, "i"))).toBeNull();

        const resetLink = container.querySelector("a.bg-primary") as HTMLAnchorElement;
        expect(resetLink.textContent).toContain(c.reset);

        await userEvent.click(resetLink);
        await waitFor(() => {
          expect(router.state.location.search).toMatchObject({
            reviewFilter: "all",
            reviewSort: "recent",
          });
        });
        await waitFor(() => {
          expect(screen.queryByText(c.code)).toBeNull();
        });
      });
    }
  }
});

describe("reviews tab — both params valid, page loads (vi + en)", () => {
  const COPY = {
    en: { code: "Error 400 — Invalid parameters", empty: "No reviews yet." },
    vi: { code: "Lỗi 400 — Tham số không hợp lệ", empty: "Chưa có đánh giá." },
  } as const;

  for (const lang of ["en", "vi"] as const) {
    it(`loads the reviews page with no error for valid params in ${lang}`, async () => {
      window.localStorage.setItem("vba.lang", lang);
      const { router } = await renderAt("/members/test-id?reviewFilter=event&reviewSort=highest");
      await openReviewsTab();

      const c = COPY[lang];
      // Normal (localized) reviews state renders — empty list for the mock data.
      expect(await screen.findByText(c.empty)).toBeTruthy();

      // No 400-style error UI or Zod messages.
      expect(screen.queryByText(c.code)).toBeNull();
      expect(screen.queryByText(/must be one of/i)).toBeNull();

      // The valid params are preserved on the URL.
      expect(router.state.location.search).toMatchObject({
        reviewFilter: "event",
        reviewSort: "highest",
      });
    });
  }
});

describe("reviews tab — empty results render for all valid param combos (vi + en)", () => {
  const COPY = {
    en: { code: "Error 400 — Invalid parameters", empty: "No reviews yet." },
    vi: { code: "Lỗi 400 — Tham số không hợp lệ", empty: "Chưa có đánh giá." },
  } as const;

  // A spread of valid filter/sort combinations beyond the default pair.
  const COMBOS = [
    { reviewFilter: "all", reviewSort: "recent" },
    { reviewFilter: "service", reviewSort: "lowest" },
    { reviewFilter: "networking", reviewSort: "highest" },
    { reviewFilter: "event", reviewSort: "recent" },
  ] as const;

  for (const lang of ["en", "vi"] as const) {
    for (const { reviewFilter, reviewSort } of COMBOS) {
      it(`shows the empty state for ${reviewFilter}/${reviewSort} in ${lang}`, async () => {
        window.localStorage.setItem("vba.lang", lang);
        const { router } = await renderAt(
          `/members/test-id?reviewFilter=${reviewFilter}&reviewSort=${reviewSort}`,
        );
        await openReviewsTab();

        const c = COPY[lang];
        // Localized empty-results state renders for the mocked empty data.
        expect(await screen.findByText(c.empty)).toBeTruthy();

        // No 400-style error UI or Zod messages.
        expect(screen.queryByText(c.code)).toBeNull();
        expect(screen.queryByText(/must be one of/i)).toBeNull();

        // The valid params are preserved on the URL.
        expect(router.state.location.search).toMatchObject({ reviewFilter, reviewSort });
      });
    }
  }
});
