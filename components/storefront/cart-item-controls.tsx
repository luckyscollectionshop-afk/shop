"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CartItemControls({
  cartItemId,
  quantity,
  stock,
  cartCount,
}: {
  cartItemId: string;
  quantity: number;
  stock: number;
  cartCount: number;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [currentQuantity, setCurrentQuantity] =
    useState(quantity);

  async function updateQuantity(newQuantity: number) {
    if (newQuantity < 1 || newQuantity > stock) return;
    if (loading) return;

    const oldQuantity = currentQuantity;
    const difference = newQuantity - oldQuantity;

    // Update the UI immediately
    setCurrentQuantity(newQuantity);

    window.dispatchEvent(
      new CustomEvent("cart-count-change", {
        detail: {
          count: Math.max(0, cartCount + difference),
        },
      }),
    );

    setLoading(true);

    try {
      const response = await fetch("/api/cart/items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart_item_id: cartItemId,
          quantity: newQuantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update cart.",
        );
      }

      // Refresh server data after the database update
      router.refresh();
    } catch (error) {
      // Roll back optimistic UI if API failed
      setCurrentQuantity(oldQuantity);

      window.dispatchEvent(
        new CustomEvent("cart-count-change", {
          detail: {
            count: cartCount,
          },
        }),
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update cart.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeItem() {
    if (loading) return;

    // Update header immediately
    window.dispatchEvent(
      new CustomEvent("cart-count-change", {
        detail: {
          count: Math.max(
            0,
            cartCount - currentQuantity,
          ),
        },
      }),
    );

    setLoading(true);

    try {
      const response = await fetch("/api/cart/items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart_item_id: cartItemId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to remove item.",
        );
      }

      router.refresh();
    } catch (error) {
      // Restore header count if removal failed
      window.dispatchEvent(
        new CustomEvent("cart-count-change", {
          detail: {
            count: cartCount,
          },
        }),
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to remove item.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <div className="flex items-center rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={
            loading || currentQuantity <= 1
          }
          onClick={() =>
            updateQuantity(currentQuantity - 1)
          }
          aria-label="Decrease quantity"
        >
          −
        </Button>

        <span className="min-w-10 text-center text-sm">
          {currentQuantity}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={
            loading || currentQuantity >= stock
          }
          onClick={() =>
            updateQuantity(currentQuantity + 1)
          }
          aria-label="Increase quantity"
        >
          +
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={removeItem}
        className="text-destructive hover:text-destructive"
      >
        Remove
      </Button>
    </div>
  );
}