// @vitest-environment jsdom
//
// BC-Mobile-5D — Public Digital Card Experience (/c/<token>).
//
// Contract coverage:
//  - Safe href builders: dangerous schemes/malformed input → NO action.
//  - Recipient card: name is the page h1; invalid field values render no
//    link; PRIVATE fields (null on the projection) render nothing.
//  - Opaque token hygiene: the 64-hex token never appears in the DOM.
//  - Share Contact back: teaser → progressive form, consent never
//    pre-checked, success copy never claims a "connection".
//  - Neutral unavailable state stays byte-identical across failure modes.
//  - axe: the public recipient view has no a11y violations.

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

afterEach(cleanup);
import { LangContext } from "@/lib/i18n";
import { expectNoAxeViolations } from "./helpers/business-connect-test-harness";
import {
  safeMailtoHref,
  safeTelHref,
  safeWebHref,
  webDisplay,
} from "@/lib/business-connect/mobile/public-actions";
import { DigitalBusinessCard } from "@/components/business-connect/mobile/me/DigitalBusinessCard";
import { RecipientCardView } from "@/components/business-connect/mobile/me/RecipientCardView";
import type { PublicIdentityCard } from "@/lib/business-connect/mobile/identity.types";

const TOKEN = "a".repeat(64);

function renderWithLang(ui: React.ReactElement) {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>{ui}</LangContext.Provider>,
  );
}

function makeCard(over: Partial<PublicIdentityCard> = {}): PublicIdentityCard {
  return {
    displayName: "Trần Minh Anh",
    headline: "Building thoughtful products",
    jobTitle: "Director",
    companyName: "Acme Corp",
    bio: null,
    avatarUrl: null,
    primaryEmail: "anh@acme.example",
    primaryPhone: "+84 90 123 4567",
    website: "https://acme.example",
    linkedinUrl: "https://linkedin.com/in/anh",
    address: null,
    city: "Đà Nẵng",
    ...over,
  };
}

describe("safe href builders", () => {
  it("builds tel: only from plausible numbers", () => {
    expect(safeTelHref("+84 90 123 4567")).toBe("tel:+84901234567");
    expect(safeTelHref("call me maybe")).toBeNull();
    expect(safeTelHref("12345")).toBeNull();
    expect(safeTelHref(null)).toBeNull();
  });

  it("builds mailto: only from valid single-recipient emails", () => {
    expect(safeMailtoHref("anh@acme.example")).toBe("mailto:anh@acme.example");
    expect(safeMailtoHref("a@b.co\nBcc:x@y.z")).toBeNull();
    expect(safeMailtoHref("not-an-email")).toBeNull();
    expect(safeMailtoHref("")).toBeNull();
  });

  it("builds web hrefs only for absolute http(s) URLs", () => {
    expect(safeWebHref("https://acme.example/team")).toBe("https://acme.example/team");
    expect(safeWebHref("javascript:alert(1)")).toBeNull();
    expect(safeWebHref("data:text/html,<script>1</script>")).toBeNull();
    expect(safeWebHref("//evil.example")).toBeNull();
    expect(safeWebHref("ftp://files.example")).toBeNull();
    expect(safeWebHref(null)).toBeNull();
  });

  it("webDisplay strips the scheme for compact rendering", () => {
    expect(webDisplay("https://acme.example/team")).toBe("acme.example/team");
  });
});

describe("recipient digital card", () => {
  it("renders the display name as the page h1 on the recipient surface", () => {
    renderWithLang(
      <DigitalBusinessCard
        card={makeCard()}
        publicUrl={`https://app.example/c/${TOKEN}`}
        nameAs="h1"
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Trần Minh Anh" })).toBeTruthy();
  });

  it("renders NO action for invalid field values (javascript: can never become an href)", () => {
    const { container } = renderWithLang(
      <DigitalBusinessCard
        card={makeCard({
          website: "javascript:alert(1)",
          linkedinUrl: "data:evil",
          primaryPhone: "x",
        })}
        publicUrl={null}
      />,
    );
    for (const a of Array.from(container.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      expect(href.startsWith("javascript:")).toBe(false);
      expect(href.startsWith("data:")).toBe(false);
    }
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("renders nothing for PRIVATE (null) contact fields", () => {
    const { container } = renderWithLang(
      <DigitalBusinessCard
        card={makeCard({ primaryEmail: null, primaryPhone: null, address: null })}
        publicUrl={null}
      />,
    );
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  });

  it("exposes one primary Save Contact action", () => {
    renderWithLang(<DigitalBusinessCard card={makeCard()} publicUrl={null} />);
    const primary = screen.getByRole("button", { name: /save contact/i });
    expect(primary).toBeTruthy();
    expect((primary as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("recipient page chrome", () => {
  it("never renders the opaque share token anywhere in the DOM", () => {
    renderWithLang(
      <RecipientCardView
        result={{ state: "public", card: makeCard() }}
        publicUrl={`https://app.example/c/${TOKEN}`}
        token={TOKEN}
      />,
    );
    expect(document.body.innerHTML).not.toContain(TOKEN);
  });

  it("shows the Share Contact teaser and opens the consent-first form on demand", () => {
    renderWithLang(
      <RecipientCardView
        result={{ state: "public", card: makeCard() }}
        publicUrl={`https://app.example/c/${TOKEN}`}
        token={TOKEN}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /share your contact/i }));
    const consent = screen.getByRole("checkbox") as HTMLInputElement;
    expect(consent.checked).toBe(false); // explicit consent, never pre-checked
    expect(document.body.textContent).not.toContain("connection");
  });

  it("keeps one neutral unavailable state for every failure mode", () => {
    const a = renderWithLang(
      <RecipientCardView result={null} publicUrl="https://app.example/c/x" token={TOKEN} />,
    );
    const textA = document.body.textContent;
    a.unmount();
    renderWithLang(
      <RecipientCardView
        result={{ state: "unavailable" }}
        publicUrl="https://app.example/c/x"
        token={TOKEN}
      />,
    );
    expect(document.body.textContent).toBe(textA);
  });

  it("has no axe violations on the public recipient view", async () => {
    const { container } = renderWithLang(
      <RecipientCardView
        result={{ state: "public", card: makeCard() }}
        publicUrl={`https://app.example/c/${TOKEN}`}
        token={TOKEN}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
