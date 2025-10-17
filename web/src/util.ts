// Utility Functions

// $() creates an HTMLElement from a template string
// Strips whitespace for cleaner template literals
const _dollarRegexp = /^\s+|\s+$|(?<=\>)\s+(?=\<)/gm
export function $(html: string): HTMLElement {
  const template = document.createElement("template")
  template.innerHTML = html.replace(_dollarRegexp, "")
  const result = template.content.firstElementChild
  return result as HTMLElement
}

// Prototype Extensions

declare global {
  interface DOMRect {
    In(other: DOMRect): boolean
  }
}

// In() checks if this DOMRect intersects with another DOMRect
DOMRect.prototype.In = function (other: DOMRect): boolean {
  return (
    this.left < other.right &&
    this.right > other.left &&
    this.top < other.bottom &&
    this.bottom > other.top
  )
}
