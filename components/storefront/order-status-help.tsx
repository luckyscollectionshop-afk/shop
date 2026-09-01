"use client";

import { useState } from "react";

const statuses = [
  {
    status: "Payment pending",
    meaning:
      "We are waiting for your payment or checking your payment.",
  },
  {
    status: "Paid",
    meaning:
      "Your payment has been received and verified.",
  },
  {
    status: "Processing",
    meaning:
      "Your payment is confirmed and we are preparing your order.",
  },
  {
    status: "Shipped",
    meaning:
      "Your order has been handed over to the delivery service.",
  },
  {
    status: "Delivered",
    meaning:
      "Your order has been delivered.",
  },
  {
    status: "Cancelled",
    meaning:
      "The order has been cancelled and will not be fulfilled.",
  },
];

export default function OrderStatusHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        What do these statuses mean?
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-status-help-title"
            className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="order-status-help-title"
                  className="text-xl font-semibold"
                >
                  Understanding your order status
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Your payment status tells you about your
                  payment. Your order status tells you where
                  your order is in the fulfilment process.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg px-2 py-1 text-lg hover:bg-muted"
              >
                ×
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border">
              <div className="grid grid-cols-[140px_1fr] border-b bg-muted/50 px-4 py-3 text-sm font-semibold">
                <span>Status</span>
                <span>What it means</span>
              </div>

              {statuses.map((item) => (
                <div
                  key={item.status}
                  className="grid grid-cols-[140px_1fr] gap-4 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="font-medium">
                    {item.status}
                  </span>

                  <span className="text-muted-foreground">
                    {item.meaning}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}