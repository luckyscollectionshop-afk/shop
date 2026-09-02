"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  availableForSale: boolean;
  cartCount: number;
};

export default function AddToCartButton({
  productId,
  stock,
  availableForSale,
  cartCount,
}: AddToCartButtonProps) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  /*
   * Product is available for immediate sale when:
   * - available_for_sale = true
   * - stock > 0
   *
   * Product is available for PRE-BOOKING when:
   * - available_for_sale = false
   * - stock = 0
   */
  const isPreBooking =
    !availableForSale && stock <= 0;

  const canOrder =
    (availableForSale && stock > 0) ||
    isPreBooking;

  function changeQuantity(newQuantity: number) {
    if (newQuantity < 1) return;

    /*
     * For normal products, quantity cannot exceed stock.
     *
     * For pre-booking products, stock is 0 but ordering
     * is still allowed, so there is no stock limit here.
     */
    if (!isPreBooking && newQuantity > stock) {
      return;
    }

    setQuantity(newQuantity);
  }

  async function addToCart() {
    if (adding || quantity < 1 || !canOrder) {
      return;
    }

    /*
     * Safety check for normal products.
     *
     * Pre-booking products intentionally have stock = 0.
     */
    if (!isPreBooking && quantity > stock) {
      alert("Not enough stock available.");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push(
          `/auth/login?redirectTo=/products/${productId}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add product to cart.",
        );
      }

      /*
       * Update the cart count immediately in the header.
       */
      window.dispatchEvent(
        new CustomEvent("cart-count-change", {
          detail: {
            count: cartCount + quantity,
          },
        }),
      );

      alert(
        isPreBooking
          ? quantity === 1
            ? "Pre-booking added to cart!"
            : `${quantity} pre-booking items added to cart!`
          : quantity === 1
            ? "Added to cart!"
            : `${quantity} items added to cart!`,
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to add product to cart.",
      );
    } finally {
      setAdding(false);
    }
  }

  /*
   * Completely unavailable:
   *
   * available_for_sale = true
   * AND
   * stock = 0
   */
  if (!canOrder) {
    return (
      <Button
        disabled
        className="mt-6 w-full sm:w-auto"
      >
        Out of stock
      </Button>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-md border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={adding || quantity <= 1}
          onClick={() =>
            changeQuantity(quantity - 1)
          }
          aria-label="Decrease quantity"
        >
          −
        </Button>

        <span className="min-w-10 text-center text-sm font-medium">
          {quantity}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={
            adding ||
            (!isPreBooking && quantity >= stock)
          }
          onClick={() =>
            changeQuantity(quantity + 1)
          }
          aria-label="Increase quantity"
        >
          +
        </Button>
      </div>

      <Button
        type="button"
        onClick={addToCart}
        disabled={adding}
      >
        {adding
          ? "Adding..."
          : isPreBooking
            ? "Pre-book now"
            : "Add to cart"}
      </Button>
    </div>
  );
}