"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OrderPaymentActionsProps = {
  orderId: string;
  paymentStatus: string;
};

export default function OrderPaymentActions({
  orderId,
  paymentStatus,
}: OrderPaymentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updatePaymentStatus(
    newStatus: "pending" | "paid",
  ) {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_status: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update payment status.",
        );
      }

      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update payment status.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {paymentStatus !== "paid" ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => updatePaymentStatus("paid")}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Mark payment as paid"}
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => updatePaymentStatus("pending")}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Mark payment as pending"}
        </button>
      )}
    </div>
  );
}