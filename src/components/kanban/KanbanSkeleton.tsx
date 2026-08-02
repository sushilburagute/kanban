"use client";

import { Skeleton } from "@/components/ui/skeleton";

type KanbanBoardSkeletonProps = {
  columns?: number;
  cardsPerColumn?: number;
};

export function KanbanBoardSkeleton({ columns = 3, cardsPerColumn = 3 }: KanbanBoardSkeletonProps) {
  return (
    <div className="flex items-start gap-6 overflow-hidden pb-4">
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex w-[300px] shrink-0 flex-col">
          <div className="flex items-center justify-between border-b pb-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-6" />
          </div>
          {/* pl-7 matches the contact-sheet frame-number gutter in
              KanbanColumn, so cards don't shift on hydration. */}
          <div className="flex flex-col gap-2 pl-7 pt-2.5">
            {Array.from({ length: cardsPerColumn }).map((__, cardIndex) => (
              <Skeleton key={cardIndex} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BoardHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-8 w-96 max-w-full" />
    </div>
  );
}
