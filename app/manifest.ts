import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gameplan",
    short_name: "Gameplan",
    description: "We build, back and accelerate ambitious ideas that challenge the ordinary, push boundaries and shape what's next.",
    start_url: "/en",
    display: "standalone",
    background_color: "#101d2b",
    theme_color: "#101d2b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
