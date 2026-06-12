import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import type { AppUser } from "@/types";

export function ParticipantAvatars({ participants }: { participants: AppUser[] }) {
  return (
    <AvatarGroup>
      {participants.slice(0, 3).map((participant) => (
        <Avatar key={participant.id} size="sm">
          <AvatarFallback>{participant.initials}</AvatarFallback>
        </Avatar>
      ))}
      {participants.length > 3 ? (
        <AvatarGroupCount>+{participants.length - 3}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}
