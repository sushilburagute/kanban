# Sequence — Bulk Operation (Delete Board)

> Assumption: “Bulk operations” map to destructive actions that touch multiple stores at
> once. Deleting a board removes both its metadata and all tasks inside a single IndexedDB
> transaction.

```mermaid
sequenceDiagram
    participant U as User
    participant UI as BoardsSidebarSection
    participant Ctx as BoardsProvider
    participant IDB as deleteStoredBoard()

    U->>UI: Confirm "Delete board"
    UI->>Ctx: deleteBoard(boardId)
    Ctx->>IDB: transaction([boards, tasks])<br/>delete(boardId)
    IDB-->>Ctx: success / failure
    alt success
        Ctx->>Ctx: update local state (filter board)
        Ctx-->>UI: true
        UI->>UI: reroute to first board if needed
    else failure
        Ctx-->>UI: false
        UI-->>U: Show validation ("Keep at least one board")
    end
```

- `deleteStoredBoard` is the only place where both object stores are mutated atomically.
