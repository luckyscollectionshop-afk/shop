"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  images: string[];
  categoryIds: string[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function ProductBrowser({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || "all",
  );
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.categoryIds.includes(selectedCategory);

      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description ?? "").toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  return (
    <div className="mt-8">
      {/* Search */}
      <div className="max-w-xl">
        <Input
          type="search"
          placeholder="Search products by name or description..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="mt-6 text-sm text-muted-foreground">
        {filteredProducts.length}{" "}
        {filteredProducts.length === 1 ? "product" : "products"}
      </p>

      {/* Products */}
      {filteredProducts.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const image = product.images[0] ?? null;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group overflow-hidden rounded-xl border bg-card"
              >
                {image ? (
                  <Image
                    src={image}
                    alt={product.name}
                    width={600}
                    height={600}
                    unoptimized
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted text-sm text-muted-foreground">
                    No image
                  </div>
                )}

                <div className="p-4">
                  <h2 className="font-medium group-hover:underline">
                    {product.name}
                  </h2>

                  {product.sale_price !== null ? (
                    <div className="mt-2">
                      <span className="font-medium">
                        CHF {product.sale_price.toFixed(2)}
                      </span>

                      <span className="ml-2 text-sm text-muted-foreground line-through">
                        CHF {product.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 font-medium">
                      CHF {product.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">No products found.</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try another search or category.
          </p>
        </div>
      )}
    </div>
  );
}
