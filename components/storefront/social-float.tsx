"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import emailjs from "@emailjs/browser";

type SocialSettings = {
  social_enabled: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  whatsapp_group_url: string | null;
  whatsapp_channel_url: string | null;
};

type SocialFloatProps = {
  settings: SocialSettings;
};

export function SocialFloat({ settings }: SocialFloatProps) {
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);

  if (!settings.social_enabled) {
    return null;
  }

  const links = [
    {
      key: "instagram",
      label: "Instagram",
      url: settings.instagram_url,
      icon: "◎",
    },
    {
      key: "facebook",
      label: "Facebook",
      url: settings.facebook_url,
      icon: "f",
    },
    {
      key: "youtube",
      label: "YouTube",
      url: settings.youtube_url,
      icon: "▶",
    },
    {
      key: "whatsapp-group",
      label: "WhatsApp Group",
      url: settings.whatsapp_group_url,
      icon: "W",
    },
    {
      key: "whatsapp-channel",
      label: "WhatsApp Channel",
      url: settings.whatsapp_channel_url,
      icon: "W",
    },
  ];

  const availableLinks = links.filter((link) => link.url);

  async function sendMessage() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert("Please fill in your name, email and message.");
      return;
    }

    setSending(true);

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
        {
          publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
        },
      );

      alert("Your message has been sent successfully. Thank you! ❤️");

      setName("");
      setEmail("");
      setMessage("");

      setContactOpen(false);
      setOpen(false);
    } catch (error) {
      console.error("EmailJS error:", error);
      alert("Sorry, your message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating social button */}
      <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open social media"
          className="h-12 w-12 rounded-full border shadow-lg"
        >
          <span className="text-lg">✦</span>
        </Button>
      </div>

      {/* Social panel overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  CONNECT WITH US
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Lucky&apos;s Collection
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close social media"
              >
                ✕
              </Button>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Follow us, watch our latest videos, join our WhatsApp community,
              or send us a message.
            </p>

            <div className="mt-8 space-y-3">
              {availableLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                    {link.icon}
                  </span>

                  <span className="font-medium">{link.label}</span>

                  <span className="ml-auto text-muted-foreground">→</span>
                </a>
              ))}

              {/* CONTACT US */}
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition hover:bg-muted"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  ✉
                </span>

                <span className="font-medium">Contact Us</span>

                <span className="ml-auto text-muted-foreground">→</span>
              </button>
            </div>

            <div className="mt-auto pt-8 text-center text-xs text-muted-foreground">
              Follow Lucky&apos;s Collection for new arrivals, offers and
              updates.
            </div>
          </div>
        </div>
      )}

      {/* CONTACT DIALOG */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setContactOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary">
                  GET IN TOUCH
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Contact Us
                </h2>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setContactOpen(false)}
                aria-label="Close contact form"
              >
                ✕
              </Button>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Having trouble with WhatsApp, phone, or anything else? Send us a
              message and we&apos;ll get back to you.
            </p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="contact-name" className="text-sm font-medium">
                  Name
                </label>

                <Input
                  id="contact-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-medium">
                  Email
                </label>

                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="contact-message"
                  className="text-sm font-medium"
                >
                  Message
                </label>

                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setContactOpen(false)}
                  disabled={sending}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}