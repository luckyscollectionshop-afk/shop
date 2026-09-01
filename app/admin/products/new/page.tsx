import { ProductForm, type Category } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  return <ProductForm categories={(categories ?? []) as Category[]} />;
}
