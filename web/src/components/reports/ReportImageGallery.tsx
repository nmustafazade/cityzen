import Image, { type ImageLoader } from "next/image";

import { resolveMediaUrl } from "@/lib/media";
import type { ReportImage } from "@/types/report";

const passthroughLoader: ImageLoader = ({ src }) => src;

export function ReportImageGallery({
  images,
  reportTitle,
}: {
  images: ReportImage[];
  reportTitle: string;
}) {
  const displayImages = images
    .map((image) => ({
      ...image,
      resolvedUrl: resolveMediaUrl(image.imageUrl),
    }))
    .filter((image) => image.resolvedUrl);

  if (displayImages.length === 0) {
    return <p className="text-sm text-slate-500">No photos attached.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {displayImages.map((image, index) => (
        <li
          key={image.id}
          className={index === 0 ? "col-span-2 row-span-2 sm:col-span-3" : ""}
        >
          <a
            href={image.resolvedUrl}
            target="_blank"
            rel="noreferrer"
            className={`group relative block overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${index === 0 ? "aspect-[4/3]" : "aspect-square"}`}
          >
            <Image
              loader={passthroughLoader}
              unoptimized
              fill
              sizes="(max-width: 640px) 50vw, 220px"
              src={image.resolvedUrl}
              alt={`Photo ${index + 1} attached to report: ${reportTitle}`}
              className="object-cover transition group-hover:scale-[1.02]"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
