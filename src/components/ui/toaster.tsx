"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

/**
 * Sonner defaults to its light theme no matter what the app is doing, which
 * renders a white toast on the safelight palette. Follow next-themes so the
 * toaster picks the right side, and let the [data-sonner-toaster] custom
 * property overrides in globals.css supply our own warm-neutral surface —
 * sonner's own dark theme is pure #000 on neutral grey, a second hue family.
 *
 * `richColors` stays off deliberately: it injects a success-green and an
 * error-red, the only two things that would break the one-hue rule.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    />
  );
}
