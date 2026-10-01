"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ImageKitControlProps = {
  enabled: boolean;
  thresholdReached: boolean;
};

export default function ImageKitControl({
  enabled,
  thresholdReached,
}: ImageKitControlProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    if (saving) return;

    const nextEnabled = !enabled;

    if (
      nextEnabled &&
      thresholdReached
    ) {
      const confirmed = window.confirm(
        "ImageKit bandwidth has reached the automatic protection threshold. Enabling ImageKit will override protection and may use additional bandwidth. Continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    if (!nextEnabled) {
      const confirmed = window.confirm(
        "Disable ImageKit? ImageKit images will be replaced by the local fallback image until you enable it again.",
      );

      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/imagekit/toggle",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: nextEnabled,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Failed to update ImageKit.",
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "ImageKit toggle error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update ImageKit.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant={
          enabled ? "destructive" : "default"
        }
        disabled={saving}
        onClick={handleToggle}
      >
        {saving
          ? "Saving..."
          : enabled
            ? "Disable ImageKit"
            : "Enable ImageKit"}
      </Button>

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}