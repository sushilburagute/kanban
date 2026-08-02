import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/contexts/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ResponsiveSidebarTrigger } from "@/components/ui/trigger";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { GoogleAnalytics } from "@next/third-parties/google";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Kanban — a signboard for your work",
  description: "A local-first kanban board. No sign-in, no sync, no noise.",
  applicationName: "Kanban",
  appleWebApp: {
    capable: true,
    title: "Kanban",
    statusBarStyle: "default",
  },
};

// Mirrors --background in globals.css for each theme. Keep in lockstep.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6e2dd" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0b0c" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <ResponsiveSidebarTrigger />
            <AppSidebar />
            {children}
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
        <ServiceWorkerRegistration />
        <GoogleAnalytics gaId="G-ZW5YN6VN7L" />
      </body>
    </html>
  );
}
