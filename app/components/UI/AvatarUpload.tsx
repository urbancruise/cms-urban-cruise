"use client";

import { useCallback, useRef, useState } from "react";
import { MdOutlineCloudUpload, MdOutlineDelete, MdOutlineEdit } from "react-icons/md";

interface AvatarUploadProps {
  value?: string | null;
  onChange: (url: string | null, publicId?: string | null) => void;
  name?: string;
  size?: number;
  disabled?: boolean;
}

export default function AvatarUpload({
  value,
  onChange,
  name = "?",
  size = 96,
  disabled = false,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      try {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/avatar", {
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
    [onChange]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;
    if (!confirm("Remove this profile picture?")) return;

    try {
      setUploading(true);
      await fetch(`/api/upload/avatar?url=${encodeURIComponent(value)}`, {
        method: "DELETE",
      });
      onChange(null, null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const initials = name?.trim()?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative group"
        style={{ width: size, height: size }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div
          className={`w-full h-full rounded-full overflow-hidden border-2 transition-all ${
            dragActive ? "border-teal-500 border-dashed scale-105" : "border-slate-200"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
              {initials}
            </div>
          )}
        </div>

        {!disabled && !uploading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            aria-label="Change avatar"
          >
            <div className="text-white text-center">
              <MdOutlineEdit className="w-6 h-6 mx-auto" />
              <p className="text-[10px] mt-1 font-medium">Change</p>
            </div>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {value && !disabled && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
            aria-label="Remove avatar"
            title="Remove avatar"
          >
            <MdOutlineDelete className="w-4 h-4" />
          </button>
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

      {!disabled && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium disabled:opacity-50"
          >
            <MdOutlineCloudUpload className="w-3.5 h-3.5" />
            {value ? "Replace image" : "Upload image"}
          </button>
          <p className="text-[10px] text-slate-400">JPG, PNG, WEBP · Max 5MB</p>
        </div>
      )}

      {error && <p className="text-xs text-red-600 text-center max-w-[200px]">{error}</p>}
    </div>
  );
}
