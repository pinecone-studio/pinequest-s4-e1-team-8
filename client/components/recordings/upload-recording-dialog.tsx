"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { PROCESSING_STAGES, completeRecording, runProcessingStages } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import type { ProcessingStage, Recording } from "@/types";
import { CheckCircle2Icon, FileAudioIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

const STAGE_LABELS: Record<ProcessingStage, string> = {
  uploading: "Uploading recording",
  "noise-canceling": "Reducing background noise",
  transcribing: "Transcribing speech",
  summarizing: "Generating AI summary",
};

type UploadRecordingDialogProps = {
  onUploaded: (recording: Recording) => void;
};

export function UploadRecordingDialog({ onUploaded }: UploadRecordingDialogProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<ProcessingStage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetForm = () => {
    setTitle("");
    setStage(null);
    setIsProcessing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || isProcessing) return;

    setIsProcessing(true);
    for await (const nextStage of runProcessingStages(700)) {
      setStage(nextStage);
    }

    const recording = await completeRecording({ title: title.trim(), source: "upload" });
    onUploaded(recording);
    toast.add({
      title: "Recording ready",
      description: `${recording.title} has been transcribed and summarized.`,
      type: "success",
    });
    setOpen(false);
    resetForm();
  };

  const stageIndex = stage ? PROCESSING_STAGES.indexOf(stage) : -1;
  const progressValue = stage ? ((stageIndex + 1) / PROCESSING_STAGES.length) * 100 : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isProcessing) return;
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <UploadIcon />
            Upload recording
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md" showCloseButton={!isProcessing}>
        <DialogHeader>
          <DialogTitle>Upload a recording</DialogTitle>
          <DialogDescription>Add an existing recording for AI transcription and summary.</DialogDescription>
        </DialogHeader>

        {!isProcessing ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recording-title">Title</Label>
              <Input
                id="recording-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Client kickoff call"
                required
              />
            </div>

            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
              <FileAudioIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">recording.m4a</p>
              <p className="text-xs text-muted-foreground">42 MB · Ready to process</p>
            </div>

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={!title.trim()}>
                <UploadIcon />
                Upload &amp; process
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <Progress value={progressValue}>
              <div className="flex items-center justify-between">
                <ProgressLabel>{stage ? STAGE_LABELS[stage] : "Starting..."}</ProgressLabel>
                <ProgressValue />
              </div>
            </Progress>

            <ul className="flex flex-col gap-2">
              {PROCESSING_STAGES.map((processingStage, index) => (
                <li key={processingStage} className="flex items-center gap-2 text-sm">
                  {index < stageIndex ? (
                    <CheckCircle2Icon className="size-4 text-sage-foreground" />
                  ) : index === stageIndex ? (
                    <Loader2Icon className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-border" />
                  )}
                  <span className={cn(index === stageIndex ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {STAGE_LABELS[processingStage]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
