"use client";

import { useState } from "react";

export default function CleanupAnalyticsButton() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCleanup() {
    const confirmed = window.confirm(
      "Clean analytics data older than 30 days?\n\n" +
        "Monthly permanent statistics will NOT be deleted."
    );

    if (!confirmed) {
      return;
    }

    setIsCleaning(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/analytics/cleanup",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Cleanup failed"
        );
      }

      setMessage(
        `Cleanup complete: ${data.sessions_deleted ?? 0} sessions and ${data.page_views_deleted ?? 0} page views deleted.`
      );
    } catch (error) {
      console.error("[analytics] Cleanup failed:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Cleanup failed"
      );
    } finally {
      setIsCleaning(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Analytics Data Cleanup
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Remove detailed visitor data older than 30 days.
            Permanent monthly statistics are preserved.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCleanup}
          disabled={isCleaning}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCleaning
            ? "Cleaning..."
            : "🧹 Clean old data"}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}