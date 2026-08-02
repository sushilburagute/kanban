import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kanban",
    short_name: "Kanban",
    description: "A local-first kanban board. No sign-in, no sync, no noise.",
    start_url: "/boards",
    display: "standalone",
    // Dark is the default theme, so the installed app opens into the
    // safelight room. Both mirror --background in .dark.
    background_color: "#0d0b0c",
    theme_color: "#0d0b0c",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
