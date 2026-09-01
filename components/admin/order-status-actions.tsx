"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatusActionsProps = {
  orderId: string;
  status: string;
  paymentStatus: string;
};

const statusOptions = [
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function OrderStatusActions({
  orderId,
  status,
  paymentStatus,
}: OrderStatusActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleStatusChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const newStatus = event.target.value;

    if (!newStatus || newStatus === status || loading) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update order status.",
        );
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update order status.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (paymentStatus !== "paid" && status !== "cancelled") {
    return (
      <div className="mt-5 rounded-lg bg-muted/50 p-3 text-sm">
        <p className="font-medium">
          Order status
        </p>

        <p className="mt-1 text-muted-foreground">
          Verify the payment before processing this order.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border p-4">
      <label
        htmlFor="order-status"
        className="text-sm font-medium"
      >
        Update order status
      </label>

      <select
        id="order-status"
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {statusOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <p className="mt-2 text-xs text-muted-foreground">
        You can change the status if an order was updated
        by mistake.
      </p>

      {loading && (
        <p className="mt-2 text-xs text-muted-foreground">
          Updating order status...
        </p>
      )}
    </div>
  );
}