"use client";

import Image from "next/image";
import { useState } from "react";

import { FALLBACK_IMAGE } from "@/app/constants";
import { useImageKit } from "@/components/providers/imagekit-provider";
import { getImageUrl } from "@/lib/image-url";

type SafeImageProps = {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  deliveryWidth:
    | 150
    | 200
    | 300
    | 500
    | 800;
  className?: string;
  priority?: boolean;
  draggable?: boolean;
};

export default function SafeImage({
  src,
  alt,
  width,
  height,
  deliveryWidth,
  className,
  priority = false,
  draggable = true,
}: SafeImageProps) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const { enabled: imageKitEnabled } =
    useImageKit();

  const isImageKitImage =
    src?.startsWith(
      "https://ik.imagekit.io/luckycharmcreations/",
    ) ?? false;

  const shouldUseFallback =
    !src ||
    imageFailed ||
    (isImageKitImage && !imageKitEnabled);

  const imageUrl = shouldUseFallback
    ? FALLBACK_IMAGE
    : getImageUrl(src, deliveryWidth);

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      draggable={draggable}
      onError={() => {
        if (!imageFailed) {
          setImageFailed(true);
        }
      }}
      className={className}
    />
  );
}