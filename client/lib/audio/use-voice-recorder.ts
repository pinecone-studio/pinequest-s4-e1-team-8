"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MicrophonePermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported";

const RECORDING_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const ELAPSED_TICK_MS = 100;
const LEVEL_SMOOTHING = 4;
const ANALYSER_FFT_SIZE = 1024;

function pickSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  return (
    RECORDING_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ??
    "audio/webm"
  );
}

export function useVoiceRecorder() {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const waveformDataRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));
  const levelFrameRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);

  const stopLevelMonitor = useCallback(() => {
    if (levelFrameRef.current !== null) {
      cancelAnimationFrame(levelFrameRef.current);
      levelFrameRef.current = null;
    }
    setAudioLevel(0);
    setIsMonitoring(false);
  }, []);

  const startLevelMonitor = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      return;
    }

    waveformDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    setIsMonitoring(true);

    const tick = () => {
      const buffer = waveformDataRef.current;
      analyser.getByteTimeDomainData(buffer);

      let sumOfSquares = 0;
      for (const value of buffer) {
        const normalized = (value - 128) / 128;
        sumOfSquares += normalized * normalized;
      }

      const rootMeanSquare = Math.sqrt(sumOfSquares / buffer.length);
      setAudioLevel(Math.min(1, rootMeanSquare * LEVEL_SMOOTHING));
      levelFrameRef.current = requestAnimationFrame(tick);
    };

    levelFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopLevelMonitor();
    stopElapsedTimer();

    analyserRef.current?.disconnect();
    analyserRef.current = null;
    waveformDataRef.current = new Uint8Array(0);

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, [stopElapsedTimer, stopLevelMonitor]);

  useEffect(() => {
    return () => {
      releaseStream();
    };
  }, [releaseStream]);

  const requestMicrophoneAccess = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      setErrorMessage("This browser does not support microphone recording.");
      return false;
    }

    setPermissionState("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (AudioContextClass) {
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        startLevelMonitor();
      }

      mimeTypeRef.current = pickSupportedMimeType();
      setPermissionState("granted");
      return true;
    } catch {
      setPermissionState("denied");
      setErrorMessage("Microphone access was denied. Allow access to continue.");
      return false;
    }
  }, [startLevelMonitor]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || isRecording) {
      return;
    }

    setAudioBlob(null);
    setErrorMessage(null);
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      chunksRef.current = [];
      setAudioBlob(blob);
    };

    recorderRef.current = recorder;
    recorder.start();

    recordingStartRef.current = Date.now();
    setElapsedMs(0);
    setIsRecording(true);

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - recordingStartRef.current);
    }, ELAPSED_TICK_MS);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    setIsRecording(false);
    stopElapsedTimer();
  }, [stopElapsedTimer]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setElapsedMs(0);
    setErrorMessage(null);
  }, []);

  return {
    permissionState,
    isRecording,
    isMonitoring,
    elapsedMs,
    audioLevel,
    audioBlob,
    errorMessage,
    waveformDataRef,
    requestMicrophoneAccess,
    startRecording,
    stopRecording,
    resetRecording,
    releaseStream,
  };
}
