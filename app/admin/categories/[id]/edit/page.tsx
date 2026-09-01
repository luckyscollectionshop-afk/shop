import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import EditCategoryForm from "./EditCategoryForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("categories")
    .select(
      "id, name, slug, description, image_url, is_active, sort_order, image_public_id"
    )
    .eq("id", id)
    .single();

  if (error || !category) {
    notFound();
  }

  return (
    <main className="mx-auto w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Category</h1>

        <p className="mt-2 text-muted-foreground">
          Update your category details.
        </p>
      </div>

      <EditCategoryForm category={category} />
    </main>
  );
}