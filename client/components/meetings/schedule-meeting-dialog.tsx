"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { TODAY, formatMeetingDate } from "@/lib/meetings/format";
import { scheduleMeeting } from "@/lib/mock-api";
import { currentUser, users } from "@/lib/mock-data";
import type { Meeting } from "@/types";
import { CalendarPlusIcon, Loader2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";

const inviteableUsers = users.filter((user) => user.id !== currentUser.id);

type ScheduleMeetingDialogProps = {
  onScheduled: (meeting: Meeting) => void;
};

export function ScheduleMeetingDialog({ onScheduled }: ScheduleMeetingDialogProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(TODAY);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [description, setDescription] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [recordAndSummarize, setRecordAndSummarize] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleParticipant = (id: string) => {
    setParticipantIds((current) =>
      current.includes(id) ? current.filter((participantId) => participantId !== id) : [...current, id]
    );
  };

  const resetForm = () => {
    setTitle("");
    setDate(TODAY);
    setStartTime("10:00");
    setEndTime("11:00");
    setDescription("");
    setParticipantIds([]);
    setAutoTranslate(true);
    setRecordAndSummarize(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const meeting = await scheduleMeeting({
        title: title.trim(),
        date,
        startTime,
        endTime,
        participantIds,
        autoTranslate,
        recordAndSummarize,
        description: description.trim() || undefined,
      });

      onScheduled(meeting);
      toast.add({
        title: "Meeting scheduled",
        description: `${meeting.title} · ${formatMeetingDate(meeting.date)} at ${meeting.startTime}`,
        type: "success",
      });
      setOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <CalendarPlusIcon />
            Schedule meeting
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>Set up a new meeting and invite your team.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Weekly sync"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-date">Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-start">Start</Label>
              <Input
                id="meeting-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-end">End</Label>
              <Input
                id="meeting-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-description">Description</Label>
            <Textarea
              id="meeting-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What's this meeting about?"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Participants</Label>
            <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-1.5">
              {inviteableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={participantIds.includes(user.id)}
                    onCheckedChange={() => toggleParticipant(user.id)}
                  />
                  <Avatar size="sm">
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.role}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-translate captions</p>
                <p className="text-xs text-muted-foreground">
                  Live Mongolian ⇄ English captions during the call.
                </p>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={(checked) => setAutoTranslate(checked)}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Record &amp; summarize</p>
                <p className="text-xs text-muted-foreground">
                  Save a recording and generate an AI summary afterwards.
                </p>
              </div>
              <Switch
                checked={recordAndSummarize}
                onCheckedChange={(checked) => setRecordAndSummarize(checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : <CalendarPlusIcon />}
              Schedule meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
