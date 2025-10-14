// Config - GUI configuration data structures

// Vertigo configures a single Vertigo instance
export class Vertigo {
  rootId!: number // Node ID to start rendering from (0 = use guiDisplayRoot)
  openList!: Set<number> // Node IDs whose children are visible
  openDepth?: number // Optional: auto-open nodes to this depth (additive to openList)
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
            rootId: 0,
            openList: new Set(),
            openDepth: 6,
          },
        ],
      },
      {
        trees: [
          {
            rootId: 4,
            openList: new Set(),
          },
        ],
      },
    ],
  },
}
