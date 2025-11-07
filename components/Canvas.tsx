'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import type { GraphSegment, BoxDimensions, SegmentDimensions } from '@/types'

/**
 * Props for the Canvas component.
 */
interface CanvasProps {
  /** Reference to the canvas element */
  canvasRef: RefObject<HTMLCanvasElement>
  /** Array of graph segments to render */
  elements: GraphSegment[]
  /** Dimensions for segment calculations */
  segmentDims: SegmentDimensions
  /** Canvas box dimensions and layout information */
  boxDims: BoxDimensions
  /** Additional selection radius around points (for easier clicking) */
  selectionRadius: number
  /** Visual radius of segment points */
  radius: number
  /** Current dose value (0 if not set) */
  dose: number
  /** Mouse down event handler */
  onMouseDown: (e: MouseEvent | Touch) => void
  /** Mouse move event handler */
  onMouseMove: (e: MouseEvent | Touch) => void
  /** Mouse up event handler */
  onMouseUp: (e: MouseEvent | Touch) => void
  /** Mouse out event handler */
  onMouseOut: (e: MouseEvent | Touch) => void
}

/**
 * Renders the interactive canvas graph for insulin decay visualization.
 * 
 * This component handles:
 * - Canvas initialization and sizing
 * - Drawing graph segments, borders, and scales
 * - Mouse and touch event handling for interaction
 * - Real-time updates when data changes
 * 
 * @param props - Canvas component props
 * @returns The canvas element with event handlers
 */
export default function Canvas({
  elements,
  segmentDims,
  boxDims,
  selectionRadius,
  radius,
  dose,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseOut,
  canvasRef,
}: CanvasProps) {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)

  // Initialize canvas context and set dimensions
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctxRef.current = ctx

    // Set canvas size to match parent container
    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
  }, [canvasRef])

  /**
   * Draws the scale/axis labels and grid lines on the canvas.
   * 
   * @param ctx - Canvas 2D rendering context
   * @param boxDims - Box dimensions for layout calculations
   * @param segmentDims - Segment dimensions for time axis calculations
   * @param elements - Graph segments for time labels
   * @param dose - Current dose value (affects Y-axis labels)
   */
  const drawScale = useCallback((
    ctx: CanvasRenderingContext2D,
    boxDims: BoxDimensions,
    segmentDims: SegmentDimensions,
    elements: GraphSegment[],
    dose: number
  ) => {
    ctx.strokeStyle = '#333'
    ctx.font = '12px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#333'

    // Draw Y-axis (vertical) - units/dose percentage
    // Show from 0% to 100% (0 to 1.0)
    ctx.globalAlpha = 0.25
    const numLabels = 20 // Show 20 grid lines (0%, 5%, 10%, ..., 100%)
    for (let i = 0; i <= numLabels; i++) {
      const percent = i / numLabels // 0.0 to 1.0
      const y = boxDims.innerHeight - (percent * boxDims.innerHeight) + (boxDims.paddingHeight / 2)
      let label = dose ? percent * dose : percent * 100
      label = dose ? Number(label.toFixed(2)) : Number(label.toFixed(1))
      const labelText = dose ? `${label} units` : `${label}%`

      ctx.fillText(
        labelText,
        (boxDims.paddingWidth - boxDims.paddingWidthLabel) / 2,
        y + 3
      )
      ctx.beginPath()
      ctx.moveTo(boxDims.paddingWidthLabel, y)
      ctx.lineTo(boxDims.innerWidth + boxDims.paddingWidthLabel, y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Draw X-axis (horizontal) - time labels (minutes/hours)
    ctx.globalAlpha = 0.25
    elements.forEach((seg) => {
      const modulo = segmentDims.num >= 115 ? 60 : segmentDims.num >= 30 ? 30 : 5
      let label = seg.idx
      const labelText = segmentDims.num < 30 ? `${label} mins` : `${label / 60} hrs`

      if (seg.idx % modulo === 0) {
        ctx.strokeStyle = '#000'
        ctx.fillText(
          labelText,
          seg.x - 15,
          boxDims.innerHeight + (boxDims.paddingHeight * 0.90)
        )
      }
    })
    ctx.globalAlpha = 1
  }, [])

  /**
   * Draws all graph segments as circles connected by lines.
   * 
   * @param ctx - Canvas 2D rendering context
   * @param elements - Array of graph segments to draw
   * @param selectionRadius - Additional radius for selection highlighting
   * @param radius - Base radius of segment points
   */
  const drawSegments = useCallback((
    ctx: CanvasRenderingContext2D,
    elements: GraphSegment[],
    selectionRadius: number,
    radius: number
  ) => {
    elements.forEach((seg, idx) => {
      // Draw selection radius indicator if active
      if (selectionRadius > 0) {
        ctx.strokeStyle = '#93c5fd'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.arc(seg.x, seg.y, seg.radius + selectionRadius, 0, Math.PI * 2, true)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw segment circle
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(seg.x, seg.y, seg.radius, 0, Math.PI * 2, true)
      ctx.stroke()
      ctx.strokeStyle = '#000'

      // Draw line connecting to next segment
      if (elements[idx + 1]) {
        ctx.beginPath()
        ctx.moveTo(seg.x, seg.y)
        ctx.lineTo(elements[idx + 1].x, elements[idx + 1].y)
        ctx.stroke()
      }
    })
  }, [])

  // Redraw canvas when data changes
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx || !boxDims.width) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw borders
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, boxDims.width, boxDims.height)
    ctx.strokeRect(
      boxDims.paddingWidthLabel,
      boxDims.paddingHeight / 2,
      boxDims.innerWidth,
      boxDims.innerHeight
    )

    // Draw scale and segments
    drawScale(ctx, boxDims, segmentDims, elements, dose)
    drawSegments(ctx, elements, selectionRadius, radius)
  }, [elements, segmentDims, boxDims, selectionRadius, radius, dose, drawScale, drawSegments])

  const handleMouseDown = useCallback((e: { clientX: number; clientY: number }) => {
    isDrawingRef.current = true
    onMouseDown(e as MouseEvent | Touch)
  }, [onMouseDown])

  const handleMouseMove = useCallback((e: { clientX: number; clientY: number }) => {
    if (isDrawingRef.current) {
      onMouseMove(e as MouseEvent | Touch)
    }
  }, [onMouseMove])

  const handleMouseUp = useCallback((e: { clientX: number; clientY: number }) => {
    isDrawingRef.current = false
    onMouseUp(e as MouseEvent | Touch)
  }, [onMouseUp])

  const handleMouseOut = useCallback((e: { clientX: number; clientY: number }) => {
    if (isDrawingRef.current) {
      onMouseOut(e as MouseEvent | Touch)
    }
    isDrawingRef.current = false
  }, [onMouseOut])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseOut={handleMouseOut}
      onTouchStart={(e) => {
        e.preventDefault()
        if (e.touches[0]) {
          handleMouseDown(e.touches[0])
        }
      }}
      onTouchMove={(e) => {
        e.preventDefault()
        if (e.touches[0]) {
          handleMouseMove(e.touches[0])
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        if (e.changedTouches[0]) {
          handleMouseUp(e.changedTouches[0])
        }
      }}
    />
  )
}

