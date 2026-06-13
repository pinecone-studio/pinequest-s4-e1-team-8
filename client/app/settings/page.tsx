import { VoiceVerificationForm } from "@/components/auth/voice-verification-form";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Brisk account and meeting preferences.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="py-2">
          <VoiceVerificationForm variant="embedded" />
        </CardContent>
      </Card>
    </div>
  );
}
