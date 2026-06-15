"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

export type BackgroundEffect = "blur" | "none";

const AUDIO_LEVEL_INTERVAL_MS = 100;
const AUDIO_LEVEL_GAIN = 4;

const PERMISSION_DENIED_CAMERA_ERROR =
  "Camera access was denied. Update your browser permissions to continue.";
const PERMISSION_DENIED_MICROPHONE_ERROR =
  "Microphone access was denied. Update your browser permissions to continue.";
const UNAVAILABLE_CAMERA_ERROR = "We couldn't access your camera.";
const UNAVAILABLE_MICROPHONE_ERROR = "We couldn't access your microphone.";
const UNSUPPORTED_CAMERA_ERROR = "Camera access isn't supported in this browser.";
const UNSUPPORTED_MICROPHONE_ERROR = "Microphone access isn't supported in this browser.";

const isMediaDevicesSupported = () =>
  typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

const toDeviceOptions = (devices: MediaDeviceInfo[], kind: MediaDeviceKind, fallbackLabel: string) =>
  devices
    .filter((device) => device.kind === kind && device.deviceId)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${fallbackLabel} ${index + 1}`,
    }));

export const useMediaPreview = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelTimerRef = useRef<number | null>(null);

  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceOption[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(null);
  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState<string | null>(null);
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string | null>(
    null,
  );
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffect>("none");
  const [isMirrored, setIsMirrored] = useState(true);

  const refreshDevices = useCallback(async () => {
    if (!isMediaDevicesSupported()) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = toDeviceOptions(devices, "videoinput", "Camera");
    const microphones = toDeviceOptions(devices, "audioinput", "Microphone");
    const speakers = toDeviceOptions(devices, "audiooutput", "Speaker");

    setVideoDevices(cameras);
    setAudioInputDevices(microphones);
    setAudioOutputDevices(speakers);
    setSelectedVideoDeviceId((current) => current ?? cameras[0]?.deviceId ?? null);
    setSelectedAudioInputDeviceId((current) => current ?? microphones[0]?.deviceId ?? null);
    setSelectedAudioOutputDeviceId((current) => current ?? speakers[0]?.deviceId ?? null);
  }, []);

  useEffect(() => {
    void refreshDevices();

    if (!isMediaDevicesSupported()) return;

    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  const stopVideoStream = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (audioLevelTimerRef.current !== null) {
      window.clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }

    analyserRef.current?.disconnect();
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  const stopAudioStream = useCallback(() => {
    stopAudioAnalysis();
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }, [stopAudioAnalysis]);

  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const sampleData = new Uint8Array(analyser.frequencyBinCount);

    audioLevelTimerRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(sampleData);

      let sumOfSquares = 0;
      for (let index = 0; index < sampleData.length; index += 1) {
        const normalized = (sampleData[index] - 128) / 128;
        sumOfSquares += normalized * normalized;
      }

      const rootMeanSquare = Math.sqrt(sumOfSquares / sampleData.length);
      setAudioLevel(Math.min(1, rootMeanSquare * AUDIO_LEVEL_GAIN));
    }, AUDIO_LEVEL_INTERVAL_MS);
  }, []);

  const enableCamera = useCallback(
    async (deviceId?: string | null) => {
      if (!isMediaDevicesSupported()) {
        setCameraError(UNSUPPORTED_CAMERA_ERROR);
        return;
      }

      setCameraError(null);

      try {
        stopVideoStream();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });

        videoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        setHasCamPermission(true);
        setIsCamActive(true);
        void refreshDevices();
      } catch (caughtError) {
        setIsCamActive(false);
        setHasCamPermission(
          caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
            ? false
            : hasCamPermission,
        );
        setCameraError(
          caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
            ? PERMISSION_DENIED_CAMERA_ERROR
            : UNAVAILABLE_CAMERA_ERROR,
        );
      }
    },
    [hasCamPermission, refreshDevices, stopVideoStream],
  );

  const enableMicrophone = useCallback(
    async (deviceId?: string | null) => {
      if (!isMediaDevicesSupported()) {
        setMicrophoneError(UNSUPPORTED_MICROPHONE_ERROR);
        return;
      }

      setMicrophoneError(null);

      try {
        stopAudioStream();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });

        audioStreamRef.current = stream;
        startAudioAnalysis(stream);

        setHasMicPermission(true);
        setIsMicActive(true);
        void refreshDevices();
      } catch (caughtError) {
        setIsMicActive(false);
        setHasMicPermission(
          caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
            ? false
            : hasMicPermission,
        );
        setMicrophoneError(
          caughtError instanceof DOMException && caughtError.name === "NotAllowedError"
            ? PERMISSION_DENIED_MICROPHONE_ERROR
            : UNAVAILABLE_MICROPHONE_ERROR,
        );
      }
    },
    [hasMicPermission, refreshDevices, startAudioAnalysis, stopAudioStream],
  );

  const toggleCamera = useCallback(() => {
    if (isCamActive) {
      stopVideoStream();
      setIsCamActive(false);
      return;
    }

    void enableCamera(selectedVideoDeviceId);
  }, [enableCamera, isCamActive, selectedVideoDeviceId, stopVideoStream]);

  const toggleMicrophone = useCallback(() => {
    if (isMicActive) {
      stopAudioStream();
      setIsMicActive(false);
      return;
    }

    void enableMicrophone(selectedAudioInputDeviceId);
  }, [enableMicrophone, isMicActive, selectedAudioInputDeviceId, stopAudioStream]);

  const selectVideoDevice = useCallback(
    (deviceId: string | null) => {
      setSelectedVideoDeviceId(deviceId);
      if (isCamActive) void enableCamera(deviceId);
    },
    [enableCamera, isCamActive],
  );

  const selectAudioInputDevice = useCallback(
    (deviceId: string | null) => {
      setSelectedAudioInputDeviceId(deviceId);
      if (isMicActive) void enableMicrophone(deviceId);
    },
    [enableMicrophone, isMicActive],
  );

  const selectAudioOutputDevice = useCallback((deviceId: string | null) => {
    setSelectedAudioOutputDeviceId(deviceId);
  }, []);

  const toggleMirror = useCallback(() => {
    setIsMirrored((current) => !current);
  }, []);

  useEffect(
    () => () => {
      stopVideoStream();
      stopAudioStream();
    },
    [stopAudioStream, stopVideoStream],
  );

  return {
    audioInputDevices,
    audioLevel,
    audioOutputDevices,
    backgroundEffect,
    cameraError,
    hasCamPermission,
    hasMicPermission,
    isCamActive,
    isMicActive,
    isMirrored,
    microphoneError,
    selectAudioInputDevice,
    selectAudioOutputDevice,
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    selectedVideoDeviceId,
    selectVideoDevice,
    setBackgroundEffect,
    toggleCamera,
    toggleMicrophone,
    toggleMirror,
    videoDevices,
    videoRef,
  };
};
