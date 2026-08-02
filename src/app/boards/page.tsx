"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import BoardPage from "./[boardId]/page";
import { useWorkspaceHydration } from "@/hooks/use-workspace";
import { useWorkspaceStore } from "@/store/workspace";

/** /boards — jump to the first board, or show the empty-workspace state. */
export default function BoardsIndexPage() {
  const router = useRouter();
  const hydrated = useWorkspaceHydration();
  const boards = useWorkspaceStore((state) => state.boards);

  React.useEffect(() => {
    if (hydrated && boards.length > 0) {
      router.replace(`/boards/${boards[0].id}`);
    }
  }, [hydrated, boards, router]);

  // Reuses the board page's loading and empty states.
  return <BoardPage />;
}
