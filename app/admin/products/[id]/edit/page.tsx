import { notFound, redirect } from "next/navigation";
import {
  ProductForm,
  type Category,
  type Product,
} from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]/edit">) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/auth/login");

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: product }, { data: categories }, { data: productCategories }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, description, size, price, sale_price, stock, weight_grams, height, width, depth, images, video_urls, active, display_settings",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase.from("categories").select("id, name").order("name"),
      supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", id),
    ]);

  if (!product) notFound();
  return (
    <ProductForm
      product={product as Product}
      categories={(categories ?? []) as Category[]}
      initialCategoryIds={(productCategories ?? []).map(
        (link) => link.category_id,
      )}
    />
  );
}
