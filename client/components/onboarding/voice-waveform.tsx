"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const IDLE_WAVE_AMPLITUDE = 0.05;
const IDLE_WAVE_FREQUENCY = 0.02;
const IDLE_WAVE_SPEED = 0.05;
const WAVE_LINE_WIDTH = 2.5;
const ACTIVE_PEAK_SCALE = 0.95;
const FALLBACK_WAVEFORM_COLOR = "#f4734b";

type VoiceWaveformProps = {
  dataRef: { current: Uint8Array<ArrayBuffer> };
  active: boolean;
  className?: string;
};

function resolveWaveformColor(): string {
  if (typeof window === "undefined") {
    return FALLBACK_WAVEFORM_COLOR;
  }

  const coralValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--coral")
    .trim();

  return coralValue.length > 0 ? coralValue : FALLBACK_WAVEFORM_COLOR;
}

export function VoiceWaveform({ dataRef, active, className }: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const waveformColor = resolveWaveformColor();
    let animationFrame = 0;
    let idlePhase = 0;

    const resizeCanvas = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const drawActiveWaveform = (width: number, height: number) => {
      const samples = dataRef.current;
      const midpoint = height / 2;
      const sliceWidth = width / Math.max(1, samples.length - 1);

      context.beginPath();
      for (let index = 0; index < samples.length; index += 1) {
        const normalized = (samples[index] - 128) / 128;
        const x = index * sliceWidth;
        const y = midpoint + normalized * midpoint * ACTIVE_PEAK_SCALE;

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    };

    const drawIdleWaveform = (width: number, height: number) => {
      const midpoint = height / 2;
      const amplitude = height * IDLE_WAVE_AMPLITUDE;

      context.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y = midpoint + Math.sin(x * IDLE_WAVE_FREQUENCY + idlePhase) * amplitude;

        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
      idlePhase += IDLE_WAVE_SPEED;
    };

    const render = () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const width = canvas.width / devicePixelRatio;
      const height = canvas.height / devicePixelRatio;

      context.clearRect(0, 0, width, height);
      context.lineWidth = WAVE_LINE_WIDTH;
      context.strokeStyle = waveformColor;
      context.lineJoin = "round";
      context.lineCap = "round";

      if (active && dataRef.current.length > 0) {
        drawActiveWaveform(width, height);
      } else {
        drawIdleWaveform(width, height);
      }

      animationFrame = requestAnimationFrame(render);
    };

    resizeCanvas();
    render();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [active, dataRef]);

  return <canvas ref={canvasRef} className={cn("h-20 w-full", className)} />;
}
