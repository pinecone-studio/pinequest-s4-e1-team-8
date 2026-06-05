import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Team Project Dashboard",
  description: "Project management dashboard with schedule and team insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} dark min-h-full font-sans antialiased`}
    >
      <body className="min-h-full font-sans">
        <ClerkProvider appearance={{ theme: shadcn }}>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
