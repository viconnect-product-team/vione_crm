// @CODE-MEMORY
// UseCase: UC-BC-01
// TechSpecRef: UIUX_SPEC §3
// Author: Senior BA/SA Team
// Updated: 2026-08-28

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { buildQuickContactChannels } from "@/lib/business-connect/mobile/quick-contact";
import type { BusinessIdentity } from "@/lib/business-connect/mobile/identity.types";

import icon26 from "./icon-26.svg";
import icon27 from "./icon-27.svg";
import icon28 from "./icon-28.svg";
import icon29 from "./icon-29.svg";
import icon31 from "./icon-31.svg";

interface ContactSpec {
  key: string;
  label: string;
  icon: string;
  iconClassName: string;
  iconContainerClassName: string;
  gridClassName: string;
}

const contactMethodsSpec: ContactSpec[] = [
  {
    key: "call",
    label: "Gọi điện",
    icon: icon26,
    iconClassName: "relative w-[13.5px] h-[13.5px]",
    iconContainerClassName:
      "flex w-8 h-8 shrink-0 items-center justify-center relative bg-[#D8B282]/10 rounded-lg border border-[#D8B282]/20",
    gridClassName: "w-full",
  },
  {
    key: "email",
    label: "Email",
    icon: icon27,
    iconClassName: "relative w-[15px] h-3",
    iconContainerClassName:
      "flex w-8 h-8 shrink-0 items-center justify-center relative bg-[#D8B282]/10 rounded-lg border border-[#D8B282]/20",
    gridClassName: "w-full",
  },
  {
    key: "viber",
    label: "Viber",
    icon: icon28,
    iconClassName: "relative w-[15px] h-[15px]",
    iconContainerClassName:
      "flex w-8 h-8 shrink-0 items-center justify-center relative bg-[#D8B282]/10 rounded-lg border border-[#D8B282]/20",
    gridClassName: "w-full",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: icon29,
    iconClassName: "relative w-[15px] h-[15px]",
    iconContainerClassName:
      "flex w-8 h-8 shrink-0 items-center justify-center relative bg-[#D8B282]/10 rounded-lg border border-[#D8B282]/20",
    gridClassName: "w-full",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: icon31,
    iconClassName: "relative w-[14.25px] h-3",
    iconContainerClassName:
      "flex w-8 h-8 shrink-0 items-center justify-center relative bg-[#D8B282]/10 rounded-lg border border-[#D8B282]/20",
    gridClassName: "w-full",
  },
];

export function MeQuickContact({ identity }: { identity: BusinessIdentity | null }) {
  const t = useT();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  if (!identity) return null;

  const channels = buildQuickContactChannels(identity);

  return (
    <section
      className="gap-4 flex flex-col items-start p-5 relative self-stretch w-full flex-[0_0_auto] bc-translucent-card rounded-2xl"
      aria-labelledby="quick-contact-heading"
    >
      <div className="flex self-stretch w-full flex-col items-start relative flex-[0_0_auto]">
        <h2
          id="quick-contact-heading"
          className="relative flex items-center self-stretch font-bold text-[var(--bc-mobile-muted)] text-[13.5px] uppercase tracking-wider leading-5"
        >
          {t("bc.mobile.me.contact.title")}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full">
        {contactMethodsSpec.map((method) => {
          const activeChannel = channels.find((c) => c.key === method.key);
          const isPressed = selectedContact === method.key;

          if (activeChannel) {
            return (
              <a
                key={method.key}
                href={activeChannel.href}
                {...(activeChannel.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={method.label}
                aria-pressed={isPressed}
                onClick={() => setSelectedContact(method.key)}
                className={`${method.gridClassName} w-full h-[58px] flex gap-3 p-3 bg-[var(--bc-mobile-surface)]/70 backdrop-blur-md rounded-xl border border-solid border-[rgba(216,178,130,0.20)] items-center relative text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-mobile-accent)] hover:bg-[var(--bc-mobile-surface-2)]/80 hover:border-[var(--bc-mobile-accent)]`}
              >
                <span
                  className="flex w-8 h-8 shrink-0 items-center justify-center relative bg-[rgba(216,178,130,0.12)] rounded-lg border border-[rgba(216,178,130,0.30)] text-[#D8B282] shadow-xs"
                  aria-hidden="true"
                >
                  <span className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                    <img className={method.iconClassName} alt="" src={method.icon} />
                  </span>
                </span>
                <span className="inline-flex flex-col items-start relative flex-[0_0_auto] min-w-0 flex-1">
                  <span className="relative flex items-center w-full font-semibold text-[var(--bc-mobile-text)] text-[14.5px] tracking-tight truncate leading-tight">
                    {method.label}
                  </span>
                </span>
              </a>
            );
          } else {
            return (
              <button
                key={method.key}
                type="button"
                disabled
                aria-label={`${method.label} (chưa thiết lập)`}
                className={`${method.gridClassName} w-full h-[58px] flex gap-3 p-3 bg-[var(--bc-mobile-surface-2)]/30 backdrop-blur-xs rounded-xl border border-solid border-[var(--bc-mobile-border)]/30 items-center relative text-left opacity-40 cursor-not-allowed`}
              >
                <span
                  className="flex w-8 h-8 shrink-0 items-center justify-center relative bg-[var(--bc-mobile-surface-2)] rounded-lg border border-[var(--bc-mobile-border)]"
                  aria-hidden="true"
                >
                  <span className="inline-flex flex-col items-start relative flex-[0_0_auto]">
                    <img
                      className={method.iconClassName}
                      alt=""
                      src={method.icon}
                      style={{ filter: "grayscale(100%) brightness(70%)" }}
                    />
                  </span>
                </span>
                <span className="inline-flex flex-col items-start relative flex-[0_0_auto] min-w-0 flex-1">
                  <span className="relative flex items-center w-full font-normal text-[var(--bc-mobile-muted)] text-[14px] truncate leading-tight">
                    {method.label}
                  </span>
                </span>
              </button>
            );
          }
        })}
      </div>
    </section>
  );
}
