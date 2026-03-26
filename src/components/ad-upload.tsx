"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Film, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function AdUpload({ onFileSelect, selectedFile, onClear }: AdUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      onFileSelect(file);
      if (file.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
      "video/*": [".mp4", ".mov", ".avi", ".webm"],
    },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024, // 200MB
  });

  if (selectedFile) {
    return (
      <div className="relative rounded-xl border border-[#1E2530] bg-[#0F1117] p-4">
        <button
          onClick={() => { onClear(); setPreview(null); }}
          className="absolute right-3 top-3 rounded-md p-1 text-[#5A6478] hover:bg-[#1E2530] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#1E2530]">
              <Film className="h-8 w-8 text-[#5A6478]" />
            </div>
          )}
          <div>
            <p className="font-medium text-white">{selectedFile.name}</p>
            <p className="mt-0.5 text-sm text-[#5A6478]">
              {selectedFile.type.startsWith("video/") ? "Video" : "Image"} ·{" "}
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-green-400">Ready to analyze</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative cursor-pointer rounded-xl border-2 border-dashed transition-all",
        isDragActive
          ? "border-[#FCD202] bg-[#FCD202]/5"
          : "border-[#1E2530] bg-[#0F1117] hover:border-[#2A3140] hover:bg-[#161B24]"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
        <div className={cn(
          "mb-4 rounded-2xl p-4 transition-colors",
          isDragActive ? "bg-[#FCD202]/15" : "bg-[#1E2530] group-hover:bg-[#2A3140]"
        )}>
          <Upload className={cn(
            "h-7 w-7 transition-colors",
            isDragActive ? "text-[#FCD202]" : "text-[#5A6478] group-hover:text-[#8693A8]"
          )} />
        </div>
        {isDragActive ? (
          <p className="text-base font-semibold text-[#FCD202]">Drop your ad here</p>
        ) : (
          <>
            <p className="text-base font-semibold text-white">
              Drag & drop your creative
            </p>
            <p className="mt-1 text-sm text-[#5A6478]">
              or <span className="text-[#FCD202] underline-offset-2 hover:underline">browse files</span>
            </p>
          </>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-[#5A6478]">
          <div className="flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5" />
            <span>MP4, MOV, AVI</span>
          </div>
          <div className="h-3 w-px bg-[#1E2530]" />
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>JPG, PNG, GIF</span>
          </div>
          <div className="h-3 w-px bg-[#1E2530]" />
          <span>Max 200MB</span>
        </div>
      </div>
    </div>
  );
}
