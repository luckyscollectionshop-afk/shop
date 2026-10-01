import { NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";
import imagekit from "@/lib/imagekit";
import { requireAdmin } from "@/lib/supabase/admin";

const IMAGEKIT_HOSTNAME = "ik.imagekit.io";
const IMAGEKIT_PATH_PREFIX = "/luckycharmcreations/";

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // Authentication
    // -------------------------------------------------------

    const authorization = request.headers.get("authorization");

    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

    const { user, isAdmin } = await requireAdmin(accessToken);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -------------------------------------------------------
    // Request body
    // -------------------------------------------------------

    const body = await request.json();

    const url = body?.url;

    // console.log("🔴 MEDIA DELETE ROUTE CALLED:", {
    //   url,
    // });

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 },
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    // -------------------------------------------------------
    // CLOUDINARY
    // -------------------------------------------------------

    if (parsedUrl.hostname === "res.cloudinary.com") {
      const pathname = parsedUrl.pathname;

      const uploadMarker = "/upload/";

      const uploadIndex = pathname.indexOf(uploadMarker);

      if (uploadIndex === -1) {
        return NextResponse.json(
          { error: "Invalid Cloudinary URL" },
          { status: 400 },
        );
      }

      let publicId = pathname.slice(uploadIndex + uploadMarker.length);

      // Remove Cloudinary version:
      // v1234567890/shop/products/image.jpg
      // ->
      // shop/products/image.jpg
      publicId = publicId.replace(/^v\d+\//, "");

      // Remove file extension.
      publicId = publicId.replace(/\.[^/.]+$/, "");

      if (!publicId) {
        return NextResponse.json(
          {
            error: "Could not determine Cloudinary public ID",
          },
          { status: 400 },
        );
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      if (result.result !== "ok" && result.result !== "not found") {
        return NextResponse.json(
          {
            error: "Cloudinary could not delete the image",
            result: result.result,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        provider: "cloudinary",
        public_id: publicId,
        result: result.result,
      });
    }

    // -------------------------------------------------------
    // IMAGEKIT
    // -------------------------------------------------------

    if (
      parsedUrl.hostname === IMAGEKIT_HOSTNAME &&
      parsedUrl.pathname.startsWith(IMAGEKIT_PATH_PREFIX)
    ) {
      /*
       * Stored URLs look like:
       *
       * https://ik.imagekit.io/luckycharmcreations/
       * shop/products/image.jpg
       *
       * ImageKit deletion requires fileId.
       *
       * Our products / hero / reviews currently store the URL,
       * so find the Media Library file by its exact path first.
       */

      let filePath = parsedUrl.pathname.slice(IMAGEKIT_PATH_PREFIX.length);

      filePath = decodeURIComponent(filePath);

      /*
       * Defensive support in case a transformed ImageKit URL
       * is ever sent here instead of the raw stored URL.
       *
       * Example:
       * tr:w-300/shop/products/image.jpg
       * ->
       * shop/products/image.jpg
       */
      filePath = filePath.replace(/^tr:[^/]+\//, "");

      filePath = `/${filePath}`;

      /*
       * Match the exact file path.
       *
       * assets.list() may return File or Folder objects,
       * therefore check the properties defensively.
       */
      const lastSlashIndex = filePath.lastIndexOf("/");

      const folderPath =
        lastSlashIndex > 0 ? filePath.slice(0, lastSlashIndex) : "/";

      const fileName = filePath.slice(lastSlashIndex + 1);

    //   console.log("🔴 IMAGEKIT DELETE LOOKUP:", {
    //     filePath,
    //     folderPath,
    //     fileName,
    //   });

      const assets = await imagekit.assets.list({
        type: "file",
        path: folderPath,
        searchQuery: `name = "${fileName.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
        limit: 100,
      });

    //   console.log(
    //     "🔴 IMAGEKIT ASSETS FOUND:",
    //     assets.map((asset) => ({
    //       name: "name" in asset ? asset.name : undefined,
    //       filePath: "filePath" in asset ? asset.filePath : undefined,
    //       fileId: "fileId" in asset ? asset.fileId : undefined,
    //     })),
    //   );

      const file = assets.find((asset) => {
        if (!("filePath" in asset)) {
          return false;
        }

        return asset.filePath === filePath;
      });

      if (!file || !("fileId" in file) || !file.fileId) {
        /*
         * Treat an already-missing remote image as successfully
         * deleted. This allows the application to remove stale
         * database references without getting stuck.
         */
        return NextResponse.json(
          {
            error: "ImageKit file could not be found.",
            filePath,
          },
          { status: 404 },
        );
      }
    //   console.log("🔴 DELETING IMAGEKIT FILE:", {
    //     fileId: file.fileId,
    //     filePath,
    //   });
      await imagekit.files.delete(file.fileId);

      return NextResponse.json({
        success: true,
        provider: "imagekit",
        fileId: file.fileId,
        result: "ok",
      });
    }

    // -------------------------------------------------------
    // UNKNOWN PROVIDER
    // -------------------------------------------------------

    return NextResponse.json(
      {
        error:
          "Unsupported image provider. Only Lucky's Collection ImageKit and Cloudinary images can be deleted.",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Media delete error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete image",
      },
      { status: 500 },
    );
  }
}
