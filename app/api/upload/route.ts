import { NextResponse } from "next/server";
import { getImageKitProtectionStatus } from "@/lib/imagekit-protection";
import imagekit from "@/lib/imagekit";
import { requireAdmin } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MiB

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // Authentication
    // -------------------------------------------------------

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
    // -------------------------------------------------------
    // ImageKit protection
    // -------------------------------------------------------

    const imageKitStatus =
      await getImageKitProtectionStatus();

    if (!imageKitStatus.enabled) {
      return NextResponse.json(
        {
          error:
            "ImageKit usage protection is active. Image uploads are currently disabled to protect the free-tier account.",
          code: "IMAGEKIT_DISABLED",
          reason:
            imageKitStatus.disabledReason,
          bandwidthPercent:
            imageKitStatus.bandwidthPercent,
        },
        { status: 503 },
      );
    }
    // -------------------------------------------------------
    // Form data
    // -------------------------------------------------------

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const folder = formData.get("folder");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // Incoming file size
    // -------------------------------------------------------

    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (
        file.size /
        (1024 * 1024)
      ).toFixed(2);

      return NextResponse.json(
        {
          error: `File is too large (${sizeInMB} MB). Maximum allowed size is 4.5 MB.`,
          code: "FILE_TOO_LARGE",
          maxSizeMB: 4.5,
          actualSizeMB: Number(sizeInMB),
        },
        { status: 413 },
      );
    }

    // -------------------------------------------------------
    // Images only
    //
    // Lucky's will use YouTube URLs for videos instead of
    // uploading videos to ImageKit.
    // -------------------------------------------------------

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Only image files can be uploaded.",
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // Validate folder
    // -------------------------------------------------------

    if (
      folder !== null &&
      folder !== "hero" &&
      folder !== "category" &&
      folder !== "products" &&
      folder !== "social" &&
      folder !== "reviews"
    ) {
      return NextResponse.json(
        { error: "Invalid upload folder" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------
    // ImageKit folder
    // -------------------------------------------------------

    const imageKitFolder =
      folder === "hero"
        ? "/shop/hero"
        : folder === "category"
          ? "/shop/categories"
          : folder === "social"
            ? "/shop/social"
            : folder === "reviews"
              ? "/shop/reviews"
              : "/shop/products";

    // -------------------------------------------------------
    // Convert File -> Buffer
    // -------------------------------------------------------

const bytes = await file.arrayBuffer();
const base64File = Buffer.from(bytes).toString("base64");

    // -------------------------------------------------------
    // Upload to ImageKit
    //
    // TEST SETTINGS:
    // - maximum width: 1200px
    // - quality: 75
    //
    // pre transformation means ImageKit applies this before
    // storing the resulting image in the Media Library.
    // -------------------------------------------------------

   const result = await imagekit.files.upload({
  file: base64File,
  fileName: file.name || `image-${Date.now()}`,
  folder: imageKitFolder,

  transformation: {
    pre: "w-800,q-60",
  },

  useUniqueFileName: true,
});

    // -------------------------------------------------------
    // Useful test information
    // -------------------------------------------------------

    const storedSizeBytes = result.size ?? 0;
    const storedSizeKB =
      Math.round((storedSizeBytes / 1024) * 100) / 100;

    const originalSizeKB =
      Math.round((file.size / 1024) * 100) / 100;

    console.log("ImageKit upload test:", {
      originalSizeKB,
      storedSizeKB,
      width: result.width,
      height: result.height,
      url: result.url,
      fileId: result.fileId,
    });

    // -------------------------------------------------------
    // Success
    //
    // Keep "public_id" temporarily for compatibility with
    // the old Cloudinary response shape.
    // -------------------------------------------------------

    return NextResponse.json({
      url: result.url,

      public_id: result.fileId,
      fileId: result.fileId,

      originalSizeBytes: file.size,
      originalSizeKB,

      storedSizeBytes,
      storedSizeKB,

      width: result.width ?? null,
      height: result.height ?? null,
    });
  } catch (error) {
    console.error(
      "ImageKit upload error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed",
      },
      { status: 500 },
    );
  }
}