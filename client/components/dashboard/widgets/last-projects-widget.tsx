import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { lastProject } from "@/lib/dashboard/data";
import { ExternalLink } from "lucide-react";

export function LastProjectsWidget() {
  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 py-3">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pb-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Last Projects</CardTitle>
          <Badge variant="secondary">2</Badge>
        </div>
        <Button variant="link" size="sm" className="h-auto gap-1 px-0 text-violet-500">
          View on Figma
          <ExternalLink className="size-3" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-medium">{lastProject.title}</Label>
            <AvatarGroup>
              {lastProject.members.map((member) => (
                <Avatar key={member} size="sm">
                  <AvatarFallback className="bg-violet-600 text-[10px] text-white">
                    {member}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <WireframePreview variant="ui" comments={lastProject.comments} />
            <WireframePreview variant="flow" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WireframePreview({
  variant,
  comments = [],
}: {
  variant: "ui" | "flow";
  comments?: readonly string[];
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50 bg-[#121318] p-2">
      {variant === "ui" ? (
        <div className="grid h-full grid-cols-3 gap-1">
          <div className="col-span-1 rounded bg-muted/30" />
          <div className="col-span-2 space-y-1">
            <div className="h-2 w-2/3 rounded bg-muted/40" />
            <div className="h-full rounded bg-muted/20" />
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="size-3 rounded-full border border-violet-400/50 bg-violet-500/20"
              />
            ))}
          </div>
        </div>
      )}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {comments.map((name) => (
          <span
            key={name}
            className="rounded-full bg-violet-600 px-2 py-0.5 text-[9px] text-white shadow"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
