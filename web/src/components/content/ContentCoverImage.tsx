import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media";

export function ContentCoverImage({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  if (!imageUrl) return null;
  const src = resolveMediaUrl(imageUrl);
  if (!src) return null;

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-100">
      <Image src={src} alt={alt} fill unoptimized className="object-cover" />
    </div>
  );
}
