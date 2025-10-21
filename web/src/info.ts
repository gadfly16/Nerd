// Info Class Bitmask
// Must match api/info/info.go

export const enum info {
  Status = 1 << 0, // Node status information
  Config = 1 << 1, // Node configuration
  Logs = 1 << 2, // Node logs
}

// toString returns a human-readable representation for debugging
export function infoToString(c: number): string {
  if (c === 0) {
    return "None"
  }

  const parts: string[] = []
  if (c & info.Status) parts.push("Status")
  if (c & info.Config) parts.push("Config")
  if (c & info.Logs) parts.push("Logs")
  return parts.join("|")
}
