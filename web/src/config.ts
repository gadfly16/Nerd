// Config - GUI configuration data structures

// OpenState tracks both the open/closed state and preferred depth
export interface OpenState {
  open: boolean // Whether node is expanded
  depth: number // Preferred depth when open (0 = neutral, -1 = infinite, >0 = N levels)
}

// Vertigo configures a single Vertigo instance
export class Vertigo {
  rootID!: number // Node ID to start rendering from
  openMap!: { [nodeId: number]: OpenState } // Node ID -> open state and depth
}

// BoardConfig holds configuration for all Vertigo trees on a board
export class Board {
  branches!: Vertigo[]
}

// WorkbenchConfig holds configuration for all boards in the workbench
export class Workbench {
  boards!: Board[]
}

// Default workbench configuration
export const defaultWorkbench: Workbench = {
  boards: [
    {
      branches: [
        {
          rootID: 0, // GUI display root (user node for non-admin)
          openMap: { 0: { open: true, depth: 2 } }, // Open 2 levels deep
        },
      ],
    },
    {
      branches: [
        {
          rootID: 0, // GUI display root (user node for non-admin)
          openMap: { 0: { open: true, depth: 2 } }, // Open 3 levels deep
        },
        {
          rootID: 0, // GUI display root (user node for non-admin)
          openMap: { 0: { open: true, depth: 2 } }, // Open 2 levels deep
        },
      ],
    },
  ],
}
