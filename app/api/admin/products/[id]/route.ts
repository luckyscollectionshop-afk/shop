import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/products/[id]">
) {
  const { user, isAdmin } = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const { error: relationsError } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", id);

  if (relationsError) {
    return NextResponse.json({ error: relationsError.message }, { status: 500 });
  }
  const { data: deletedProduct, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!deletedProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
