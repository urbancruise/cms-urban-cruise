"use client";

import { useCallback, useRef, useState } from "react";
import {
  MdOutlineCloudUpload,
  MdOutlineDelete,
  MdOutlineImage,
} from "react-icons/md";

const MAX_KB = 300;
const MAX_BYTES = MAX_KB * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Scope = "hero" | "about" | "vehicle" | "partner" | "editor" | "general";

interface ImageUploadProps {
  value: string | null;
  publicId?: string | null;
  onChange: (url: string | null, publicId?: string | null) => void;
  /** Optional label rendered above the dropzone */
  label?: string;
  /** Optional helper text */
  hint?: string;
  /** Visual style */
  variant?: "default" | "compact";
  /** Cloudinary folder routing */
  scope?: Scope;
  /** Aspect ratio for the preview box (CSS aspect-ratio value) */
  aspect?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  publicId,
  onChange,
  label,
  hint = "JPG, PNG, WEBP · Max 300 KB",
  variant = "default",
  scope = "general",
  aspect = "16 / 9",
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // VALIDATION
  // ============================================================
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

  // ============================================================
  // UPLOAD
  // ============================================================
  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("scope", scope);
        if (publicId) formData.append("oldPublicId", publicId);

        const res = await fetch("/api/upload/website-image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onChange(data.url, data.publicId);
      } catch (err: any) {
        setError(err.message || "Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onChange, publicId, scope]
  );

  // ============================================================
  // REMOVE
  // ============================================================
  const handleRemove = async () => {
    if (!value) return;
    if (!confirm("Remove this image?")) return;

    try {
      setUploading(true);
      const params = new URLSearchParams();
      if (publicId) params.set("publicId", publicId);
      else params.set("url", value);

      await fetch(`/api/upload/website-image?${params.toString()}`, {
        method: "DELETE",
      });
      onChange(null, null);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // ============================================================
  // INPUT / DRAG HANDLERS
  // ============================================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const openPicker = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  // ============================================================
  // RENDER
  // ============================================================
  const isCompact = variant === "compact";

  return (
    <div className="w-full">
      {label && (
        <span className="block text-xs font-medium text-slate-700 mb-1.5">
          {label}
        </span>
      )}

      {/* ====================================================
          HAS VALUE — show preview
      ==================================================== */}
      {value ? (
        <div
          className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group ${
            isCompact ? "max-w-[240px]" : ""
          }`}
        >
          <div
            className="relative w-full"
            style={{ aspectRatio: aspect }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Hover overlay */}
            {!disabled && !uploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openPicker}
                  className="px-3 py-2 bg-white text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <MdOutlineCloudUpload className="w-4 h-4" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5"
                >
                  <MdOutlineDelete className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Filename / URL info bar */}
          <div className="px-3 py-2 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400 truncate font-mono">
              {value}
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-600 flex-shrink-0"
                title="Remove"
                aria-label="Remove image"
              >
                <MdOutlineDelete className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        // ====================================================
        // NO VALUE — dropzone
        // ====================================================
        <div
          onClick={openPicker}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            w-full rounded-xl border-2 border-dashed
            cursor-pointer transition-colors
            ${isCompact ? "py-6 px-4" : "py-10 px-6"}
            ${
              dragActive
                ? "border-teal-500 bg-teal-50"
                : "border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50"
            }
            ${uploading || disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          {uploading ? (
            <>
              <div className="w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">Uploading…</p>
            </>
          ) : (
            <>
              <div
                className={`flex items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-3 ${
                  isCompact ? "w-10 h-10" : "w-12 h-12"
                }`}
              >
                {dragActive ? (
                  <MdOutlineImage className={isCompact ? "w-5 h-5" : "w-6 h-6"} />
                ) : (
                  <MdOutlineCloudUpload
                    className={isCompact ? "w-5 h-5" : "w-6 h-6"}
                  />
                )}
              </div>

              <p
                className={`font-medium text-slate-700 text-center ${
                  isCompact ? "text-xs" : "text-sm"
                }`}
              >
                {dragActive
                  ? "Drop image here"
                  : "Click to upload or drag & drop"}
              </p>

              {hint && (
                <p className="mt-1 text-[11px] text-slate-400 text-center">
                  {hint}
                </p>
              )}
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-start gap-1">
          <span className="font-bold">!</span>
          {error}
        </p>
      )}
    </div>
  );
}