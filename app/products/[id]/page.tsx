import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/storefront/add-to-cart-button";
import SiteHeader from "@/components/storefront/site-header";
import ProductShare from "@/components/storefront/product-share";
import type { Metadata } from "next";

type DisplaySettings = {
  price?: boolean;
  size?: boolean;
  description?: boolean;
  stock?: boolean;
  dimensions?: boolean;
  weight?: boolean;
  videos?: boolean;
};

type Category = { id: string; name: string; slug: string };

const shown = (
  settings: DisplaySettings | null,
  field: keyof DisplaySettings,
) => settings?.[field] !== false;

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "name, description, images, price, sale_price",
    )
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (!product) {
    return {
      title: "Product | Lucky's Collection",
    };
  }

  const images = (product.images ?? []) as string[];

  const image = images[0] ?? null;

  const price =
    product.sale_price != null
      ? Number(product.sale_price)
      : Number(product.price);

  return {
    title: `${product.name} | Lucky's Collection`,
    description:
      product.description ||
      `Discover ${product.name} at Lucky's Collection.`,

    openGraph: {
      title: `${product.name} | Lucky's Collection`,
      description:
        product.description ||
        `Discover ${product.name} at Lucky's Collection.`,
      type: "website",
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Lucky's Collection`,
      description:
        product.description ||
        `Discover ${product.name} at Lucky's Collection.`,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[id]">) {


  const { id } = await params;
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: product },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("products")
      .select(
        "id, name, description, size, price, sale_price, stock, weight_grams, height, width, depth, images, video_urls, display_settings",
      )
      .eq("id", id)
      .eq("active", true)
      .maybeSingle(),
  ]);
  if (!product) notFound();
  const { data: categoryLinks } = await supabase
    .from("product_categories")
    .select("categories(id, name, slug)")
    .eq("product_id", id);
  const categories = (categoryLinks ?? []).flatMap((link) => {
    const category = link.categories as Category | Category[] | null;
    return Array.isArray(category) ? category : category ? [category] : [];
  });
  let isAdmin = false;
  let cartCount = 0;
  if (user) {
    const [{ data: profile }, { data: cart }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("carts").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    isAdmin = profile?.role === "admin";
    if (cart) {
      const { data: cartItems } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);
      cartCount = (cartItems ?? []).reduce(
        (total, item) => total + item.quantity,
        0,
      );
    }
  }
  const images = (product.images ?? []) as string[];
  const videos = (product.video_urls ?? []) as string[];
  const settings = product.display_settings as DisplaySettings | null;
  const dimensions = [
    ["Height", product.height],
    ["Width", product.width],
    ["Depth", product.depth],
  ].filter(([, value]) => value != null);
  const salePrice =
    product.sale_price == null ? null : Number(product.sale_price);
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader isLoggedIn={!!user} isAdmin={isAdmin} cartCount={cartCount} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/products"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Back to products
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {images.length ? (
              images.map((url, index) => (
                <Image
                  key={url}
                  src={url}
                  alt={`${product.name} ${index + 1}`}
                  width={800}
                  height={800}
                  unoptimized
                  className="aspect-square w-full rounded-xl object-cover"
                  priority={index === 0}
                />
              ))
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
                No image available
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            {categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                    className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-secondary/80"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
            {shown(settings, "price") && (
              <p className="mt-3 text-xl font-medium">
                {salePrice !== null ? (
                  <>
                    <span>CHF {salePrice.toFixed(2)}</span>
                    <span className="ml-3 text-base text-muted-foreground line-through">
                      CHF {Number(product.price).toFixed(2)}
                    </span>
                  </>
                ) : (
                  `CHF ${Number(product.price).toFixed(2)}`
                )}
              </p>
            )}
            {shown(settings, "description") && product.description && (
              <p className="mt-6 leading-7 text-muted-foreground">
                {product.description}
              </p>
            )}
            <div className="mt-8 grid gap-3">
              {shown(settings, "size") && product.size && (
                <Detail label="Size" value={product.size} />
              )}
              {shown(settings, "stock") && product.stock != null && (
                <Detail
                  label="Availability"
                  value={`${product.stock} in stock`}
                />
              )}
              {shown(settings, "dimensions") && dimensions.length > 0 && (
                <Detail
                  label="Dimensions"
                  value={dimensions
                    .map(([label, value]) => `${label}: ${value} cm`)
                    .join(" · ")}
                />
              )}
              {shown(settings, "weight") && product.weight_grams != null && (
                <Detail label="Weight" value={`${product.weight_grams} g`} />
              )}
            </div>
            <AddToCartButton
              productId={product.id}
              stock={product.stock ?? 0}
              cartCount={cartCount}
            />
            <ProductShare productName={product.name} />
            {shown(settings, "videos") && videos.length > 0 && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Product videos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {videos.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Watch product video
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
