import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

interface AvatarStackProps {
  users: AppUser[];
  max?: number;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function AvatarStack({
  users,
  max = 4,
  size = "default",
  className,
}: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;

  return (
    <AvatarGroup className={cn(className)}>
      {visible.map((user) => (
        <Avatar key={user.id} size={size} title={user.name}>
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          ) : null}
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? (
        <AvatarGroupCount data-size={size}>+{overflow}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}
