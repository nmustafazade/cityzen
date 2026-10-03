"use client";

import Image, { type ImageLoader } from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const passthroughLoader: ImageLoader = ({ src }) => src;

interface SelectedImage {
  file: File;
  previewUrl: string;
}

interface ReportImagePickerProps {
  maxFiles: number;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function ReportImagePicker({
  maxFiles,
  onFilesChange,
  disabled = false,
}: ReportImagePickerProps) {
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [error, setError] = useState("");
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function selectFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    if (selected.length + incoming.length > maxFiles) {
      setError(
        `You can select at most ${maxFiles} ${maxFiles === 1 ? "photo" : "photos"}.`,
      );
      return;
    }
    const invalidType = incoming.find((file) => !acceptedTypes.has(file.type));
    if (invalidType) {
      setError(`${invalidType.name} is not a JPEG, PNG, or WebP image.`);
      return;
    }
    const oversized = incoming.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      setError(`${oversized.name} is larger than 5 MB.`);
      return;
    }

    const additions = incoming.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return { file, previewUrl };
    });
    const next = [...selected, ...additions];
    setSelected(next);
    setError("");
    onFilesChange(next.map((item) => item.file));
  }

  function removeImage(index: number) {
    const removed = selected[index];
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      previewUrls.current.delete(removed.previewUrl);
    }
    const next = selected.filter((_item, itemIndex) => itemIndex !== index);
    setSelected(next);
    setError("");
    onFilesChange(next.map((item) => item.file));
  }

  return (
    <div>
      <label
        htmlFor="report-images"
        className="mb-1.5 block text-sm font-semibold text-slate-800"
      >
        Photos
      </label>
      <input
        id="report-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || maxFiles === 0}
        onChange={(event) => {
          selectFiles(event.target.files);
          event.target.value = "";
        }}
        className="block w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:bg-emerald-50 file:px-4 file:py-3 file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Up to {maxFiles} {maxFiles === 1 ? "photo" : "photos"}. JPEG, PNG or
        WebP. Maximum 5 MB each.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {selected.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {selected.map((item, index) => (
            <li
              key={item.previewUrl}
              className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <Image
                loader={passthroughLoader}
                unoptimized
                src={item.previewUrl}
                alt={`Preview of ${item.file.name}`}
                width={80}
                height={80}
                className="size-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {item.file.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(item.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeImage(index)}
                  className="mt-2 text-sm font-semibold text-red-700 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
