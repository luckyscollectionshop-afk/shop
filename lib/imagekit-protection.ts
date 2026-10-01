import {
  IMAGEKIT_DISABLE_AT,
  IMAGEKIT_FREE_BANDWIDTH_GB,
  IMAGEKIT_FREE_STORAGE_GB,
} from "@/app/constants";

import imagekit from "@/lib/imagekit";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const BYTES_PER_GB = 1024 * 1024 * 1024;

const BANDWIDTH_LIMIT_BYTES =
  IMAGEKIT_FREE_BANDWIDTH_GB * BYTES_PER_GB;

const STORAGE_LIMIT_BYTES =
  IMAGEKIT_FREE_STORAGE_GB * BYTES_PER_GB;

type ImageKitProtectionResult = {
  enabled: boolean;
  manualOverride: boolean;
  disabledReason: string | null;

  bandwidthBytes: number;
  bandwidthLimitBytes: number;
  bandwidthPercent: number;

  storageBytes: number;
  storageLimitBytes: number;
  storagePercent: number;

  thresholdPercent: number;
  thresholdReached: boolean;

  startDate: string;
  endDate: string;
};

function formatDate(date: Date) {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthDateRange() {
  const now = new Date();

  const startOfMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
    ),
  );

  return {
    startDate: formatDate(startOfMonth),
    endDate: formatDate(now),
  };
}

function calculatePercent(
  usedBytes: number,
  limitBytes: number,
) {
  if (limitBytes <= 0) {
    return 0;
  }

  return (usedBytes / limitBytes) * 100;
}

export async function getImageKitProtectionStatus():
  Promise<ImageKitProtectionResult> {
  const supabase = createServiceRoleClient();

  const { startDate, endDate } =
    getCurrentMonthDateRange();

  /*
   * Get current ImageKit usage.
   *
   * Bandwidth is evaluated for the current calendar month.
   * Media Library storage is returned by the usage API as
   * mediaLibraryStorageBytes.
   */
  const usage =
    await imagekit.accounts.usage.get({
      startDate,
      endDate,
    });

  const bandwidthBytes =
    usage.bandwidthBytes ?? 0;

  const storageBytes =
    usage.mediaLibraryStorageBytes ?? 0;

  const bandwidthPercent =
    calculatePercent(
      bandwidthBytes,
      BANDWIDTH_LIMIT_BYTES,
    );

  const storagePercent =
    calculatePercent(
      storageBytes,
      STORAGE_LIMIT_BYTES,
    );

 const thresholdReached =
  bandwidthPercent >= IMAGEKIT_DISABLE_AT;
  /*
   * Read the persisted protection state.
   */
  const {
    data: settings,
    error: settingsError,
  } = await supabase
    .from("site_settings")
    .select(
      `
        imagekit_enabled,
        imagekit_manual_override,
        imagekit_disabled_reason
      `,
    )
    .eq("id", true)
    .single();

  if (settingsError) {
    throw new Error(
      `Failed to read ImageKit settings: ${settingsError.message}`,
    );
  }

  let enabled =
    settings.imagekit_enabled ?? true;

  let manualOverride =
    settings.imagekit_manual_override ?? false;

  let disabledReason =
    settings.imagekit_disabled_reason ?? null;

  /*
   * Protection rule:
   *
   * >= 95%
   *   Automatically disable ImageKit unless the admin has
   *   explicitly overridden the protection.
   */
  if (
    thresholdReached &&
    !manualOverride
  ) {
    if (
      enabled ||
      disabledReason !== "usage_limit"
    ) {
      const { error: updateError } =
        await supabase
          .from("site_settings")
          .update({
            imagekit_enabled: false,
            imagekit_disabled_reason:
              "usage_limit",
          })
          .eq("id", true);

      if (updateError) {
        throw new Error(
          `Failed to activate ImageKit protection: ${updateError.message}`,
        );
      }
    }

    enabled = false;
    disabledReason = "usage_limit";
  }

  /*
   * If ImageKit was automatically disabled because of usage
   * and usage has since fallen below 95%, restore it.
   *
   * A manual disable is NOT automatically restored.
   */
  if (
    !thresholdReached &&
    disabledReason === "usage_limit"
  ) {
    const { error: updateError } =
      await supabase
        .from("site_settings")
        .update({
          imagekit_enabled: true,
          imagekit_manual_override: false,
          imagekit_disabled_reason: null,
        })
        .eq("id", true);

    if (updateError) {
      throw new Error(
        `Failed to restore ImageKit: ${updateError.message}`,
      );
    }

    enabled = true;
    manualOverride = false;
    disabledReason = null;
  }

  /*
   * Once usage is safely below the threshold, an old
   * override is no longer necessary.
   */
  if (
    !thresholdReached &&
    manualOverride
  ) {
    const { error: updateError } =
      await supabase
        .from("site_settings")
        .update({
          imagekit_manual_override: false,
        })
        .eq("id", true);

    if (updateError) {
      throw new Error(
        `Failed to clear ImageKit override: ${updateError.message}`,
      );
    }

    manualOverride = false;
  }

  return {
    enabled,
    manualOverride,
    disabledReason,

    bandwidthBytes,
    bandwidthLimitBytes:
      BANDWIDTH_LIMIT_BYTES,
    bandwidthPercent,

    storageBytes,
    storageLimitBytes:
      STORAGE_LIMIT_BYTES,
    storagePercent,

    thresholdPercent:
      IMAGEKIT_DISABLE_AT,
    thresholdReached,

    startDate,
    endDate,
  };
}