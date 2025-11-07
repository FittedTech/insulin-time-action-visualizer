'use client'

import { useState } from 'react'
import type { DecayType, PanelSections } from '@/types'

/**
 * Props for the ControlPanel component.
 */
interface ControlPanelProps {
  /** Number of segments in the graph */
  segments: number
  /** Radius of segment points in pixels */
  radius: number
  /** Selection radius for easier point selection */
  selection: number
  /** Current dose value (0 if not set) */
  dose: number
  /** Current cursor X position */
  cursorX: number | null
  /** Current cursor Y position */
  cursorY: number | null
  /** Whether X-axis movement is locked */
  xLock: boolean
  /** Whether Y-axis movement is locked */
  yLock: boolean
  /** Callback when segments value changes */
  onSegmentsChange: (value: number) => void
  /** Callback when radius value changes */
  onRadiusChange: (value: number) => void
  /** Callback when selection radius changes */
  onSelectionChange: (value: number) => void
  /** Callback when dose value changes */
  onDoseChange: (value: number) => void
  /** Callback when X lock state changes */
  onXLockChange: (value: boolean) => void
  /** Callback when Y lock state changes */
  onYLockChange: (value: boolean) => void
  /** Callback when reset button is clicked */
  onReset: () => void
  /** Callback when save button is clicked */
  onSave: () => void
  /** Callback when normalize button is clicked */
  onNormalize: () => void
  /** Callback when import button is clicked */
  onImport: () => void
  /** Callback when export button is clicked */
  onExport: () => void
  /** Callback when a decay type button is clicked */
  onDecayClick: (type: DecayType) => void
  /** Currently selected decay type */
  selectedDecay: DecayType | null
  /** Whether dose can be set (data must be normalized) */
  canSetDose: boolean
}

/**
 * Available insulin decay types with their display labels.
 */
const DECAY_TYPES: Array<{ id: DecayType; label: string }> = [
  { id: 'ivBolus', label: 'IV Bolus' },
  { id: 'rapid', label: 'Rapid' },
  { id: 'short', label: 'Short' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'long', label: 'Long' },
]

/**
 * Control panel component providing all graph manipulation controls.
 * 
 * Features:
 * - Collapsible sections for organization
 * - Axis locking controls
 * - Graph parameter adjustments (segments, radius, selection)
 * - Dose input (enabled only when data is normalized)
 * - Insulin type selection
 * - Import/Export functionality
 * - Normalize and reset actions
 * 
 * @param props - Control panel component props
 * @returns The control panel UI component
 */
export default function ControlPanel({
  segments,
  radius,
  selection,
  dose,
  cursorX,
  cursorY,
  xLock,
  yLock,
  onSegmentsChange,
  onRadiusChange,
  onSelectionChange,
  onDoseChange,
  onXLockChange,
  onYLockChange,
  onReset,
  onSave,
  onNormalize,
  onImport,
  onExport,
  onDecayClick,
  selectedDecay,
  canSetDose,
}: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState<PanelSections>({
    axes: true,
    options: true,
    datasets: true,
    actions: true,
  })

  /**
   * Toggles the open/closed state of a panel section.
   * 
   * @param section - The section identifier to toggle
   */
  const toggleSection = (section: keyof PanelSections) => {
    setIsOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="w-full h-full overflow-y-auto space-y-3 p-4">
      {/* Axes Panel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200/50">
        <button
          onClick={() => toggleSection('axes')}
          className="w-full px-3 py-2 bg-primary-600 text-white font-semibold text-sm flex items-center justify-between hover:bg-primary-700 transition-colors"
          aria-expanded={isOpen.axes}
        >
          <span>Axes</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen.axes ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen.axes && (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={xLock}
                    onChange={(e) => onXLockChange(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                    aria-label="Lock X axis"
                  />
                  <span>X</span>
                </label>
                <input
                  type="text"
                  value={cursorX ?? ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Cursor X position"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={yLock}
                    onChange={(e) => onYLockChange(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                    aria-label="Lock Y axis"
                  />
                  <span>Y</span>
                </label>
                <input
                  type="text"
                  value={cursorY ?? ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  aria-label="Cursor Y position"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Options Panel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200/50">
        <button
          onClick={() => toggleSection('options')}
          className="w-full px-3 py-2 bg-primary-600 text-white font-semibold text-sm flex items-center justify-between hover:bg-primary-700 transition-colors"
          aria-expanded={isOpen.options}
        >
          <span>Options</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen.options ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen.options && (
          <div className="p-3 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-800">Data must be normalized before setting dose.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Segments</label>
                <span className="text-xs text-gray-500">({segments})</span>
              </div>
              <input
                type="range"
                min="2"
                max="288"
                step="1"
                value={segments}
                onChange={(e) => onSegmentsChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                aria-label="Number of segments"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Radius</label>
                <span className="text-xs text-gray-500">({radius}px)</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={radius}
                onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                aria-label="Point radius"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700">Selection</label>
                <span className="text-xs text-gray-500">
                  ({selection === 0 ? 'only radius' : `radius +${selection}px`})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.25"
                value={selection}
                onChange={(e) => onSelectionChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                aria-label="Selection radius"
              />
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dose</label>
                  <div className="flex">
                    <input
                      type="number"
                      value={dose || 0}
                      onChange={(e) => onDoseChange(parseInt(e.target.value, 10) || 0)}
                      disabled={!canSetDose}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-l-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      aria-label="Dose in units"
                    />
                    <span className="px-2 py-1.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-xs text-gray-700">
                      units
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={onSave}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                    aria-label="Save current state"
                  >
                    Save
                  </button>
                  <button
                    onClick={onReset}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium"
                    aria-label="Reset graph"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Datasets Panel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200/50">
        <button
          onClick={() => toggleSection('datasets')}
          className="w-full px-3 py-2 bg-primary-600 text-white font-semibold text-sm flex items-center justify-between hover:bg-primary-700 transition-colors"
          aria-expanded={isOpen.datasets}
        >
          <span>Datasets</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen.datasets ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen.datasets && (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {DECAY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onDecayClick(type.id)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedDecay === type.id
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                  aria-label={`Load ${type.label} insulin decay curve`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions Panel */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200/50">
        <button
          onClick={() => toggleSection('actions')}
          className="w-full px-3 py-2 bg-primary-600 text-white font-semibold text-sm flex items-center justify-between hover:bg-primary-700 transition-colors"
          aria-expanded={isOpen.actions}
        >
          <span>Actions</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen.actions ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen.actions && (
          <div className="p-3 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={onImport}
                className="flex-1 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-xs font-medium"
                aria-label="Import data"
              >
                Import
              </button>
              <button
                onClick={onExport}
                className="flex-1 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-xs font-medium"
                aria-label="Export data"
              >
                Export
              </button>
            </div>
            <button
              onClick={onNormalize}
              className="w-full px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
              aria-label="Normalize data"
            >
              Normalize
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

