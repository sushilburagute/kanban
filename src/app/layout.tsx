import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/contexts/ThemeProvider";
import { BoardsProvider } from "@/components/contexts/BoardsProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { ResponsiveSidebarTrigger } from "@/components/ui/trigger";
import { GoogleAnalytics } from "@next/third-parties/google";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban",
  description: "The world's cleanest kanban board.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BoardsProvider>
            <SidebarProvider>
              <ResponsiveSidebarTrigger />
              <AppSidebar />
              {children}
            </SidebarProvider>
          </BoardsProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-ZW5YN6VN7L" />
      </body>
    </html>
  );
}
