"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraIcon, MicIcon } from "lucide-react";
import type { MediaDeviceOption } from "./use-media-preview";

const SYSTEM_DEFAULT_DEVICE = "system-default";

type LobbyEntryPanelProps = {
  audioInputDevices: MediaDeviceOption[];
  displayName: string;
  isJoining: boolean;
  onDisplayNameChange: (value: string) => void;
  onJoin: () => void;
  onSelectAudioInputDevice: (deviceId: string | null) => void;
  onSelectVideoDevice: (deviceId: string | null) => void;
  roomCode: string;
  selectedAudioInputDeviceId: string | null;
  selectedVideoDeviceId: string | null;
  videoDevices: MediaDeviceOption[];
};

export function LobbyEntryPanel({
  audioInputDevices,
  displayName,
  isJoining,
  onDisplayNameChange,
  onJoin,
  onSelectAudioInputDevice,
  onSelectVideoDevice,
  roomCode,
  selectedAudioInputDeviceId,
  selectedVideoDeviceId,
  videoDevices,
}: LobbyEntryPanelProps) {
  const cameraItems = [
    { label: "System default", value: SYSTEM_DEFAULT_DEVICE },
    ...videoDevices.map((device) => ({ label: device.label, value: device.deviceId })),
  ];
  const microphoneItems = [
    { label: "System default", value: SYSTEM_DEFAULT_DEVICE },
    ...audioInputDevices.map((device) => ({ label: device.label, value: device.deviceId })),
  ];

  return (
    <div className="flex w-full max-w-sm flex-col justify-center space-y-6 pl-0 md:w-96 md:pl-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Ready to join?</h1>
        <p className="text-sm text-muted-foreground">Room code: {roomCode}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lobby-display-name">Your name</Label>
          <Input
            className="h-11 rounded-xl transition-all duration-200"
            id="lobby-display-name"
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Enter your screen name"
            value={displayName}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-normal text-muted-foreground">Camera</Label>
            <Select
              items={cameraItems}
              onValueChange={(value) =>
                onSelectVideoDevice(value === SYSTEM_DEFAULT_DEVICE ? null : value)
              }
              value={selectedVideoDeviceId ?? SYSTEM_DEFAULT_DEVICE}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs text-muted-foreground transition-all duration-200">
                <CameraIcon className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cameraItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-normal text-muted-foreground">Microphone</Label>
            <Select
              items={microphoneItems}
              onValueChange={(value) =>
                onSelectAudioInputDevice(value === SYSTEM_DEFAULT_DEVICE ? null : value)
              }
              value={selectedAudioInputDeviceId ?? SYSTEM_DEFAULT_DEVICE}
            >
              <SelectTrigger className="h-10 rounded-xl text-xs text-muted-foreground transition-all duration-200">
                <MicIcon className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {microphoneItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button
        className="h-12 w-full rounded-xl text-base transition-all duration-200"
        disabled={!displayName.trim() || isJoining}
        onClick={onJoin}
        type="button"
      >
        {isJoining ? "Joining..." : "Join meeting"}
      </Button>
    </div>
  );
}
