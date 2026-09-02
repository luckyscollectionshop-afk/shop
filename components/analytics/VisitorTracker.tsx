"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "shop_visitor_id";

function getVisitorId(): string {
  try {
    const existingId = localStorage.getItem(VISITOR_ID_KEY);

    if (existingId) {
      return existingId;
    }

    const newId = crypto.randomUUID();

    localStorage.setItem(VISITOR_ID_KEY, newId);

    return newId;
  } catch {
    return crypto.randomUUID();
  }
}

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function getBrowser(): string {
  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (userAgent.includes("Chrome/")) {
    return "Chrome";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  if (userAgent.includes("Safari/")) {
    return "Safari";
  }

  if (userAgent.includes("Opera/") || userAgent.includes("OPR/")) {
    return "Opera";
  }

  return "Other";
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const visitorId = getVisitorId();

    const productElement = document.querySelector<HTMLElement>(
      "[data-product-id]"
    );

    const productId =
      productElement?.dataset.productId ?? null;

    const trackVisit = async () => {
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            pagePath: pathname,
            productId,
            deviceType: getDeviceType(),
            browser: getBrowser(),
          }),
          keepalive: true,
        });
      } catch (error) {
        console.error("[analytics] Tracking failed:", error);
      }
    };

    trackVisit();
  }, [pathname]);

  return null;
}