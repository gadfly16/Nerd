// Config - GUI configuration data structures

// OpenState tracks both the open/closed state and preferred depth
export interface OpenState {
  open: boolean // Whether node is expanded
  depth: number // Preferred depth when open (0 = neutral, -1 = infinite, >0 = N levels)
}

// Vertigo configures a single Vertigo instance
export class Vertigo {
  rootId!: number // Node ID to start rendering from
  openMap!: { [nodeId: number]: OpenState } // Node ID -> open state and depth
}

// BoardConfig holds configuration for all Vertigo trees on a board
export class Board {
  trees!: Vertigo[]
}

// WorkbenchConfig holds configuration for all boards in the workbench
export class Workbench {
  boards!: Board[]
}

// GUIState holds the complete state of the GUI display configuration
export class State {
  workbench!: Workbench
}

// Default state template
export const defaultState: State = {
  workbench: {
    boards: [
      {
        trees: [
          {
            rootId: 1, // Root node
            openMap: { 1: { open: true, depth: 6 } }, // Open root 6 levels deep
          },
        ],
      },
      {
        trees: [
          {
            rootId: 4,
            openMap: { 4: { open: true, depth: 2 } }, // Open node 4, 2 levels deep
          },
          {
            rootId: 1, // Root node (neutral - closed by default)
            openMap: {}, // Empty - no explicit state
          },
        ],
      },
    ],
  },
}
