// TypeInfo configuration for node types

import * as nerd from "./nerd.js"

// TypeInfo stores the display name, measured width, base hue, and values HTML for a node type
export interface TypeInfo {
  name: string
  size: number // Width of name when measured
  hue: number // Base hue value (0-360) for HSL color derivation
  allowedChildren: number[] // Array of NodeType enums this type can have as children
  leaf: boolean // True if this type has no allowed children
  values?: string // HTML for node-specific values (optional, defaults to empty)
}

// Default type info configuration (POJO)
const defaultTypeInfos: Record<number, Omit<TypeInfo, "size" | "leaf">> = {
  [nerd.NodeType.Group]: {
    name: "Group",
    hue: 200,
    allowedChildren: [nerd.NodeType.Group, nerd.NodeType.GUI, nerd.NodeType.TopoUpdater],
  },
  [nerd.NodeType.Root]: {
    name: "Root",
    hue: 260,
    allowedChildren: [nerd.NodeType.Authenticator, nerd.NodeType.Group],
  },
  [nerd.NodeType.Authenticator]: {
    name: "Authenticator",
    hue: 220,
    allowedChildren: [nerd.NodeType.User],
  },
  [nerd.NodeType.User]: {
    name: "User",
    hue: 240,
    allowedChildren: [nerd.NodeType.Group],
    values: `
      <fieldset>
        <legend>User</legend>
        <v-value name="password" seal="secret" parm></v-value>
      </fieldset>
    `,
  },
  [nerd.NodeType.GUI]: {
    name: "GUI",
    hue: 280,
    allowedChildren: [],
  },
  [nerd.NodeType.TopoUpdater]: {
    name: "TopoUpdater",
    hue: 300,
    allowedChildren: [],
  },
}

// Global TypeInfos map (populated by Hydrate())
export const TypeInfos = new Map<number, TypeInfo>()

// Track if TypeInfos has been hydrated
export let hydrated = false

// Hydrate populates TypeInfos map and measures text widths using canvas context
export function Hydrate(ctx: CanvasRenderingContext2D): void {
  if (hydrated) return

  for (const [nodeType, info] of Object.entries(defaultTypeInfos)) {
    TypeInfos.set(Number(nodeType), {
      ...info,
      size: ctx.measureText(info.name).width,
      leaf: info.allowedChildren.length === 0,
    })
  }

  hydrated = true
}
