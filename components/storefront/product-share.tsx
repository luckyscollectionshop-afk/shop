"use client";

import { useState } from "react";
import {
  Share2,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  X,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ProductShareProps = {
  productName: string;
};

export default function ProductShare({
  productName,
}: ProductShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function getProductUrl() {
    return window.location.href;
  }

  async function copyLink() {
    const url = getProductUrl();

    try {
      await navigator.clipboard.writeText(url);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Could not copy the link.");
    }
  }

  async function nativeShare() {
    const url = getProductUrl();

    if (!navigator.share) {
      alert(
        "Your browser does not support the native share menu. Please choose one of the sharing options below.",
      );
      return;
    }

    try {
      await navigator.share({
        title: productName,
        text: `Check out ${productName} at Lucky's Collection 🛍️\n\n`,
        url,
      });

      setOpen(false);
    } catch (error) {
      // User cancelled the native share menu.
      // We do not need to show an error in that case.
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Native share failed:", error);
      }
    }
  }

  async function shareWhatsApp() {
    const url = getProductUrl();

    const text = `Check out ${productName} at Lucky's Collection: ${url}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareFacebook() {
    const url = getProductUrl();

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function shareInstagram() {
    await copyLink();

    alert(
      "The product link has been copied. You can now paste it into Instagram.",
    );
  }

  async function shareYouTube() {
    await copyLink();

    alert(
      "The product link has been copied. You can now paste it into your YouTube post or description.",
    );
  }

  async function shareEmail() {
    const url = getProductUrl();

    const subject = `Check out ${productName}`;

    const body = `I thought you might like this product from Lucky's Collection:\n\n${url}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      {/* Main Share button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="mt-4"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>

      {/* Share dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Heading */}
            <div className="pr-8">
              <h2 className="text-xl font-semibold">
                Share this product
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Share {productName} with your friends.
              </p>
            </div>

            {/* Native share */}
            <Button
              type="button"
              onClick={nativeShare}
              className="mt-6 h-12 w-full justify-start"
            >
              <MoreHorizontal className="mr-3 h-5 w-5" />
              More sharing options
            </Button>

            <p className="mt-2 text-xs text-muted-foreground">
              On supported phones and browsers, this opens your devices
              sharing menu with apps such as Instagram, WhatsApp and Messages.
            </p>

            {/* Individual sharing options */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {/* WhatsApp */}
              <Button
                type="button"
                variant="outline"
                onClick={shareWhatsApp}
                className="h-12 justify-start"
              >
                <MessageCircle className="mr-3 h-5 w-5" />
                WhatsApp
              </Button>

              {/* Facebook */}
              <Button
                type="button"
                variant="outline"
                onClick={shareFacebook}
                className="h-12 justify-start"
              >
                <span className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  f
                </span>
                Facebook
              </Button>

              {/* Instagram */}
              <Button
                type="button"
                variant="outline"
                onClick={shareInstagram}
                className="h-12 justify-start"
              >
                <span className="mr-3 flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold">
                  ◎
                </span>
                Instagram
              </Button>

              {/* YouTube */}
              <Button
                type="button"
                variant="outline"
                onClick={shareYouTube}
                className="h-12 justify-start"
              >
                <span className="mr-3 flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white">
                  ▶
                </span>
                YouTube
              </Button>

              {/* Email */}
              <Button
                type="button"
                variant="outline"
                onClick={shareEmail}
                className="h-12 justify-start"
              >
                <Mail className="mr-3 h-5 w-5" />
                Email
              </Button>

              {/* Copy link */}
              <Button
                type="button"
                variant="outline"
                onClick={copyLink}
                className="h-12 justify-start"
              >
                <LinkIcon className="mr-3 h-5 w-5" />
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}