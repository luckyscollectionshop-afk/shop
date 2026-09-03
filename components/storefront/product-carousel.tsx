"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type DisplaySettings = {
  price?: boolean;
};

export type CarouselProduct = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  images: string[] | null;
  display_settings: DisplaySettings | null;
  active: boolean;
   sticker?: string | null;
};


function ProductCard({ product }: { product: CarouselProduct }) {
  const showPrice = product.display_settings?.price !== false;
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block w-[220px] shrink-0 sm:w-[250px] lg:w-[270px]"
    >
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm transition-transform duration-300 group-hover:scale-[1.04] group-hover:shadow-lg">
        <div className="relative">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              width={640}
              height={640}
              unoptimized
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
              No image
            </div>
          )}

          {/* Custom sticker */}
          {product.sticker && (
            <div className="absolute left-3 top-3">
              <span
                className="
                  inline-flex items-center rounded-full
                  bg-red-600 px-3 py-1.5
                  text-xs font-bold tracking-wide text-white
                  shadow-[3px_3px_0px_white,-3px_-3px_0px_red]
                  transition-transform duration-300
                  group-hover:scale-105
                  animate-sticker-shadow
                "
              >
                ✦ {product.sticker}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h4 className="font-medium">{product.name}</h4>

          {showPrice && (
            <div className="mt-1 text-sm">
              {product.sale_price != null ? (
                <>
                  <span>
                    CHF {Number(product.sale_price).toFixed(2)}
                  </span>

                  <span className="ml-2 text-muted-foreground line-through">
                    CHF {Number(product.price).toFixed(2)}
                  </span>
                </>
              ) : (
                `CHF ${Number(product.price).toFixed(2)}`
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}


export function ProductCarousel({
  products,
}: {
  products: CarouselProduct[];
}) {
  const [paused, setPaused] = useState(false);

  if (!products.length) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No products in this category yet.
      </p>
    );
  }

  /*
   * Duplicate the products so the second copy follows the first.
   * This creates the continuous scrolling effect.
   */
  const items = [...products, ...products];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex w-max gap-5"
        style={{
          animation: `product-scroll ${Math.max(
            products.length * 5,
            25,
          )}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {items.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes product-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(calc(-50% - 10px));
          }
        }
      `}</style>
    </div>
  );
}