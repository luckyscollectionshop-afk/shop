import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getImageKitProtectionStatus } from "@/lib/imagekit-protection";

export async function PATCH(request: Request) {
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

    const body = await request.json();

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean." },
        { status: 400 },
      );
    }

    const supabase =
      createServiceRoleClient();

    if (!body.enabled) {
      const { error } = await supabase
        .from("site_settings")
        .update({
          imagekit_enabled: false,
          imagekit_manual_override: false,
          imagekit_disabled_reason: "manual",
        })
        .eq("id", true);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        enabled: false,
        manualOverride: false,
        disabledReason: "manual",
      });
    }

    /*
     * Check current ImageKit usage before enabling.
     *
     * If bandwidth is already at/above the automatic threshold,
     * enabling here is an explicit admin override.
     */
    const status =
      await getImageKitProtectionStatus();

    const manualOverride =
      status.thresholdReached;

    const { error } = await supabase
      .from("site_settings")
      .update({
        imagekit_enabled: true,
        imagekit_manual_override:
          manualOverride,
        imagekit_disabled_reason: null,
      })
      .eq("id", true);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      enabled: true,
      manualOverride,
      disabledReason: null,
    });
  } catch (error) {
    console.error(
      "ImageKit toggle error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update ImageKit protection.",
      },
      { status: 500 },
    );
  }
}