"use client";

import * as React from "react";

export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; the app works without it.
    });
  }, []);

  return null;
}
