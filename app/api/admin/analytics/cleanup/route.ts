import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
export async function POST() {
  try {
    const { isAdmin } = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("cleanup_visitor_analytics");
    if (error) {
      console.error("[analytics] Cleanup failed:", error);
      return NextResponse.json(
        { error: "Analytics cleanup failed" },
        { status: 500 },
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("[analytics] Cleanup route error:", error);
    return NextResponse.json(
      { error: "Analytics cleanup failed" },
      { status: 500 },
    );
  }
}
