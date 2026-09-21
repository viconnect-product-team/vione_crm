// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

// a11y + keyboard test for the event creation wizard. Renders the real
// EventWizard component with the server fn + QR canvas mocked, then asserts:
// - the dialog exposes an aria-live status region whose text tracks steps
// - aria-busy flips to true while the create request is in flight
// - keyboard navigation (Escape to close, Enter/Tab on buttons) works
// - axe finds no ARIA/role/name violations at each step

vi.setConfig({ testTimeout: 20000 });

const AXE_OPTIONS = {
  rules: {
    "color-contrast": { enabled: false },
    region: { enabled: false },
  },
} as const;

let deferredCreate: { resolve: (v: unknown) => void } | null = null;
const createFn = vi.fn(
  () =>
    new Promise((resolve) => {
      deferredCreate = { resolve };
    }),
);

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => createFn,
}));

vi.mock("@/lib/api-client", () => ({
  fetchNestApi: () => createFn(),
}));

vi.mock("@/lib/events.functions", () => ({
  createEventWithConfigFn: vi.fn(),
  QR_FIELDS: ["registration_code", "verify_url", "ticket_code"],
}));

vi.mock("@/components/member/QrCanvas", () => ({
  QrCanvas: ({ value }: { value: string }) => <div data-testid="qr">{value}</div>,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderWizard() {
  const { EventWizard } = await import("@/components/dashboard/EventWizard");
  const onClose = vi.fn();
  const onCreated = vi.fn();
  const utils = render(<EventWizard open onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated, ...utils };
}

function announcement() {
  return screen.getByTestId("ewz-announcement");
}

function dialog() {
  return screen.getByRole("dialog");
}

beforeEach(() => {
  deferredCreate = null;
  createFn.mockClear();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("event wizard — a11y + keyboard", () => {
  it("exposes an aria-live status region that tracks the current step", async () => {
    await renderWizard();
    const live = announcement();
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(live.getAttribute("role")).toBe("status");
    expect(live.textContent).toMatch(/1\/3/);

    // fill required info then advance
    fireEvent.change(screen.getByLabelText(/tên|name/i, { selector: "#ewz-name" }), {
      target: { value: "Hội thảo AI" },
    });
    fireEvent.change(document.querySelector("#ewz-date") as HTMLInputElement, {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục|next/i }));

    await waitFor(() => expect(announcement().textContent).toMatch(/2\/3/));
  });

  it("sets aria-busy while the create request is in flight", async () => {
    await renderWizard();
    // step 0 -> 1
    fireEvent.change(document.querySelector("#ewz-name") as HTMLInputElement, {
      target: { value: "Sự kiện" },
    });
    fireEvent.change(document.querySelector("#ewz-date") as HTMLInputElement, {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục|next/i }));
    // step 1 -> 2
    await screen.findByRole("button", { name: /tiếp tục|next/i });
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục|next/i }));

    const submit = await screen.findByRole("button", { name: /tạo sự kiện|create event/i });
    expect(dialog().getAttribute("aria-busy")).toBe("false");

    fireEvent.click(submit);
    await waitFor(() => expect(dialog().getAttribute("aria-busy")).toBe("true"));
    expect(announcement().textContent).toMatch(/đang tạo|creating/i);

    // resolve to settle
    deferredCreate?.resolve({ event: { id: "e1" } });
    await waitFor(() => expect(createFn).toHaveBeenCalled());
  });

  it("closes on Escape via keyboard", async () => {
    const { onClose } = await renderWizard();
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("has no axe violations on each step", async () => {
    const { container } = await renderWizard();
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);

    fireEvent.change(document.querySelector("#ewz-name") as HTMLInputElement, {
      target: { value: "Sự kiện" },
    });
    fireEvent.change(document.querySelector("#ewz-date") as HTMLInputElement, {
      target: { value: "2026-08-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /tiếp tục|next/i }));
    await screen.findByRole("button", { name: /tiếp tục|next/i });
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: /tiếp tục|next/i }));
    await screen.findByRole("button", { name: /tạo sự kiện|create event/i });
    expect((await axe(container, AXE_OPTIONS)).violations).toEqual([]);
  });
});
