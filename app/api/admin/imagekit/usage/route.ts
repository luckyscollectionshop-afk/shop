import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/admin";
import { getImageKitProtectionStatus } from "@/lib/imagekit-protection";

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    const accessToken =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : undefined;

    const { user, isAdmin } =
      await requireAdmin(accessToken);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const status =
      await getImageKitProtectionStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error(
      "ImageKit usage check error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch ImageKit usage.",
      },
      { status: 500 },
    );
  }
}