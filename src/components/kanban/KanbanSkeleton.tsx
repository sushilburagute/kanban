"use client";

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";

type KanbanBoardSkeletonProps = {
  columns: number;
  cardsPerColumn?: number;
};

export function KanbanBoardSkeleton({
  columns,
  cardsPerColumn = 3,
}: KanbanBoardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="flex h-full min-h-[320px] flex-col rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>

          <div className="mt-4 flex flex-1 flex-col gap-3">
            {Array.from({ length: cardsPerColumn }).map((__, cardIndex) => (
              <Skeleton
                key={cardIndex}
                className="h-28 w-full rounded-xl border border-border/60"
              />
            ))}
          </div>

          <Skeleton className="mt-4 h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function KanbanStatsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border/60 bg-muted/40 p-4"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-12" />
        </div>
      ))}
    </div>
  );
}
