"use client";

import { useCallback, useRef, useState } from "react";
import {
  MdOutlineCloudUpload,
  MdOutlineDelete,
  MdOutlineAdd,
} from "react-icons/md";

const MAX_KB = 300;
const MAX_BYTES = MAX_KB * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Scope = "hero" | "about" | "vehicle" | "partner" | "editor" | "general";

export interface ImageItem {
  url: string;
  publicId: string;
}

interface ImageListProps {
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  scope?: Scope;
  aspect?: string;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageList({
  items = [],
  onChange,
  scope = "general",
  aspect = "4 / 3",
  maxImages = 8,
  disabled = false,
}: ImageListProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, and WEBP images are allowed.";
    }
    if (file.size > MAX_BYTES) {
      return `File too large (${Math.round(
        file.size / 1024
      )} KB). Maximum is ${MAX_KB} KB.`;
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      setError("");

      const remaining = maxImages - items.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxImages} images allowed.`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remaining);
      setUploading(true);

      const added: ImageItem[] = [];

      for (const file of filesToUpload) {
        const validationError = validate(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("scope", scope);

          const res = await fetch("/api/upload/website-image", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Upload failed");
          }

          added.push({
            url: data.url,
            publicId: data.publicId,
          });
        } catch (err: any) {
          setError(err.message || "Upload failed. Please try again.");
        }
      }

      if (added.length > 0) {
        onChange([...items, ...added]);
      }

      setUploading(false);
    },
    [items, onChange, scope, maxImages]
  );

  const handleRemove = async (index: number) => {
    const target = items[index];
    if (!target) return;

    if (!confirm("Remove this image?")) return;

    try {
      const params = new URLSearchParams();
      if (target.publicId) params.set("publicId", target.publicId);
      else params.set("url", target.url);

      await fetch(`/api/upload/website-image?${params.toString()}`, {
        method: "DELETE",
      });
    } catch {
      // ignore
    }

    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFiles(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const canAddMore = items.length < maxImages;

  return (
    <div className="w-full">
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
            >
              <div className="relative w-full" style={{ aspectRatio: aspect }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Image ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                #{i + 1}
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                  aria-label="Remove image"
                >
                  <MdOutlineDelete className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && !disabled && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            w-full rounded-xl border-2 border-dashed
            cursor-pointer transition-colors py-6 px-4
            border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50
            ${uploading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm text-slate-500">Uploading…</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-2">
                {items.length === 0 ? (
                  <MdOutlineCloudUpload className="w-5 h-5" />
                ) : (
                  <MdOutlineAdd className="w-5 h-5" />
                )}
              </div>
              <p className="text-sm font-medium text-slate-700 text-center">
                {items.length === 0
                  ? "Click to upload or drag & drop"
                  : `Add more (${items.length}/${maxImages})`}
              </p>
              <p className="mt-1 text-[11px] text-slate-400 text-center">
                JPG, PNG, WEBP · Max {MAX_KB} KB each
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {!canAddMore && !disabled && (
        <p className="text-[11px] text-slate-400 text-center py-2">
          Maximum {maxImages} images reached. Remove one to add another.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-start gap-1">
          <span className="font-bold">!</span>
          {error}
        </p>
      )}
    </div>
  );
}