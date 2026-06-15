"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Mic, Sparkles, Video, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import type { BackgroundEffect, MediaDeviceOption } from "./use-media-preview";

const BACKGROUND_EFFECT_OPTIONS: { label: string; value: BackgroundEffect }[] =
  [
    { label: "No effect", value: "none" },
    { label: "Blur", value: "blur" },
  ];

const PILL_TRIGGER_CLASS =
  "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50";

type LobbyDeviceSelectorRowProps = {
  audioInputDevices: MediaDeviceOption[];
  audioOutputDevices: MediaDeviceOption[];
  backgroundEffect: BackgroundEffect;
  onBackgroundEffectChange: (effect: BackgroundEffect) => void;
  onSelectAudioInputDevice: (deviceId: string | null) => void;
  onSelectAudioOutputDevice: (deviceId: string | null) => void;
  onSelectVideoDevice: (deviceId: string | null) => void;
  selectedAudioInputDeviceId: string | null;
  selectedAudioOutputDeviceId: string | null;
  selectedVideoDeviceId: string | null;
  videoDevices: MediaDeviceOption[];
};

type DevicePickerPillProps = {
  devices: MediaDeviceOption[];
  icon: ReactNode;
  onSelect: (deviceId: string | null) => void;
  selectedId: string | null;
};

function DevicePickerPill({
  devices,
  icon,
  onSelect,
  selectedId,
}: DevicePickerPillProps) {
  const selected = devices.find((device) => device.deviceId === selectedId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={PILL_TRIGGER_CLASS} type="button">
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">
            {selected?.label ?? "System default"}
          </span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onSelect(null)}>
          System default
        </DropdownMenuItem>
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            onClick={() => onSelect(device.deviceId)}
          >
            {device.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LobbyDeviceSelectorRow({
  audioInputDevices,
  audioOutputDevices,
  backgroundEffect,
  onBackgroundEffectChange,
  onSelectAudioInputDevice,
  onSelectAudioOutputDevice,
  onSelectVideoDevice,
  selectedAudioInputDeviceId,
  selectedAudioOutputDeviceId,
  selectedVideoDeviceId,
  videoDevices,
}: LobbyDeviceSelectorRowProps) {
  const backgroundEffectLabel =
    BACKGROUND_EFFECT_OPTIONS.find(
      (option) => option.value === backgroundEffect,
    )?.label ?? "No effect";

  return (
    <div className="flex w-full max-w-xl flex-wrap items-center gap-2">
      <DevicePickerPill
        devices={audioInputDevices}
        icon={<Mic className="size-3.5 shrink-0" />}
        onSelect={onSelectAudioInputDevice}
        selectedId={selectedAudioInputDeviceId}
      />
      <DevicePickerPill
        devices={audioOutputDevices}
        icon={<Volume2 className="size-3.5 shrink-0" />}
        onSelect={onSelectAudioOutputDevice}
        selectedId={selectedAudioOutputDeviceId}
      />
      <DevicePickerPill
        devices={videoDevices}
        icon={<Video className="size-3.5 shrink-0" />}
        onSelect={onSelectVideoDevice}
        selectedId={selectedVideoDeviceId}
      />

      <DropdownMenu>
        <DropdownMenuTrigger className={PILL_TRIGGER_CLASS} type="button">
          <span className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-3.5 shrink-0" />
            <span className="truncate">{backgroundEffectLabel}</span>
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-zinc-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {BACKGROUND_EFFECT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onBackgroundEffectChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
