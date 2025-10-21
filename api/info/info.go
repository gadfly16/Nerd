package info

import "strings"

// Class represents which information classes are requested/subscribed
type Class uint8

const (
	Status Class = 1 << iota // Node status information
	Config                   // Node configuration
	Logs                     // Node logs
)

// String returns a human-readable representation of Class for debugging
func (c Class) String() string {
	if c == 0 {
		return "None"
	}

	var parts []string
	if c&Status != 0 {
		parts = append(parts, "Status")
	}
	if c&Config != 0 {
		parts = append(parts, "Config")
	}
	if c&Logs != 0 {
		parts = append(parts, "Logs")
	}
	return strings.Join(parts, "|")
}
