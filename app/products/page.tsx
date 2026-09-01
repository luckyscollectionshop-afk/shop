import { createClient } from "@/lib/supabase/server";
import ProductBrowser from "./ProductBrowser";
import SiteHeader from "@/components/storefront/site-header";
export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const params = await searchParams;
  const categorySlug = params.category;
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("products")
      .select(
        ` id, name, description, price, sale_price, images, product_categories ( category_id ) `,
      )
      .eq("active", true)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);
  if (productsError) {
    console.error("Products loading error:", productsError);
  }
  if (categoriesError) {
    console.error("Categories loading error:", categoriesError);
  }
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
  const formattedProducts = (products ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    sale_price: product.sale_price == null ? null : Number(product.sale_price),
    images: (product.images ?? []) as string[],
    categoryIds: (product.product_categories ?? []).map(
      (category) => category.category_id,
    ),
  }));
  const selectedCategory = (categories ?? []).find(
    (category) => category.slug === categorySlug,
  );
  return (
    <main className="min-h-screen bg-background">
      {" "}
      <SiteHeader
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        cartCount={cartCount}
      />{" "}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {" "}
        <h1 className="text-3xl font-semibold tracking-tight">
          {" "}
          Products{" "}
        </h1>{" "}
        <p className="mt-2 text-muted-foreground">
          {" "}
          Browse our collection.{" "}
        </p>{" "}
        <ProductBrowser
          products={formattedProducts}
          categories={categories ?? []}
          initialCategory={selectedCategory?.id}
        />{" "}
      </div>{" "}
    </main>
  );
}
