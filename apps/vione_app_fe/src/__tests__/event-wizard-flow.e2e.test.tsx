// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";

// End-to-end test for the multi-step event creation wizard. Renders the real
// EventWizard, walks through step 1 (info) -> step 2 (ticket types) ->
// step 3 (QR), and asserts:
// - required info validation blocks advancing
// - ticket types can be added/edited and are submitted
// - the QR preview reflects the selected QR fields + ticket name
// - the create server fn receives the fully-assembled payload
// - onCreated fires with the returned event

vi.setConfig({ testTimeout: 20000 });

const createFn = vi.fn(async (_args: { data: any }) => ({
  event: { id: "evt-1", name: "Diễn đàn 2026" },
}));

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => createFn,
}));

vi.mock("@/lib/api-client", () => ({
  fetchNestApi: (url: string, opts?: any) => createFn({ data: opts?.body ? JSON.parse(opts.body) : {} }),
}));

vi.mock("@/lib/events.functions", () => ({
  createEventWithConfigFn: vi.fn(),
  QR_FIELDS: ["registration_code", "verify_url", "ticket_code"],
}));

// Render the QR payload as text so we can assert its content deterministically.
vi.mock("@/components/member/QrCanvas", () => ({
  QrCanvas: ({ value }: { value: string }) => <div data-testid="qr">{value}</div>,
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
  },
}));

async function renderWizard() {
  const { EventWizard } = await import("@/components/dashboard/EventWizard");
  const onClose = vi.fn();
  const onCreated = vi.fn();
  const utils = render(<EventWizard open onClose={onClose} onCreated={onCreated} />);
  return { onClose, onCreated, ...utils };
}

const nextBtn = () => screen.getByRole("button", { name: /tiếp tục|next/i });
const set = (sel: string, value: string) =>
  fireEvent.change(document.querySelector(sel) as HTMLInputElement, { target: { value } });

beforeEach(() => {
  createFn.mockClear();
  toastError.mockClear();
  toastSuccess.mockClear();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("event creation wizard — multi-step flow (end to end)", () => {
  it("blocks advancing past step 1 until required info is filled", async () => {
    await renderWizard();
    // no name/date yet -> validation error, stays on step 1
    fireEvent.click(nextBtn());
    expect(toastError).toHaveBeenCalled();
    // ticket step heading should NOT be present yet
    expect(document.querySelector("#ewz-name")).toBeTruthy();
  });

  it("saves info, creates a ticket type, shows correct QR, and submits full payload", async () => {
    const { onCreated } = await renderWizard();

    // --- Step 1: info ---
    set("#ewz-name", "Diễn đàn 2026");
    set("#ewz-date", "2026-09-15");
    set("#ewz-location", "Hà Nội");
    set("#ewz-capacity", "300");
    fireEvent.click(nextBtn());

    // --- Step 2: ticket types ---
    const addBtn = await screen.findByRole("button", { name: /thêm|add/i });
    fireEvent.click(addBtn);
    const ticketName = await screen.findByLabelText(/tên vé|ticket name/i, { selector: "input" });
    fireEvent.change(ticketName, { target: { value: "VIP" } });
    // price + quantity are the number inputs inside the ticket card
    const numberInputs = Array.from(
      document.querySelectorAll('input[type="number"]'),
    ) as HTMLInputElement[];
    // last two number inputs belong to the ticket card (price, qty)
    fireEvent.change(numberInputs[numberInputs.length - 2], { target: { value: "500000" } });
    fireEvent.change(numberInputs[numberInputs.length - 1], { target: { value: "50" } });
    fireEvent.click(nextBtn());

    // --- Step 3: QR ---
    // enable the ticket_code field so QR sample includes the ticket name
    const qr = await screen.findByTestId("qr");
    // registration_code is on by default -> REG-XXXXXX present
    expect(qr.textContent).toContain("REG-XXXXXX");

    // toggle verify_url + ticket_code checkboxes
    const checkboxes = Array.from(
      document.querySelectorAll('input[type="checkbox"]'),
    ) as HTMLInputElement[];
    // QR_FIELDS order: registration_code, verify_url, ticket_code
    fireEvent.click(checkboxes[2]); // ticket_code
    await waitFor(() => expect(screen.getByTestId("qr").textContent).toContain("VIP"));

    // --- Submit ---
    const createBtn = screen.getByRole("button", { name: /tạo sự kiện|create event/i });
    fireEvent.click(createBtn);

    await waitFor(() => expect(createFn).toHaveBeenCalledTimes(1));
    const payload = createFn.mock.calls[0]![0]!.data;
    expect(payload).toMatchObject({
      name: "Diễn đàn 2026",
      date: "2026-09-15",
      location: "Hà Nội",
      capacity: 300,
    });
    expect(payload.qrFields).toEqual(expect.arrayContaining(["registration_code", "ticket_code"]));
    expect(payload.tickets).toHaveLength(1);
    expect(payload.tickets[0]).toMatchObject({ name: "VIP", price: 500000, quantity: 50 });

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({ id: "evt-1", name: "Diễn đàn 2026" }),
    );
  });

  it("rejects a ticket type without a name", async () => {
    await renderWizard();
    set("#ewz-name", "Sự kiện");
    set("#ewz-date", "2026-09-15");
    fireEvent.click(nextBtn());

    const addBtn = await screen.findByRole("button", { name: /thêm|add/i });
    fireEvent.click(addBtn);
    // leave ticket name empty, try to advance
    fireEvent.click(nextBtn());
    expect(toastError).toHaveBeenCalled();
    // still on ticket step (add button present)
    expect(screen.getByRole("button", { name: /thêm|add/i })).toBeTruthy();
  });
});
