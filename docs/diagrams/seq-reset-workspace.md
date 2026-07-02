# Sequence — Reset Workspace

```mermaid
sequenceDiagram
    participant U as User
    participant Sidebar as AppSidebar Reset Dialog
    participant Ctx as BoardsProvider
    participant IDB as clearAllStoredData()

    U->>Sidebar: Click "Reset workspace"
    Sidebar->>Ctx: resetBoards()
    Ctx->>IDB: clear(objectStore["boards","tasks"])
    IDB-->>Ctx: oncomplete
    Ctx->>Ctx: setBoards([])
    Ctx-->>Sidebar: resolved
    Sidebar-->>U: Dialog closes; router.push("/")
```

- Workspace reset is destructive and synchronous from the UI’s perspective; there is no undo/redo.
- After clearing IndexedDB, all routes rely on reseeding logic (default board) when reloaded.
