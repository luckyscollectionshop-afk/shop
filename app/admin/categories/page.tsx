import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import AddCategoryForm from "./AddCategoryForm";

export default async function CategoriesPage() {
    const { isAdmin } = await requireAdmin();

    if (!isAdmin) {
        redirect("/auth/login");
    }

    const supabase = await createClient();

    const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, is_active, sort_order, image_public_id")
        .order("sort_order")
        .order("name");

    return (
        <main className="mx-auto w-5xl px-4 py-8">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Categories</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage the categories used by your products.
                    </p>
                </div>

                <Link
                    href="/admin"
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                    Back to Admin
                </Link>
            </div>

            <div className="mt-8 rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Add Category</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Create a category for your products.
                </p>

                <div className="mt-4">
                    <AddCategoryForm />
                </div>
            </div>

            {error ? (
                <p className="mt-6 text-sm text-destructive">
                    Unable to load categories: {error.message}
                </p>
            ) : categories?.length ? (
                <div className="mt-8 overflow-hidden rounded-lg border">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between gap-4 border-b px-4 py-4 last:border-0"
                        >
                            <div className="flex items-center gap-4">
    {category.image_url ? (
        <Image
            src={category.image_url}
            alt={category.name}
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-lg object-cover"
        />
    ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border text-xs text-muted-foreground">
            No image
        </div>
    )}

    <div>
        <p className="font-medium">{category.name}</p>

        <p className="text-sm text-muted-foreground">
            {category.slug}
        </p>

        <p className="text-xs text-muted-foreground">
            Sort order: {category.sort_order}
        </p>
    </div>
</div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={
                                        category.is_active
                                            ? "text-sm text-green-700"
                                            : "text-sm text-muted-foreground"
                                    }
                                >
                                    {category.is_active ? "Active" : "Inactive"}
                                </span>

                                <Link
                                    href={`/admin/categories/${category.id}/edit`}
                                    className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                                >
                                    Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-8 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    No categories yet.
                </p>
            )}
        </main>
    );
}