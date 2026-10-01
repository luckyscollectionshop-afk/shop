import { NextResponse } from "next/server";

import { getImageKitProtectionStatus } from "@/lib/imagekit-protection";

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    const cronSecret =
      process.env.CRON_SECRET;

    if (
      !cronSecret ||
      authorization !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const status =
      await getImageKitProtectionStatus();

    return NextResponse.json({
      success: true,
      enabled: status.enabled,
      manualOverride:
        status.manualOverride,
      disabledReason:
        status.disabledReason,
      bandwidthPercent:
        status.bandwidthPercent,
      thresholdPercent:
        status.thresholdPercent,
      thresholdReached:
        status.thresholdReached,
      startDate: status.startDate,
      endDate: status.endDate,
    });
  } catch (error) {
    console.error(
      "ImageKit protection cron error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ImageKit protection check failed.",
      },
      { status: 500 },
    );
  }
}