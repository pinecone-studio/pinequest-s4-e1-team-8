import { AuthShell } from "@/components/auth/auth-shell";
import { DemoLoginForm } from "@/components/auth/demo-login-form";

export default function LoginPage() {
  return (
    <AuthShell>
      <DemoLoginForm />
    </AuthShell>
  );
}
