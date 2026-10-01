import Link from "next/link";
import { redirect } from "next/navigation";
import { getImageKitProtectionStatus } from "@/lib/imagekit-protection";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import ImageKitControl from "@/components/admin/imagekit-control";

export default async function ImageKitAdminPage() {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect("/auth/login");
  }

  const supabase = createServiceRoleClient();

  const { data: settings, error } = await supabase
    .from("site_settings")
    .select(
      "imagekit_enabled, imagekit_manual_override, imagekit_disabled_reason",
    )
    .eq("id", true)
    .single();

  if (error) {
    throw new Error(
      `Failed to load ImageKit settings: ${error.message}`,
    );
  }

  const enabled = settings.imagekit_enabled !== false;

  const usage = await getImageKitProtectionStatus();

const bandwidthUsedGB =
  usage.bandwidthBytes / 1024 / 1024 / 1024;

const bandwidthLimitGB =
  usage.bandwidthLimitBytes / 1024 / 1024 / 1024;

const storageUsedGB =
  usage.storageBytes / 1024 / 1024 / 1024;

const storageLimitGB =
  usage.storageLimitBytes / 1024 / 1024 / 1024;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        href="/admin"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to Admin Dashboard
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold">
          ImageKit Protection
        </h1>

        <p className="mt-2 text-muted-foreground">
          Monitor ImageKit usage and control image delivery protection.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  enabled ? "bg-green-500" : "bg-red-500"
                }`}
              />

              <span className="text-xl font-semibold">
                {enabled
                  ? "ImageKit enabled"
                  : "ImageKit disabled"}
              </span>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              enabled
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border bg-background p-6 shadow-sm">
  <div>
    <h2 className="text-xl font-semibold">
      ImageKit Usage
    </h2>

    <p className="mt-1 text-sm text-muted-foreground">
      Usage reported by ImageKit for {usage.startDate} to{" "}
      {usage.endDate}.
    </p>
  </div>

  <div className="mt-6 space-y-6">
    {/* Bandwidth */}
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            Monthly bandwidth
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {bandwidthUsedGB.toFixed(3)} GB of{" "}
            {bandwidthLimitGB.toFixed(0)} GB
          </p>
        </div>

        <span className="text-lg font-semibold">
          {usage.bandwidthPercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            usage.bandwidthPercent >=
            usage.thresholdPercent
              ? "bg-red-500"
              : usage.bandwidthPercent >= 80
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{
            width: `${Math.min(
              usage.bandwidthPercent,
              100,
            )}%`,
          }}
        />
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Automatic protection threshold:{" "}
        {usage.thresholdPercent}%
      </p>
    </div>

    {/* Storage */}
    <div className="border-t pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            Media Library storage
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {storageUsedGB.toFixed(3)} GB of{" "}
            {storageLimitGB.toFixed(0)} GB
          </p>
        </div>

        <span className="text-lg font-semibold">
          {usage.storagePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{
            width: `${Math.min(
              usage.storagePercent,
              100,
            )}%`,
          }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Storage is shown for information only. Automatic
        protection currently uses bandwidth only.
      </p>
    </div>
  </div>
</div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Disabled reason
            </p>

            <p className="mt-1 font-medium">
              {settings.imagekit_disabled_reason ?? "None"}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Manual override
            </p>

            <p className="mt-1 font-medium">
              {settings.imagekit_manual_override
                ? "Active"
                : "Not active"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
  <ImageKitControl
    enabled={usage.enabled}
    thresholdReached={usage.thresholdReached}
  />
</div>
      </div>
    </main>
  );
}