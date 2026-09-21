"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";

type PublicImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  fallback?: ReactNode;
};

export function PublicImage({
  src,
  alt,
  fallback = null,
  ...props
}: PublicImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) return fallback;

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
