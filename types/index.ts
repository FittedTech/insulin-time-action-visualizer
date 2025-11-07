/**
 * Type definitions for the Insulin Decay Tool application.
 * @module types
 */

/**
 * Represents a single segment point in the decay curve graph.
 */
export interface GraphSegment {
  /** Index identifier for the segment (typically multiples of 5) */
  idx: number
  /** X coordinate on the canvas */
  x: number
  /** Y coordinate on the canvas */
  y: number
  /** Percentage value (0-1) representing the decay at this point */
  percent: number
  /** Visual radius of the segment point in pixels */
  radius: number
}

/**
 * Dimensions and layout information for the canvas drawing area.
 */
export interface BoxDimensions {
  /** Total width of the canvas */
  width: number
  /** Total height of the canvas */
  height: number
  /** Inner drawing area width (excluding padding) */
  innerWidth: number
  /** Inner drawing area height (excluding padding) */
  innerHeight: number
  /** Padding width for labels on the left side */
  paddingWidth: number
  /** Padding width for label positioning */
  paddingWidthLabel: number
  /** Padding height for labels on the bottom */
  paddingHeight: number
  /** Canvas offset from viewport (for mouse position calculations) */
  ctxOffset: {
    left: number
    top: number
  }
}

/**
 * Dimensions for graph segments.
 */
export interface SegmentDimensions {
  /** Number of segments in the graph */
  num: number
  /** Width of each segment in pixels */
  width: number
  /** Height of each segment (currently unused, reserved for future use) */
  height: number
  /** Radius of segment points in pixels */
  radius: number
}

/**
 * Cursor position on the canvas.
 */
export interface CursorPosition {
  /** X coordinate, null if not on canvas */
  x: number | null
  /** Y coordinate, null if not on canvas */
  y: number | null
}

/**
 * Insulin decay type identifiers.
 */
export type DecayType = 'ivBolus' | 'rapid' | 'short' | 'intermediate' | 'long'

/**
 * Imported decay data format (from JSON files).
 * Keys are string numbers (e.g., "0", "5", "10") representing time indices.
 */
export interface DecayMapping {
  [key: string]: number
}

/**
 * Insulin decay data file format with examples, description, and minute decays.
 */
export interface InsulinDecayData {
  examples: string
  description: string
  minuteDecays: DecayMapping
}

/**
 * Collapsible section state for the control panel.
 */
export interface PanelSections {
  axes: boolean
  options: boolean
  datasets: boolean
  actions: boolean
}

