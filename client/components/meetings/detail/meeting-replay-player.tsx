"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPlaybackTime } from "@/lib/meetings/meeting-clock";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import {
  Maximize2Icon,
  Minimize2Icon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type MeetingReplayPlayerProps = {
  participants: AppUser[];
  audioUrl: string | null;
};

export const MeetingReplayPlayer = ({ participants, audioUrl }: MeetingReplayPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void container.requestFullscreen();
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Number(event.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const tiles = participants.slice(0, 4);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-inset ring-foreground/5",
        isFullscreen && "flex aspect-auto h-full items-center justify-center",
      )}
    >
      <div
        className={cn(
          "grid h-full w-full gap-0.5 bg-zinc-950 p-0.5",
          tiles.length <= 1 ? "grid-cols-1" : "grid-cols-2 auto-rows-fr",
        )}
      >
        {tiles.map((user) => (
          <div
            key={user.id}
            className="relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900"
          >
            <Avatar className="size-16">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
              <AvatarFallback className="bg-white/10 text-2xl font-semibold text-white">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {user.name}
            </span>
          </div>
        ))}
        {tiles.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-zinc-500">
            No participants to display
          </div>
        ) : null}
      </div>

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          className="hidden"
        />
      ) : null}

      {!audioUrl ? (
        <div className="absolute top-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Replay unavailable
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-black/30 p-3 backdrop-blur-md transition-all duration-200">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={!audioUrl}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white disabled:cursor-not-allowed disabled:opacity-40 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={!audioUrl}
              className="flex size-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 disabled:opacity-40"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
            </button>
            <span className="text-xs font-medium text-white/80 tabular-nums">
              {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              disabled={!audioUrl}
              className="flex size-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10 disabled:opacity-40"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeXIcon className="size-4" /> : <Volume2Icon className="size-4" />}
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10"
              aria-label="Playback settings"
            >
              <SettingsIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex size-8 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/10"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
