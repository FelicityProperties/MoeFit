import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MoeFit Command Center",
  description:
    "Your personal life operating system for weight loss, food control, discipline, workouts, and daily structure.",
  applicationName: "MoeFit Command Center",
};

export const viewport: Viewport = {
  themeColor: "#f4f6fc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </StoreProvider>
      </body>
    </html>
  );
}
