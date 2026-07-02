# Sequence — Stats View Load

```mermaid
sequenceDiagram
    participant U as User
    participant Page as app/stats/page.tsx
    participant Boards as useBoards()
    participant IDB as readStoredTasks()

    U->>Page: Navigate to /stats
    Page->>Boards: get boards[]
    loop for each board
        Page->>IDB: readStoredTasks(boardId)
        alt tasks found
            IDB-->>Page: KanbanTask[]
            Page->>Page: normalizeTaskOrder + bucket by status
        else legacy seed
            Page->>Page: createSeedTasks()
            Page->>IDB: writeStoredTasks(boardId, seed)
        end
    end
    Page->>Page: aggregate totals + lastUpdated
    Page-->>U: Render MetricCard + BoardCard grids
```

- The stats route serially iterates boards; latency grows linearly with board count because there is no Promise.all batching.
- Page stay client-side, reusing the same IndexedDB helpers as the board view for consistency.
