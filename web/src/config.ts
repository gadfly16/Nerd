// Config - GUI configuration data structures

// ListTreeConfig configures a single ListTree instance
export class ListTree {
  rootId!: number // Node ID to start rendering from
  stopList!: Set<number> // Node IDs to stop rendering at
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
// rootId values must be set to displayRoot.id before use
export const defaultState: State = {
  workbench: {
    boards: [
      {
        listTrees: [
          {
            rootId: 0, // Set to displayRoot.id
            stopList: new Set([1]), // Stop at node 1 (don't render its children)
          },
        ],
      },
      {
        listTrees: [
          {
            rootId: 0, // Set to displayRoot.id
            stopList: new Set(),
          },
        ],
      },
    ],
  },
}
