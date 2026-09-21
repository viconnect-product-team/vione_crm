import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BusinessConnectLanding } from "@/components/landing/BusinessConnectLanding";
import { BusinessConnectLandingV2 } from "@/components/landing/BusinessConnectLandingV2";
import { BusinessConnectLandingV3 } from "@/components/landing/BusinessConnectLandingV3";
import { BusinessConnectLandingV4 } from "@/components/landing/BusinessConnectLandingV4";
import { BusinessConnectLandingV5 } from "@/components/landing/BusinessConnectLandingV5";
import { BusinessConnectLandingV6 } from "@/components/landing/BusinessConnectLandingV6";
import { BusinessConnectLandingV7 } from "@/components/landing/BusinessConnectLandingV7";
import { BusinessConnectLandingV8 } from "@/components/landing/BusinessConnectLandingV8";
import { Ceo1983Landing } from "@/components/landing/Ceo1983Landing";
import { Ceo1983BlueWhiteLanding } from "@/components/landing/Ceo1983BlueWhiteLanding";
import { Ceo1983CinematicLanding } from "@/components/landing/Ceo1983CinematicLanding";
import { ViOneGoldWhiteLanding } from "@/components/landing/ViOneGoldWhiteLanding";
import {
  getActiveLandingTemplateId,
  LANDING_TEMPLATE_CHANGE_EVENT,
} from "@/lib/landing-templates-catalog";

export const Route = createFileRoute("/landing/")({
  head: () => ({
    meta: [
      { title: "ViOne Connect — Hệ Điều Hành Kết Nối Kinh Doanh & CRM Doanh Nghiệp" },
      {
        name: "description",
        content:
          "Hệ sinh thái kết nối kinh doanh 5.0: Ứng dụng ViOne Connect, Nền tảng CRM Doanh nghiệp cô lập và Danh thiếp số Titanium NFC 1-chạm.",
      },
      { property: "og:title", content: "ViOne Connect — Business Connection OS & Enterprise CRM" },
    ],
  }),
  component: ViOneLandingPage,
});

function ViOneLandingPage() {
  const [templateId, setTemplateId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlParam = new URLSearchParams(window.location.search).get("template");
      if (urlParam) {
        // Map shorthand aliases like v1..v8, ceo1983, ceo1983-bluewhite, vione
        if (urlParam === "vione" || urlParam === "vione-gold" || urlParam === "viconnect" || urlParam === "gold") {
          return "vione-gold-white";
        }
        if (urlParam.startsWith("v")) return `b2b-${urlParam}`;
        if (urlParam === "ceo1983") return "ceo1983-official";
        if (urlParam === "ceo1983-bw" || urlParam === "ceo1983-bluewhite") return "ceo1983-bluewhite";
        return urlParam;
      }
    }
    return getActiveLandingTemplateId();
  });

  useEffect(() => {
    const handleTemplateChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setTemplateId(customEvent.detail);
      } else {
        setTemplateId(getActiveLandingTemplateId());
      }
    };

    window.addEventListener(LANDING_TEMPLATE_CHANGE_EVENT, handleTemplateChange);
    window.addEventListener("storage", handleTemplateChange);

    return () => {
      window.removeEventListener(LANDING_TEMPLATE_CHANGE_EVENT, handleTemplateChange);
      window.removeEventListener("storage", handleTemplateChange);
    };
  }, []);

  switch (templateId) {
    case "vione-gold-white":
    case "vione":
    case "gold-white":
    case "viconnect":
      return <ViOneGoldWhiteLanding />;
    case "b2b-v2":
    case "v2":
      return <BusinessConnectLandingV2 />;
    case "b2b-v3":
    case "v3":
      return <BusinessConnectLandingV3 />;
    case "b2b-v4":
    case "v4":
      return <BusinessConnectLandingV4 />;
    case "b2b-v5":
    case "v5":
      return <BusinessConnectLandingV5 />;
    case "b2b-v6":
    case "v6":
      return <BusinessConnectLandingV6 />;
    case "b2b-v7":
    case "v7":
      return <BusinessConnectLandingV7 />;
    case "b2b-v8":
    case "v8":
      return <BusinessConnectLandingV8 />;
    case "ceo1983-official":
    case "ceo1983":
      return <Ceo1983Landing />;
    case "ceo1983-cinematic":
    case "cinematic":
      return <Ceo1983CinematicLanding />;
    case "ceo1983-bluewhite":
    case "ceo1983-bw":
    case "ceo1983-v1":
      return <Ceo1983BlueWhiteLanding />;
    case "b2b-v1":
    case "v1":
      return <BusinessConnectLanding />;
    default:
      return <ViOneGoldWhiteLanding />;
  }
}
