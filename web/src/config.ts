// Config - GUI configuration data structures

// Vertigo configures a single Vertigo instance
export class Vertigo {
  rootId!: number // Node ID to start rendering from
  openMap!: Map<number, number> // Node ID -> depth (0 = stop, -1 = infinite, >0 = N levels)
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
            openMap: new Map([[1, 6]]), // Open root 6 levels deep
          },
        ],
      },
      {
        trees: [
          {
            rootId: 4,
            openMap: new Map([[4, 2]]), // Open node 4, 2 levels deep
          },
        ],
      },
    ],
  },
}
