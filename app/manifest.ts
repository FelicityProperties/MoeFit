import type { MetadataRoute } from "next";

// Makes FeliHealth installable ("Add to Home Screen") on iOS/Android as a
// standalone app with its own icon and splash colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FeliHealth",
    short_name: "FeliHealth",
    description:
      "Your AI health coach: weight loss, food control, workouts and daily discipline in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6fc",
    theme_color: "#6d5cf0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
