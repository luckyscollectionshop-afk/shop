"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AddToCartButton({
  productId,
  stock,
  cartCount,
}: {
  productId: string;
  stock: number;
  cartCount: number;
}) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  function changeQuantity(newQuantity: number) {
    if (newQuantity < 1 || newQuantity > stock) return;

    setQuantity(newQuantity);
  }

  async function addToCart() {
    if (adding || quantity < 1 || quantity > stock) return;

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
          data.error || "Failed to add product to cart.",
        );
      }

      // Update the cart count immediately in the header
      window.dispatchEvent(
        new CustomEvent("cart-count-change", {
          detail: {
            count: cartCount + quantity,
          },
        }),
      );

      alert(
        quantity === 1
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

  if (stock <= 0) {
    return (
      <Button disabled className="mt-6 w-full sm:w-auto">
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
          onClick={() => changeQuantity(quantity - 1)}
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
          disabled={adding || quantity >= stock}
          onClick={() => changeQuantity(quantity + 1)}
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
        {adding ? "Adding..." : "Add to cart"}
      </Button>
    </div>
  );
}