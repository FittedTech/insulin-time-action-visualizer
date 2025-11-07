'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Canvas from '@/components/Canvas'
import ControlPanel from '@/components/ControlPanel'
import Modal from '@/components/Modal'
import MobileNotice from '@/components/MobileNotice'
import type {
  GraphSegment,
  BoxDimensions,
  SegmentDimensions,
  CursorPosition,
  DecayType,
  DecayMapping,
  InsulinDecayData,
} from '@/types'

/**
 * Main page component for the Insulin Decay Tool application.
 * 
 * This component manages the entire application state including:
 * - Graph segment data and visualization
 * - User interactions (drag, click, input)
 * - Data import/export functionality
 * - Normalization and dose calculations
 * 
 * @component
 * @returns The main application page
 */
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<GraphSegment[]>([])
  const [segmentDims, setSegmentDims] = useState<SegmentDimensions>({
    num: 12,
    width: 0,
    height: 0,
    radius: 2,
  })
  const [boxDims, setBoxDims] = useState<BoxDimensions>({
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    paddingWidth: 70,
    paddingWidthLabel: 52.5,
    paddingHeight: 50,
    ctxOffset: { left: 0, top: 0 },
  })
  const [selectionRadius, setSelectionRadius] = useState<number>(0)
  const [radius, setRadius] = useState<number>(2)
  const [dose, setDose] = useState<number>(0)
  const [cursor, setCursor] = useState<CursorPosition>({ x: null, y: null })
  const [xLock, setXLock] = useState<boolean>(false)
  const [yLock, setYLock] = useState<boolean>(true)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragTargets, setDragTargets] = useState<number[]>([])
  const [selectedDecay, setSelectedDecay] = useState<DecayType | null>('rapid')
  const [decayExamples, setDecayExamples] = useState<string>('')
  const [decayDescription, setDecayDescription] = useState<string>('')
  const [decayTitle, setDecayTitle] = useState<string>('')
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false)
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false)
  const [importText, setImportText] = useState<string>('')
  const [exportText, setExportText] = useState<string>('')

  /** Y-axis segment interval for scale drawing */
  const ySegment = 0.025

  /**
   * Converts a Y coordinate to a percentage value (0-1).
   * 
   * @param y - The Y coordinate on the canvas
   * @param inverse - If true, inverts the percentage (1 - percent)
   * @returns The percentage value, or 0 if dimensions are not initialized
   */
  const yToPercent = useCallback(
    (y: number, inverse: boolean): number => {
      if (boxDims.innerHeight === 0) return 0
      const percent = y / (boxDims.innerHeight + boxDims.paddingHeight / 2)
      return inverse ? 1 - percent : percent
    },
    [boxDims]
  )

  /**
   * Converts a percentage value to a Y coordinate on the canvas.
   * 
   * @param percent - The percentage value (0-1), or false for default position
   * @returns The calculated Y coordinate
   */
  const percentToY = useCallback(
    (percent: number | false): number => {
      let y = boxDims.innerHeight + boxDims.paddingHeight / 2
      y = percent !== false ? y * (1 - percent) : y
      y = y < boxDims.paddingHeight / 2 ? boxDims.paddingHeight / 2 : y
      return y
    },
    [boxDims]
  )

  /**
   * Generates a single graph segment at the specified index.
   * 
   * @param i - The segment index
   * @param percent - The percentage value for this segment, or false for default
   * @returns A new GraphSegment object
   */
  const generateSegment = useCallback(
    (i: number, percent: number | false): GraphSegment => {
      const x = i * segmentDims.width + boxDims.paddingWidthLabel
      let y = boxDims.innerHeight + boxDims.paddingHeight / 2
      y = percent !== false ? y * (1 - percent) : y
      y = y < boxDims.paddingHeight / 2 ? boxDims.paddingHeight / 2 : y

      return {
        idx: i * 5,
        x: x,
        y: y,
        percent: yToPercent(y, true),
        radius: segmentDims.radius,
      }
    },
    [segmentDims, boxDims, yToPercent]
  )

  /**
   * Determines if the dose input can be enabled.
   * Dose can only be set when data is normalized (total percentage ≈ 1.0).
   * 
   * @returns True if data is normalized and dose can be set
   */
  const canSetDose = useMemo(() => {
    if (elements.length === 0) return false
    const total = elements.reduce((carry, val) => {
      carry += yToPercent(val.y, true)
      return carry
    }, 0.0)
    return total >= 0.999 && total <= 1.001
  }, [elements, yToPercent])

  /**
   * Updates canvas dimensions based on container size and dose state.
   * Adjusts padding based on whether dose is set (needs more space for labels).
   */
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const width = parent.clientWidth
    const height = parent.clientHeight
    const rect = canvas.getBoundingClientRect()

    const paddingWidth = dose !== 0 ? 110 : 70
    const paddingWidthLabel = paddingWidth * 0.75
    const paddingHeight = 50

    setBoxDims({
      width,
      height,
      innerWidth: width - paddingWidth,
      innerHeight: height - paddingHeight,
      paddingWidth,
      paddingWidthLabel,
      paddingHeight,
      ctxOffset: { left: rect.left, top: rect.top },
    })
  }, [dose])

  /**
   * Generates all graph segments based on current dimensions and data.
   * Skips regeneration if currently dragging to prevent interference.
   */
  const generateSegments = useCallback(() => {
    if (isDragging) return

    setElements((prevElements) => {
      const newElements: GraphSegment[] = []
      for (let i = 0; i < segmentDims.num; i++) {
        // Handle legacy number format (convert to segment object)
        if (prevElements[i] && typeof prevElements[i] !== 'object') {
          newElements.push(generateSegment(i, prevElements[i] as unknown as number))
        } else {
          const carryPercent = prevElements[i]?.percent || false
          newElements.push(generateSegment(i, carryPercent))
        }
      }
      return newElements
    })
  }, [segmentDims.num, isDragging, generateSegment])

  // Update canvas dimensions on mount and window resize
  useEffect(() => {
    updateCanvasDimensions()
    window.addEventListener('resize', updateCanvasDimensions)
    return () => window.removeEventListener('resize', updateCanvasDimensions)
  }, [updateCanvasDimensions])

  // Update segment width when dimensions or count changes
  useEffect(() => {
    if (boxDims.width > 0) {
      const width = boxDims.innerWidth / segmentDims.num
      setSegmentDims((prev) => ({
        ...prev,
        width,
        radius,
      }))
    }
  }, [boxDims, segmentDims.num, radius])

  // Regenerate segments when dimensions or count changes
  useEffect(() => {
    generateSegments()
  }, [segmentDims.num, boxDims.width, boxDims.height, generateSegments])

  // Update segment radius when radius setting changes
  useEffect(() => {
    setElements((prev) =>
      prev.map((el) => ({
        ...el,
        radius: segmentDims.radius,
      }))
    )
  }, [radius, segmentDims.radius])

  /**
   * Checks if a cursor position hits (is within selection radius of) a segment.
   * 
   * @param ele - The graph segment to check
   * @param cursorX - Cursor X coordinate
   * @param cursorY - Cursor Y coordinate
   * @returns True if cursor is within selection radius of the segment
   */
  const isHittingElement = (
    ele: GraphSegment,
    cursorX: number,
    cursorY: number
  ): boolean => {
    return (
      cursorX >= ele.x - ele.radius - selectionRadius &&
      cursorX <= ele.x + ele.radius + selectionRadius &&
      cursorY >= ele.y - ele.radius - selectionRadius &&
      cursorY <= ele.y + ele.radius + selectionRadius
    )
  }

  /**
   * Handles mouse down events on the canvas.
   * Determines which segments are hit and prepares them for dragging.
   * 
   * @param e - Mouse or touch event
   */
  const handleMouseDown = useCallback(
    (e: MouseEvent | Touch) => {
      const cursorX = Math.floor(e.clientX - boxDims.ctxOffset.left)
      const cursorY = Math.floor(e.clientY - boxDims.ctxOffset.top)
      setCursor({ x: cursorX, y: cursorY })

      const targets: number[] = []
      elements.forEach((ele, idx) => {
        if (isHittingElement(ele, cursorX, cursorY)) {
          targets.push(idx)
        }
      })

      setIsDragging(true)
      setDragTargets(targets)
    },
    [boxDims, elements, selectionRadius]
  )

  /**
   * Handles mouse move events during dragging.
   * Updates segment positions based on lock states.
   * 
   * @param e - Mouse or touch event
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent | Touch) => {
      const cursorX = Math.floor(e.clientX - boxDims.ctxOffset.left)
      const cursorY = Math.floor(e.clientY - boxDims.ctxOffset.top)
      setCursor({ x: cursorX, y: cursorY })

      if (isDragging && dragTargets.length > 0) {
        setElements((prev) =>
          prev.map((el, idx) => {
            if (dragTargets.includes(idx)) {
              const newX = xLock ? cursorX : el.x
              const newY = yLock ? cursorY : el.y
              return {
                ...el,
                x: newX,
                y: newY,
                percent: yToPercent(newY, true),
              }
            }
            return el
          })
        )
      }
    },
    [boxDims, isDragging, dragTargets, xLock, yLock, yToPercent]
  )

  /**
   * Handles mouse up events, ending drag operations.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragTargets([])
  }, [])

  /**
   * Handles mouse out events, ending drag operations.
   */
  const handleMouseOut = useCallback(() => {
    setIsDragging(false)
    setDragTargets([])
  }, [])

  /**
   * Imports decay data from a JSON file or user-provided data.
   * 
   * @param userData - User-provided decay mapping data, or false to load from file
   * @param type - The decay type identifier to load from file
   */
  const importDecay = useCallback(
    async (userData: DecayMapping | false, type: DecayType | null) => {
      if (userData !== false) {
        setSelectedDecay(null)
        setDecayExamples('')
        setDecayDescription('')
        setDecayTitle('')
        const newElements = Object.values(userData).map((val, i) => {
          if (typeof val === 'number') {
            return generateSegment(i, val)
          }
          return val as unknown as GraphSegment
        })
        setElements(newElements)
      } else if (type) {
        try {
          const response = await fetch(`/mappings/${type}.json`, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (!response.ok) {
            throw new Error(`Failed to load ${type}.json: ${response.status} ${response.statusText}`)
          }
          
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error('Expected JSON but got:', text.substring(0, 200))
            throw new Error(`Invalid response type: ${contentType}`)
          }
          
          const data: InsulinDecayData = await response.json()
          setSelectedDecay(type)
          setDecayExamples(data.examples || '')
          setDecayDescription(data.description || '')
          
          // Set title based on decay type
          const titleMap: Record<DecayType, string> = {
            rapid: 'Rapid-Acting Insulin',
            short: 'Short-Acting Insulin',
            intermediate: 'Intermediate-Acting Insulin',
            long: 'Long-Acting Insulin',
            ivBolus: 'IV Bolus Insulin',
          }
          setDecayTitle(titleMap[type] || '')
          
          // Handle both new format (minuteDecays) and legacy format
          const decayData = data.minuteDecays || data
          const newElements = Object.values(decayData).map((val, i) => {
            if (typeof val === 'number') {
              return generateSegment(i, val)
            }
            return val as unknown as GraphSegment
          })
          setElements(newElements)
        } catch (error) {
          console.error('Error loading decay data:', error)
          alert(`Error loading decay data: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    },
    [generateSegment]
  )

  /**
   * Handles decay type button clicks.
   * Toggles selection if already selected, otherwise loads the decay type.
   * 
   * @param type - The decay type identifier
   */
  const handleDecayClick = (type: DecayType) => {
    if (selectedDecay === type) {
      setSelectedDecay(null)
      setElements([])
    } else {
      importDecay(false, type)
    }
  }

  /**
   * Handles segment count changes.
   * Adds or removes segments while preserving existing data.
   * 
   * @param newSegments - The new number of segments
   */
  const handleSegmentsChange = useCallback(
    (newSegments: number) => {
      setElements((prevElements) => {
        const diff = newSegments - segmentDims.num
        const templateSegment =
          prevElements.length > 0
            ? { ...prevElements[prevElements.length - 1] }
            : generateSegment(0, false)

        let newElements = [...prevElements]

        if (diff > 0) {
          // Add new segments
          for (let i = 0; i < diff; i++) {
            templateSegment.idx = (newElements.length + i) * 5
            newElements.push({ ...templateSegment })
          }
        } else if (diff < 0) {
          // Remove segments
          newElements = newElements.slice(0, newSegments)
        }

        return newElements
      })
      setSegmentDims((prev) => ({ ...prev, num: newSegments }))
    },
    [segmentDims.num, generateSegment]
  )

  /**
   * Handles import button click.
   * Parses JSON from textarea and imports the data.
   */
  const handleImport = () => {
    try {
      const data: DecayMapping = JSON.parse(importText)
      importDecay(data, null)
      setImportModalOpen(false)
      setImportText('')
    } catch (e) {
      alert('An error occurred while parsing the JSON.')
      console.error(e)
    }
  }

  /**
   * Handles export button click.
   * Generates export data in the format: { "0": percent, "5": percent, ... }
   */
  const handleExport = () => {
    const output: DecayMapping = {}
    elements.forEach((val, idx) => {
      output[String(idx * 5)] = yToPercent(val.y, true)
    })
    setExportText(JSON.stringify(output, null, 2))
    setExportModalOpen(true)
  }

  /**
   * Normalizes the current graph data so percentages sum to 1.0.
   * Shows confirmation dialog as this operation cannot be undone.
   */
  const handleNormalize = () => {
    if (
      confirm(
        '\nAre you sure?\n\nYou cannot undo this. Export the data prior to normalizing if needed.'
      )
    ) {
      const sum = elements.reduce((carry, val) => {
        carry += yToPercent(val.y, true)
        return carry
      }, 0.0)

      const normalized = elements.map((el) => {
        const percent = yToPercent(el.y, true) / sum
        return {
          ...el,
          percent,
          y: percentToY(percent),
        }
      })

      setElements(normalized)
    }
  }

  /**
   * Normalizes exported data in the export modal.
   * Divides all values by their sum to ensure they total 1.0.
   */
  const handleNormalizeOutput = () => {
    try {
      const output: DecayMapping = JSON.parse(exportText)
      const total = Object.values(output).reduce((carry, val) => carry + val, 0.0)

      const normalized: DecayMapping = {}
      for (const key in output) {
        normalized[key] = output[key] / total
      }

      setExportText(JSON.stringify(normalized, null, 2))
      alert('Normalized!')
    } catch (e) {
      alert('Error normalizing output')
      console.error(e)
    }
  }

  /**
   * Copies export text to clipboard.
   */
  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      alert('Copied to clipboard!')
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  /**
   * Resets the graph by clearing all segments and selected decay type.
   */
  const handleReset = () => {
    setSelectedDecay(null)
    setElements([])
  }

  /**
   * Handles save button click.
   * Currently logs to console - can be extended to save to localStorage or API.
   */
  const handleSave = () => {
    // Save functionality - could be extended to save to localStorage or API
    console.log('Saving current state', { elements, dose, selectedDecay })
  }

  // Load rapid decay curve on initial mount
  useEffect(() => {
    if (boxDims.width > 0 && segmentDims.width > 0) {
      importDecay(false, 'rapid')
    }
  }, [boxDims.width, segmentDims.width, importDecay])

  return (
    <>
      <MobileNotice />
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Insulin Time-Action Visualizer',
            description:
              'Interactive tool for visualizing and creating insulin time-action decay curves. Create percentage of dose mappings for rapid, short, intermediate, and long-acting insulin types.',
            url: 'https://insulin-time-action.projects.fittedtech.com',
            applicationCategory: 'MedicalApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            creator: {
              '@type': 'Organization',
              name: 'Fitted Tech',
              url: 'https://fittedtech.com',
            },
            featureList: [
              'Interactive graph visualization',
              'Multiple insulin type support',
              'Data import/export',
              'Normalization tools',
              'Dose calculation',
            ],
          }),
        }}
      />
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5">
          <div className="max-w-[1920px] mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Insulin Time-Action Visualizer
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Tool to build and view insulin time-action (IOB) curves. You enter insulin type and basic parameters (onset, peak, duration), and it outputs a time→% active JSON map that approximates published insulin profiles (rapid, short, intermediate, basal). For modeling/SW use, not for clinical dosing.
            </p>
          </div>
        </header>

        {/* Main Content - Takes remaining space */}
        <main className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-[1920px] mx-auto h-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 h-full">
              {/* Canvas Area */}
              <div className="md:col-span-3 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 rounded-xl shadow-2xl border-2 border-gray-200/50 backdrop-blur-sm p-5 sm:p-6 min-h-0 relative overflow-hidden flex flex-col">
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/20 to-transparent rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-200/20 to-transparent rounded-tr-full pointer-events-none" />
                
                {/* Graph info card */}
                {(decayTitle || decayDescription || decayExamples) && (
                  <div className="mb-4 flex-shrink-0 relative z-10">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg border-2 border-gray-200/60 shadow-lg p-4">
                      {decayTitle && (
                        <h2 className="text-base font-bold text-gray-900 mb-2">{decayTitle}</h2>
                      )}
                      {decayDescription && (
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{decayDescription}</p>
                      )}
                      {decayExamples && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Examples:</h3>
                          <p className="text-xs text-gray-600 leading-relaxed">{decayExamples}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Inner graph container */}
                <div className="flex-1 min-h-0 relative bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-200/60 shadow-inner p-3 ring-1 ring-gray-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-primary-50/10 rounded-lg pointer-events-none" />
                  <Canvas
                    canvasRef={canvasRef}
                    elements={elements}
                    segmentDims={segmentDims}
                    boxDims={boxDims}
                    selectionRadius={selectionRadius}
                    radius={radius}
                    dose={dose}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseOut={handleMouseOut}
                  />
                </div>
              </div>

              {/* Control Panel */}
              <div className="md:col-span-1 bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30 rounded-xl shadow-xl border-2 border-gray-200/50 min-h-0 overflow-hidden relative">
                {/* Decorative accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-cyan-500 to-primary-500" />
                <ControlPanel
                  segments={segmentDims.num}
                  radius={radius}
                  selection={selectionRadius}
                  dose={dose}
                  cursorX={cursor.x}
                  cursorY={cursor.y}
                  xLock={xLock}
                  yLock={yLock}
                  onSegmentsChange={handleSegmentsChange}
                  onRadiusChange={setRadius}
                  onSelectionChange={setSelectionRadius}
                  onDoseChange={setDose}
                  onXLockChange={setXLock}
                  onYLockChange={setYLock}
                  onReset={handleReset}
                  onSave={handleSave}
                  onNormalize={handleNormalize}
                  onImport={() => setImportModalOpen(true)}
                  onExport={handleExport}
                  onDecayClick={handleDecayClick}
                  selectedDecay={selectedDecay}
                  canSetDose={canSetDose}
                />
              </div>
            </div>
          </div>
        </main>

      {/* Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Mapping"
        footer={
          <>
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Import
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          This will remove all data currently displaying in the graph.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Paste JSON data here..."
        />
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Mapping"
        footer={
          <>
            <button
              onClick={() => setExportModalOpen(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCopyExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Copy
            </button>
            <button
              onClick={handleNormalizeOutput}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Normalize
            </button>
          </>
        }
      >
        <textarea
          value={exportText}
          readOnly
          className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
        />
      </Modal>

        {/* Footer - Fixed to bottom */}
        <footer className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-2 sm:py-3">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
              <p className="text-gray-500">
                Developed by{' '}
                <a
                  href="https://www.linkedin.com/in/conner-aiken"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-700 hover:text-primary-600 transition-colors underline decoration-dotted underline-offset-2"
                >
                  Conner Aiken
                </a>
              </p>
              <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                <a
                  href="mailto:contact@fittedtech.com?subject=Insulin Decay Tool Feedback"
                  className="hover:text-primary-600 transition-colors underline decoration-dotted underline-offset-2"
                >
                  Have feedback? Contact us here
                </a>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <a
                  href="https://github.com/FittedTech/insulin-time-action-visualizer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors underline decoration-dotted underline-offset-2"
                >
                  View the source code here
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

