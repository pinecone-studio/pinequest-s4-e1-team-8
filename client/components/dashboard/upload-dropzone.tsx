"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UploadDropzone() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setFiles((current) => [...current, ...Array.from(incoming)]);
  };

  const removeFile = (index: number) => {
    setFiles((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  const handleSubmit = () => {
    toast.add({
      title: "Processing isn't available yet",
      description: "File summarization is coming soon to Brisk.",
      type: "info",
    });
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-[164px] flex-col gap-3 rounded-xl border border-dashed p-5 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-white/10 bg-elevated hover:border-white/20",
      )}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        addFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex flex-1 flex-col items-center justify-center gap-2 py-4"
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UploadIcon className="size-5" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            Upload files for summary
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop audio or video, or click to browse.
          </p>
        </div>
      </button>

      {files.length > 0 ? (
        <div className="flex flex-col gap-2 text-left">
          <AnimatePresence initial={false}>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${file.lastModified}-${index}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 rounded-lg bg-inset px-3 py-2"
              >
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Remove ${file.name}`}
                >
                  <XIcon className="size-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button onClick={handleSubmit} className="mt-1 w-full">
            Summarize {files.length} {files.length === 1 ? "file" : "files"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
