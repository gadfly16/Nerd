// Config - GUI configuration data structures

// Vertigo configures a single Vertigo instance
export class Vertigo {
  rootId!: number // Node ID to start rendering from
  openList!: Set<number> // Node IDs whose children are visible
  displayRoot?: number // Optional: render displayRoot at this depth (macro expanded on first render)
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
// displayRoot macros are expanded during first render
export const defaultState: State = {
  workbench: {
    boards: [
      {
        trees: [
          {
            rootId: 0,
            openList: new Set(),
            displayRoot: 1, // Show displayRoot with depth 1
          },
        ],
      },
      {
        trees: [
          {
            rootId: 0,
            openList: new Set(),
            displayRoot: 2, // Show displayRoot with depth 2
          },
        ],
      },
    ],
  },
}
