import { NextResponse, type NextRequest } from "next/server";
import { geolocation } from "@vercel/functions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type TrackRequest = {
  visitorId: string;
  pagePath: string;
  productId?: string | null;
  categoryId?: string | null;
  deviceType?: string | null;
  browser?: string | null;
};

const VALID_DEVICE_TYPES = new Set([
  "mobile",
  "tablet",
  "desktop",
]);

const MAX_PAGE_PATH_LENGTH = 500;
const MAX_VISITOR_ID_LENGTH = 100;
const MAX_BROWSER_LENGTH = 200;

function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return true;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TrackRequest;

    console.log("[analytics] TRACK REQUEST:", body);

    const {
      visitorId,
      pagePath,
      productId = null,
      categoryId = null,
      deviceType = null,
      browser = null,
    } = body;

    if (
      typeof visitorId !== "string" ||
      visitorId.length === 0 ||
      visitorId.length > MAX_VISITOR_ID_LENGTH
    ) {
      return NextResponse.json(
        { error: "Invalid visitor ID" },
        { status: 400 }
      );
    }

    if (
      typeof pagePath !== "string" ||
      pagePath.length === 0 ||
      pagePath.length > MAX_PAGE_PATH_LENGTH ||
      !pagePath.startsWith("/")
    ) {
      return NextResponse.json(
        { error: "Invalid page path" },
        { status: 400 }
      );
    }

    if (!isValidUuid(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    if (!isValidUuid(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    if (
      deviceType !== null &&
      (typeof deviceType !== "string" ||
        !VALID_DEVICE_TYPES.has(deviceType))
    ) {
      return NextResponse.json(
        { error: "Invalid device type" },
        { status: 400 }
      );
    }

    if (
      browser !== null &&
      (typeof browser !== "string" ||
        browser.length > MAX_BROWSER_LENGTH)
    ) {
      return NextResponse.json(
        { error: "Invalid browser" },
        { status: 400 }
      );
    }

    const geo = geolocation(request);

    const city = geo.city ?? null;
    const country = geo.country ?? null;

    /*
     * Get the currently logged-in user, if there is one.
     * This uses the normal authenticated Supabase client.
     */
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    /*
     * IMPORTANT:
     * The service-role client is used ONLY on this server route.
     * It bypasses RLS so visitors cannot directly read/write analytics data.
     */
    const supabase = createServiceRoleClient();

    /*
     * Find the visitor's most recent session.
     */
    const { data: existingSession, error: sessionLookupError } =
      await supabase
        .from("visitor_sessions")
        .select("id, user_id")
        .eq("visitor_id", visitorId)
        .order("last_seen", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (sessionLookupError) {
      console.error(
        "[analytics] Session lookup failed:",
        sessionLookupError
      );

      return NextResponse.json(
        { error: "Analytics temporarily unavailable" },
        { status: 500 }
      );
    }

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;

      const updateData: {
        last_seen: string;
        user_id?: string;
        city?: string | null;
        country?: string | null;
        device_type?: string | null;
        browser?: string | null;
      } = {
        last_seen: new Date().toISOString(),
        city,
        country,
        device_type: deviceType,
        browser,
      };

      if (user?.id) {
        updateData.user_id = user.id;
      }

      const { error: updateError } = await supabase
        .from("visitor_sessions")
        .update(updateData)
        .eq("id", sessionId);

      if (updateError) {
        console.error(
          "[analytics] Session update failed:",
          updateError
        );

        return NextResponse.json(
          { error: "Analytics temporarily unavailable" },
          { status: 500 }
        );
      }
    } else {
      const { data: newSession, error: insertError } = await supabase
        .from("visitor_sessions")
        .insert({
          visitor_id: visitorId,
          user_id: user?.id ?? null,
          city,
          country,
          device_type: deviceType,
          browser,
        })
        .select("id")
        .single();

      if (insertError || !newSession) {
        console.error(
          "[analytics] Session creation failed:",
          insertError
        );

        return NextResponse.json(
          { error: "Analytics temporarily unavailable" },
          { status: 500 }
        );
      }

      sessionId = newSession.id;
    }

    /*
     * Record the page view.
     */
    const { error: pageViewError } = await supabase
      .from("visitor_page_views")
      .insert({
        session_id: sessionId,
        page_path: pagePath,
        product_id: productId,
        category_id: categoryId,
      });

    if (pageViewError) {
      console.error(
        "[analytics] Page view insert failed:",
        pageViewError
      );

      return NextResponse.json(
        { error: "Analytics temporarily unavailable" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      city,
      country,
    });
  } catch (error) {
    console.error("[analytics] Unexpected error:", error);

    return NextResponse.json(
      { error: "Analytics temporarily unavailable" },
      { status: 500 }
    );
  }
}