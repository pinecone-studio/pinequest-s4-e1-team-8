"use client";

import { uploadRecording } from "@/app/recordings/api/recordings-api";
import { useEffect, useRef, useState } from "react";

export const MAX_RECORDING_BYTES = 20 * 1024 * 1024;

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

export const formatElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export function useRecordingUploader(onUploaded: (recordingId: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  // Off = raw mic capture; on = browser noise/echo/gain cleanup. Lets you A/B
  // the same voice with and without background noise cancellation.
  const [noiseCleanup, setNoiseCleanup] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const uploadFile = async (
    blob: Blob,
    filename: string,
    title?: string,
    durationSeconds?: number,
  ) => {
    if (blob.size > MAX_RECORDING_BYTES) {
      setError("File is too large. Maximum size is 20MB.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const { recordingId } = await uploadRecording(
        blob,
        filename,
        title,
        durationSeconds,
      );
      onUploaded(recordingId);
    } catch (caughtError) {
      setError((caughtError as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: noiseCleanup,
          echoCancellation: noiseCleanup,
          autoGainControl: noiseCleanup,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const extension = type.includes("ogg") ? "ogg" : "webm";
        const cleanupLabel = noiseCleanup ? "NC on" : "NC off";
        const title = `Recording (${cleanupLabel}) - ${new Date().toLocaleTimeString(
          "en-CA",
        )}`;
        void uploadFile(
          blob,
          `recording-${Date.now()}.${extension}`,
          title,
          elapsedRef.current > 0 ? elapsedRef.current : undefined,
        );
      };

      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      elapsedRef.current = 0;
      timerRef.current = window.setInterval(() => {
        setElapsed((value) => {
          const next = value + 1;
          elapsedRef.current = next;
          return next;
        });
      }, 1000);
    } catch (caughtError) {
      setError(
        caughtError instanceof DOMException
          ? "Microphone access was denied. Allow it in your browser to record."
          : (caughtError as Error).message,
      );
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  return {
    isRecording,
    isUploading,
    elapsed,
    error,
    setError,
    noiseCleanup,
    setNoiseCleanup,
    busy: isUploading,
    startRecording,
    stopRecording,
    uploadFile,
  };
}
