// Config - GUI configuration data structures

// ListTreeConfig configures a single ListTree instance
export class ListTree {
  rootId!: number // Node ID to start rendering from
  openList!: Set<number> // Node IDs whose children are visible
  displayRoot?: number // Optional: render displayRoot at this depth (macro expanded on first render)
}

// BoardConfig holds configuration for all ListTrees on a board
export class Board {
  listTrees!: ListTree[]
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
        listTrees: [
          {
            rootId: 0,
            openList: new Set(),
            displayRoot: 1, // Show displayRoot with depth 1
          },
        ],
      },
      {
        listTrees: [
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
