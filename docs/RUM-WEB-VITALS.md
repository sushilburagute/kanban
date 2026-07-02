# RUM + Web Vitals Capture Plan

## Goals
- Measure **LCP**, **INP**, and **CLS** on every route transition.
- Send metrics to both Google Analytics (for directional dashboards) and a lightweight first-party endpoint for long-term storage/alerting.
- Annotate samples with board/task context (e.g., task count) without sending PII.

## Instrumentation Snippet

Add the following Next.js entrypoint (e.g., `src/app/rum-client.ts`) and import it from `src/app/layout.tsx` on the client. It leverages the built-in `reportWebVitals` hook plus GA’s `gtag`.

```ts
// src/app/rum-client.ts
import type { NextWebVitalsMetric } from "next/app";
import { onCLS, onINP, onLCP } from "web-vitals";

type RumMetric = NextWebVitalsMetric & {
  boardCount?: number;
  taskCount?: number;
};

const VITALS: Array<(cb: (metric: RumMetric) => void) => void> = [onLCP, onINP, onCLS];

export function initWebVitals(getContext?: () => { boardCount?: number; taskCount?: number }) {
  const sink = async (metric: RumMetric) => {
    const context = getContext?.() ?? {};
    const payload: RumMetric = { ...metric, ...context };

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", metric.name, {
        value: metric.value,
        event_category: "Web Vitals",
        event_label: metric.label,
        metric_id: metric.id,
        board_count: context.boardCount,
        task_count: context.taskCount,
      });
    }

    await fetch("/api/rum", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  VITALS.forEach((subscribe) =>
    subscribe((metric) => {
      void sink(metric as RumMetric);
    })
  );
}
```

Wire it up inside a client component (e.g., `ResponsiveSidebarTrigger` or a new `MetricsBootstrapper`) to pass contextual counts from `useBoards`.

```tsx
"use client";
import { useEffect } from "react";
import { initWebVitals } from "@/app/rum-client";
import { useBoards } from "@/components/contexts/BoardsProvider";

export function RumBridge() {
  const { boards } = useBoards();

  useEffect(() => {
    initWebVitals(() => ({
      boardCount: boards.length,
      taskCount: undefined, // could be derived from stats cache later
    }));
  }, [boards.length]);

  return null;
}
```

## Payload Schema

| Field        | Type    | Notes                                        |
|--------------|---------|----------------------------------------------|
| `id`         | string  | Unique metric sample ID from Next.js         |
| `name`       | enum    | `LCP`, `INP`, `CLS`                          |
| `value`      | number  | Raw value (ms for LCP/INP, unitless for CLS) |
| `label`      | string  | `web-vital` / `custom`                       |
| `delta`      | number  | Difference since last report                 |
| `startTime`  | number  | When the metric was observed                 |
| `boardCount` | number? | Optional context for segmentation            |
| `taskCount`  | number? | Future: attach board size buckets            |
| `path`       | string  | Add server-side in `/api/rum`                |

## Thresholds & Playbook

| Metric | Target      | Degradation Response                                       |
|--------|-------------|-------------------------------------------------------------|
| LCP    | < 2.5 s P75 | Audit hero images, prefetch board data, reduce blocking JS.|
| INP    | < 200 ms    | Instrument drag/drop handlers, memoize props, throttle writes. |
| CLS    | < 0.1       | Lock skeleton heights, avoid font reflows, preload icons.  |

Escalate when any metric exceeds threshold for 3 consecutive deploys:
1. Review `/api/rum` logs + GA segments to isolate board size/device.
2. Capture Chrome traces on representative hardware.
3. Create perf bug with reproduction + suspected component.
