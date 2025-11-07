# Insulin Time–Action Visualizer

A Next.js 15 app for **defining, visualizing, and exporting insulin time–activity profiles**.

This tool lets you work with insulin curves in a **dose-normalized, time-indexed** format:

> **`t (minutes) → fraction_of_dose_active (0–1)`**

It’s designed so humans can edit the curve visually and **LLMs/tools** can read/write the JSON format consistently.

> ⚠️ **Not medical advice**: this is a modeling/authoring tool for curves — it does not calculate patient doses, glucose, or clinical recommendations.

---

## Table of Contents

1. [What This Tool Models](#what-this-tool-models)
2. [Key Concepts](#key-concepts)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Data Model](#data-model)
7. [Using the App](#using-the-app)
8. [Import/Export](#importexport)
9. [Normalization](#normalization)
10. [Extending With New Insulin Types](#extending-with-new-insulin-types)
11. [Conventions for LLMs](#conventions-for-llms)
12. [Notes & Limitations](#notes--limitations)

---

## What This Tool Models

Insulin products have different **time–action** characteristics (onset, peak, duration). This app represents those as a **discretized time–activity function**: for each timepoint, what fraction of the dose is “active” or “expressed” in the model.

- **Keys**: minutes since administration (`"0"`, `"5"`, `"10"`, …)
- **Values**: unitless fraction (`0–1`) representing **% of total modeled effect** at that timepoint

Example:

```json
{
  "0": 0.025,
  "5": 0.05,
  "10": 0.075,
  "15": 0.1,
  ...
  "590": 0.001,
  "595": 0
}
```

Interpretation:

- At **90 minutes**, if the entry is `"90": 0.47`, that means **47% of the modeled effect** is present at that time in this profile.
- The **whole series** describes the curve shape: rise → peak → tail.
- The app can **normalize** the series so the total area (sum of values × interval) represents 1.0 (100%), making curves comparable.

This is intentionally **dose-normalized** so you can reuse the same shape for different absolute doses.

---

## Key Concepts

- **Time–activity profile**: sequence of (time, fraction) pairs.
- **Dose-normalized**: values are proportions of effect, not actual units.
- **Discretized**: we store fixed time steps (usually 5 minutes).
- **Classification**: each JSON belongs to an insulin “class” (IV bolus, rapid, short, intermediate, long/basal).
- **Editable**: points can be dragged; segments can be adjusted.

---

## Features

- **Interactive canvas curve editor**  
  Drag points to refine onset, peak, and tail phases.
- **Multiple insulin types**  
  Presets for IV bolus, rapid, short, intermediate, and long-acting/basal.
- **Parameter controls**  
  Adjust segments, radius/curvature, and selection behavior.
- **Normalization utilities**  
  Ensure total activity sums correctly so curves are PK-consistent.
- **Import/Export**  
  Load previously saved JSON curves or export the one you just designed.
- **Modern UI**  
  Built with Tailwind CSS and React 19, responsive and keyboard-friendly.

---

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS**
- **Canvas-based visualization** for the curve editor
- **Node.js 18+** runtime expected for local dev

---

## Getting Started

### Prerequisites

- Node.js **18+**
- npm or yarn

### Installation

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Open: http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

---

## Data Model

This is the most important part for both developers and LLMs.

### Shape

```ts
type TimeActivityProfile = {
  [minute: string]: number; // 0–1 fraction of dose active
};
```

- **Keys**: strings of integer minutes (`"0"`, `"5"`, `"10"`, …).  
  Typically 5-minute steps, but the UI may allow other granularities.
- **Values**: `number` between `0` and `1`. This is a **relative activity** value.

### Example Profile

```json
{
  "0": 0.025,
  "5": 0.05,
  "10": 0.075,
  "15": 0.1,
  "20": 0.125,
  "25": 0.15,
  ...
  "400": 0.1,
  ...
  "595": 0
}
```

### Interpretation

- Think of this as a **lookup table**: “At minute `t`, return the relative effect.”
- The **totality** of points defines the insulin’s time–action curve.
- The **app can normalize** this so that the sum of all points (properly integrated) equals 1.0 (100%).

### Why this format?

- Easy for LLMs to generate.
- Easy to diff/version.
- Easy to import/export.
- Easy to plot.

---

## Using the App

1. **Select an insulin type**  
   From the datasets/presets panel, choose something like *Rapid* or *Long*. This loads a baseline profile.

2. **View the curve**  
   The canvas shows time on the X-axis (minutes) and relative activity on the Y-axis (0–1).

3. **Edit points**  
   Click/drag points to change the shape.  
   - Use X/Y lock checkboxes to constrain to horizontal/vertical changes.
   - Use segment/radius controls to smooth or refine certain regions (e.g. peak).

4. **Normalize (recommended)**  
   After large edits, click the “Normalize” (or equivalent) action so the resulting curve still represents 100% of the effect.

5. **Export**  
   When you’re happy, export the JSON. This gives you exactly the structure shown above.

6. **Import**  
   If you have an older curve or one generated by an LLM, import it and the app will visualize it.

---

## Import/Export

### Export

- Produces a JSON object in the shape described above.
- Intended to be **round-trippable** (export → edit → import).

### Import

- Expects a JSON object whose keys are minute strings and values are numbers between 0 and 1.
- If values don’t sum to 1.0 (or close), you can run **Normalize** inside the app.

Example imported JSON:

```json
{
  "0": 0,
  "5": 0.02,
  "10": 0.08,
  "15": 0.2,
  "20": 0.3,
  "25": 0.25,
  "30": 0.1,
  "35": 0.05,
  "40": 0
}
```

---

## Normalization

Because this is meant to represent **dose-normalized activity over time**, normalization matters.

**What normalization does:**

1. Sums/integrates the current values over time.
2. Scales them so that the **total** represents 1.0 (100%).
3. Writes the scaled values back to the profile.

**Why normalize?**

- To compare two different insulin classes on equal footing.
- To feed these curves into downstream logic that assumes 100% total effect.
- To avoid accidental “over-100%” curves created by dragging points.

---

## Extending With New Insulin Types

If you want to add a new preset (e.g. “Ultra-rapid” or “NPH-like tail”), the pattern is:

1. Create a new JSON in the same format:
   ```json
   {
     "0": 0,
     "5": 0.04,
     "10": 0.1,
     ...
     "240": 0
   }
   ```
2. Add it to whatever dataset/config file the UI is reading from (often a `datasets.ts` / `insulinPresets.ts` style file).
3. Give it:
   - a **label** (“Ultra rapid SC”)
   - a **classification** (rapid / short / intermediate / long / IV bolus)
   - an optional **description** (“Short onset, high early peak, fast decline”)
4. Test it by loading it in the UI and normalizing.

---

## Conventions for LLMs

If you are an LLM or building an agent that emits one of these profiles, follow these rules:

1. **Always produce valid JSON** with double quotes.
2. **Keys** should be minute strings in ascending order: `"0"`, `"5"`, `"10"`, …  
   If you don’t know the app’s interval, default to **5 minutes**.
3. **Values** must be numbers between **0 and 1**.
4. Try to produce a **single peak** unless modeling biphasic insulins.
5. After emitting, you may add a short note: “Run Normalize in the UI.”
6. Do **not** add extra top-level keys — the app expects a flat object.
7. If asked for “long-acting/basal,” produce a **low, broad** curve with long tail.
8. If asked for “IV bolus,” produce a **very fast rise and fast decline**.

Example LLM-friendly output:

```json
{
  "0": 0.0,
  "5": 0.12,
  "10": 0.25,
  "15": 0.3,
  "20": 0.2,
  "25": 0.08,
  "30": 0.03,
  "35": 0.015,
  "40": 0.0
}
```

Then the user can normalize in the app.

---

## Notes & Limitations

- This is a **curve-authoring** tool, not a PK engine and not a dosing tool.
- Values represent **relative pharmacologic effect** (or activity), not plasma concentration.
- Real insulin PK/PD is affected by route, site, temperature, patient factors, etc. This tool is intentionally simpler — it gives you a consistent data shape for apps/simulators.

---

## Summary

- You edit insulin time–activity curves visually.
- The app stores them as `minute -> fraction_of_dose_active`.
- You can normalize, import, and export.
- It’s all built on Next.js 15 + React 19 + Tailwind.
- It’s safe for LLMs to generate data for it if they follow the shape above.
