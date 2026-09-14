import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "FeliHealth — AI health coach for weight loss & discipline",
  description:
    "Track calories, meals, workouts and your daily routine — with an AI coach that knows your day, reads your meal photos, and keeps you honest.",
  applicationName: "FeliHealth",
  openGraph: {
    title: "FeliHealth",
    description:
      "Lose the weight. Keep the discipline. An AI health coach for calories, meals, workouts and routine.",
    type: "website",
    siteName: "FeliHealth",
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
