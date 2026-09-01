import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    request: Request,
    { params }: Params
) {
    try {
        const { isAdmin } = await requireAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        const supabase = await createClient();

        const { data: oldCategory, error: oldCategoryError } = await supabase
            .from("categories")
            .select("image_public_id")
            .eq("id", id)
            .single();

        if (oldCategoryError || !oldCategory) {
            return NextResponse.json(
                { error: "Category not found." },
                { status: 404 }
            );
        }

        const name =
            typeof body.name === "string" ? body.name.trim() : "";

        const slug =
            typeof body.slug === "string" ? body.slug.trim() : "";

        const description =
            typeof body.description === "string"
                ? body.description.trim() || null
                : null;

        const sortOrder =
            typeof body.sort_order === "number"
                ? body.sort_order
                : 0;
        const imageUrl =
            typeof body.image_url === "string"
                ? body.image_url.trim() || null
                : null;
        const imagePublicId =
            typeof body.image_public_id === "string"
                ? body.image_public_id.trim() || null
                : null;
        const isActive =
            typeof body.is_active === "boolean"
                ? body.is_active
                : true;

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        if (!slug) {
            return NextResponse.json(
                { error: "Category slug is required" },
                { status: 400 }
            );
        }



        // Check whether another category already uses this name.
        const { data: existingName } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", name)
            .neq("id", id)
            .maybeSingle();

        if (existingName) {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 409 }
            );
        }

        // Check whether another category already uses this slug.
        const { data: existingSlug } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .neq("id", id)
            .maybeSingle();

        if (existingSlug) {
            return NextResponse.json(
                { error: "A category with this slug already exists" },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from("categories")
            .update({
                name,
                slug,
                description,
                sort_order: sortOrder,
                is_active: isActive,
                image_url: imageUrl,
                image_public_id: imagePublicId,
            })
            .eq("id", id)
            .select(
                "id, name, slug, description, image_url, is_active, sort_order, image_public_id"
            )
            .single();

        if (error) {
            throw error;
        }
        // If the image was replaced, remove the old image from Cloudinary.
        if (
            oldCategory.image_public_id &&
            oldCategory.image_public_id !== imagePublicId
        ) {
            try {
                const { default: cloudinary } = await import("@/lib/cloudinary");

                await cloudinary.uploader.destroy(
                    oldCategory.image_public_id
                );
            } catch (cloudinaryError) {
                console.error(
                    "Failed to delete old category image from Cloudinary:",
                    cloudinaryError
                );
            }
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Category update error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update category",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: Params
) {
    try {
        const { isAdmin } = await requireAdmin();

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const supabase = await createClient();

        // Get the category and its Cloudinary image information.
        const { data: category, error: categoryError } = await supabase
            .from("categories")
            .select("id, name, image_public_id")
            .eq("id", id)
            .single();

        if (categoryError || !category) {
            return NextResponse.json(
                { error: "Category not found." },
                { status: 404 }
            );
        }

        // Don't allow deletion if products are still assigned to this category.
        const { count, error: linksError } = await supabase
            .from("product_categories")
            .select("product_id", { count: "exact", head: true })
            .eq("category_id", id);

        if (linksError) {
            throw linksError;
        }

        if ((count ?? 0) > 0) {
            return NextResponse.json(
                {
                    error:
                        "This category is assigned to products. Remove those product assignments first.",
                },
                { status: 409 }
            );
        }

        // Delete the category from Supabase.
        const { error: deleteError } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);

        if (deleteError) {
            throw deleteError;
        }

        // Delete the category image from Cloudinary, if one exists.
        if (category.image_public_id) {
            const { default: cloudinary } = await import("@/lib/cloudinary");

            await cloudinary.uploader.destroy(category.image_public_id);
        }

        return NextResponse.json({
            success: true,
            message: `Category "${category.name}" deleted successfully.`,
        });
    } catch (error) {
        console.error("Category deletion error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete category.",
            },
            { status: 500 }
        );
    }
}