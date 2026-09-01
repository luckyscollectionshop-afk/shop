"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";

type SiteHeaderProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  cartCount: number;
};

export default function SiteHeader({
  isLoggedIn,
  isAdmin,
  cartCount,
}: SiteHeaderProps) {
  const [displayCartCount, setDisplayCartCount] =
    useState(cartCount);

  useEffect(() => {
    function handleCartCountChange(event: Event) {
      const customEvent =
        event as CustomEvent<{ count: number }>;

      setDisplayCartCount(customEvent.detail.count);
    }

    window.addEventListener(
      "cart-count-change",
      handleCartCountChange,
    );

    return () => {
      window.removeEventListener(
        "cart-count-change",
        handleCartCountChange,
      );
    };
  }, []);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
        >
          Lucky&apos;s Collection
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
            })}
          >
            Home
          </Link>

          <Link
            href="/products"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
            })}
          >
            Products
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/cart"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                🛒 Cart
                {displayCartCount > 0
                  ? ` (${displayCartCount})`
                  : ""}
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  Admin
                </Link>
              )}

              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })}
              >
                Sign in
              </Link>

              <Link
                href="/auth/signup"
                className={buttonVariants({
                  size: "sm",
                })}
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}