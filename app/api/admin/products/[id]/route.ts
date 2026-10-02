import { NextResponse } from "next/server";

import imagekit from "@/lib/imagekit";
import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const IMAGEKIT_HOSTNAME = "ik.imagekit.io";
const IMAGEKIT_PATH_PREFIX =
  "/luckycharmcreations/";

async function deleteImageKitImage(
  url: string,
) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return;
  }

  const isLuckyImageKitImage =
    parsedUrl.hostname ===
      IMAGEKIT_HOSTNAME &&
    parsedUrl.pathname.startsWith(
      IMAGEKIT_PATH_PREFIX,
    );

  if (!isLuckyImageKitImage) {
    return;
  }

  let filePath =
    parsedUrl.pathname.slice(
      IMAGEKIT_PATH_PREFIX.length,
    );

  filePath =
    decodeURIComponent(filePath);

  // Support transformed ImageKit URLs defensively.
  filePath = filePath.replace(
    /^tr:[^/]+\//,
    "",
  );

  filePath = `/${filePath}`;

  const lastSlashIndex =
    filePath.lastIndexOf("/");

  const folderPath =
    lastSlashIndex > 0
      ? filePath.slice(
          0,
          lastSlashIndex,
        )
      : "/";

  const fileName =
    filePath.slice(
      lastSlashIndex + 1,
    );

  const escapedFileName =
    fileName
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');

  const assets =
    await imagekit.assets.list({
      type: "file",
      path: folderPath,
      searchQuery: `name = "${escapedFileName}"`,
      limit: 100,
    });

  const file = assets.find(
    (asset) => {
      if (!("filePath" in asset)) {
        return false;
      }

      return (
        asset.filePath === filePath
      );
    },
  );

  if (
    !file ||
    !("fileId" in file) ||
    !file.fileId
  ) {
    console.warn(
      `ImageKit file not found during product deletion: ${filePath}`,
    );

    return;
  }

  await imagekit.files.delete(
    file.fileId,
  );
}

export async function DELETE(
  _request: Request,
  context: RouteContext<
    "/api/admin/products/[id]"
  >,
) {
  const { user, isAdmin } =
    await requireAdmin();

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

  const { id } =
    await context.params;

  const supabase =
    await createClient();

  // Get product images before deleting the product.
  const {
    data: product,
    error: productFetchError,
  } = await supabase
    .from("products")
    .select("id, images")
    .eq("id", id)
    .maybeSingle();

  if (productFetchError) {
    return NextResponse.json(
      {
        error:
          productFetchError.message,
      },
      { status: 500 },
    );
  }

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 },
    );
  }

  const imageUrls =
    Array.isArray(product.images)
      ? product.images.filter(
          (
            image,
          ): image is string =>
            typeof image === "string",
        )
      : [];

  /*
   * Delete product images from ImageKit.
   *
   * Image cleanup should not prevent the product itself
   * from being deleted if a remote file is already missing
   * or ImageKit cleanup fails.
   */
  for (const url of imageUrls) {
    try {
      await deleteImageKitImage(url);
    } catch (error) {
      console.error(
        `Failed to delete ImageKit image ${url}:`,
        error,
      );
    }
  }

  // Remove category relationships.
  const {
    error: relationsError,
  } = await supabase
    .from("product_categories")
    .delete()
    .eq("product_id", id);

  if (relationsError) {
    return NextResponse.json(
      {
        error:
          relationsError.message,
      },
      { status: 500 },
    );
  }

  // Delete product.
  const { error } =
    await supabase
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}