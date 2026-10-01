const IMAGEKIT_HOSTNAME = "ik.imagekit.io";
const IMAGEKIT_PATH_PREFIX = "/luckycharmcreations/";

type ImageWidth = 150 | 200 | 300 | 500 | 800;

export function getImageUrl(
  url: string | null | undefined,
  width: ImageWidth,
) {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    const isLuckyImageKitImage =
      parsedUrl.hostname === IMAGEKIT_HOSTNAME &&
      parsedUrl.pathname.startsWith(IMAGEKIT_PATH_PREFIX);

    /*
     * Existing Cloudinary images and any other external images
     * must continue working exactly as they do today.
     */
    if (!isLuckyImageKitImage) {
      return url;
    }

    /*
     * ImageKit path transformation.
     *
     * Example:
     * Original:
     * https://ik.imagekit.io/luckycharmcreations/shop/products/photo.jpg
     *
     * 300px:
     * https://ik.imagekit.io/luckycharmcreations/tr:w-300/shop/products/photo.jpg
     */
    const pathWithoutEndpoint =
      parsedUrl.pathname.slice(IMAGEKIT_PATH_PREFIX.length);

    parsedUrl.pathname =
      `${IMAGEKIT_PATH_PREFIX}tr:w-${width}/${pathWithoutEndpoint}`;

    return parsedUrl.toString();
  } catch {
    /*
     * If an old/odd URL cannot be parsed, leave it untouched
     * rather than breaking an existing image.
     */
    return url;
  }
}