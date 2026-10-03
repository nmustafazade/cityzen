"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ContentImagePickerProps {
  disabled?: boolean;
  resetKey: number;
  onFileChange: (file: File | null) => void;
}

export function ContentImagePicker({
  disabled = false,
  resetKey,
  onFileChange,
}: ContentImagePickerProps) {
  const inputId = useId();
  const [selection, setSelection] = useState<{
    key: number;
    file: File;
  } | null>(null);
  const [error, setError] = useState("");
  const file = selection?.key === resetKey ? selection.file : null;
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function choose(selected: File | undefined) {
    setError("");
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("The photo must be 5 MB or smaller.");
      return;
    }
    setSelection({ key: resetKey, file: selected });
    onFileChange(selected);
  }

  function remove() {
    setSelection(null);
    setError("");
    onFileChange(null);
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
        Photo <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => choose(event.target.files?.[0])}
        className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <p className="mt-1 text-xs text-slate-500">
        JPEG, PNG, or WebP. Maximum 5 MB.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {file && previewUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <div className="relative aspect-[16/9] bg-slate-100">
            <Image
              src={previewUrl}
              alt="Selected photo preview"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-between gap-3 p-3">
            <span className="truncate text-sm text-slate-600">{file.name}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={remove}
              className="text-sm font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
