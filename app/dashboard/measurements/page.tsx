"use client"

import * as React from "react"
import {
  Ruler,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  AlertCircle,
  Star,
  Sparkles,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  StandardSize,
  GarmentType,
  GarmentField,
  STANDARD_SIZES,
  GARMENT_FIELDS,
  GARMENT_LABELS,
  GARMENT_STANDARD_SIZES,
} from "@/lib/measurements/standard-sizes"

// ── Types ────────────────────────────────────────────────────────────────────

interface Measurement {
  id: string
  label: string
  chest?: number | null
  waist?: number | null
  hips?: number | null
  shoulder?: number | null
  sleeve_length?: number | null
  inseam?: number | null
  neck?: number | null
  height?: number | null
  weight?: number | null
  custom?: {
    garment_type?: GarmentType
    size?: StandardSize | null
    measurement_source?: "custom" | "standard" | "standard_adjusted"
    [key: string]: unknown
  }
  is_default: boolean
  created_at: string
}

type EntryMode = "custom" | "standard"

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFieldValue(m: Measurement, key: string): string {
  if (key.startsWith("custom.")) {
    const sub = key.replace("custom.", "")
    return String(m.custom?.[sub] ?? "")
  }
  return String((m as unknown as Record<string, unknown>)[key] ?? "")
}

function buildPayload(
  fields: GarmentField[],
  formData: Record<string, string>,
  garment_type: GarmentType,
  label: string,
  is_default: boolean,
  entryMode: EntryMode,
  selectedSize: StandardSize | null,
  isAdjusted: boolean
) {
  const measurement_source =
    entryMode === "custom"
      ? "custom"
      : isAdjusted
      ? "standard_adjusted"
      : "standard"

  const payload: Record<string, unknown> = {
    label,
    garment_type,
    size: entryMode === "standard" ? selectedSize : null,
    measurement_source,
    is_default,
    custom: {
      garment_type,
      size: entryMode === "standard" ? selectedSize : null,
      measurement_source,
    },
  }

  for (const f of fields) {
    const val = formData[f.key] ? Number(formData[f.key]) : null
    if (f.key.startsWith("custom.")) {
      const sub = f.key.replace("custom.", "")
      ;(payload.custom as Record<string, unknown>)[sub] = val
    } else {
      payload[f.key] = val
    }
  }

  return payload
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = React.useState<Measurement[]>([])
  const [isLoading, setIsLoading]       = React.useState(true)
  const [error, setError]               = React.useState<string | null>(null)

  // Form state
  const [showForm,      setShowForm]      = React.useState(false)
  const [editingId,     setEditingId]     = React.useState<string | null>(null)
  const [entryMode,     setEntryMode]     = React.useState<EntryMode>("custom")
  const [garmentType,   setGarmentType]   = React.useState<GarmentType>("general")
  const [selectedSize,  setSelectedSize]  = React.useState<StandardSize | null>(null)
  const [isAdjusted,    setIsAdjusted]    = React.useState(false)
  const [formLabel,     setFormLabel]     = React.useState("")
  const [isDefault,     setIsDefault]     = React.useState(false)
  const [formData,      setFormData]      = React.useState<Record<string, string>>({})
  const [isSaving,      setIsSaving]      = React.useState(false)
  const [isDeleting,    setIsDeleting]    = React.useState<string | null>(null)
  const [saveSuccess,   setSaveSuccess]   = React.useState(false)

  async function loadMeasurements() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/measurements")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMeasurements(data.measurements || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load measurements.")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => { loadMeasurements() }, [])

  function openAddForm() {
    setEditingId(null)
    setEntryMode("custom")
    setGarmentType("general")
    setSelectedSize(null)
    setIsAdjusted(false)
    setFormLabel("")
    setIsDefault(false)
    setFormData({})
    setSaveSuccess(false)
    setShowForm(true)
  }

  function openEditForm(m: Measurement) {
    setEditingId(m.id)
    const gt = m.custom?.garment_type ?? "general"
    const sz = m.custom?.size ?? null
    const mode: EntryMode = sz ? "standard" : "custom"

    setGarmentType(gt)
    setSelectedSize(sz)
    setEntryMode(mode)
    setIsAdjusted(m.custom?.measurement_source === "standard_adjusted")
    setFormLabel(m.label)
    setIsDefault(m.is_default)

    // Pre-fill form fields
    const fd: Record<string, string> = {}
    for (const f of GARMENT_FIELDS[gt]) {
      const v = getFieldValue(m, f.key)
      if (v) fd[f.key] = v
    }
    setFormData(fd)
    setSaveSuccess(false)
    setShowForm(true)
  }

  // Handle standard size selection
  function handleSelectSize(size: StandardSize) {
    setSelectedSize(size)
    setIsAdjusted(false)
    const stdValues = GARMENT_STANDARD_SIZES[garmentType][size]
    setFormData({ ...stdValues })

    // Auto-fill label if empty or if previously auto-generated
    if (!formLabel.trim() || formLabel.startsWith("My ") && formLabel.includes("Measurements")) {
      setFormLabel(`My Size ${size} ${GARMENT_LABELS[garmentType]} Measurements`)
    }
  }

  // Handle garment type change
  function handleGarmentTypeChange(gt: GarmentType) {
    setGarmentType(gt)
    if (entryMode === "standard" && selectedSize) {
      // Re-populate standard size dimensions for new garment type
      const stdValues = GARMENT_STANDARD_SIZES[gt][selectedSize]
      setFormData({ ...stdValues })
      setIsAdjusted(false)
    } else {
      setFormData({})
    }
  }

  // Handle individual field change
  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (entryMode === "standard" && selectedSize) {
      // Mark as adjusted if modified from standard baseline
      const baseline = GARMENT_STANDARD_SIZES[garmentType][selectedSize]?.[key] ?? ""
      if (value !== baseline) {
        setIsAdjusted(true)
      }
    }
  }

  async function handleSave() {
    if (!formLabel.trim()) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const fields  = GARMENT_FIELDS[garmentType]
      const payload = buildPayload(
        fields,
        formData,
        garmentType,
        formLabel.trim(),
        isDefault,
        entryMode,
        selectedSize,
        isAdjusted
      )

      const method = editingId ? "PUT" : "POST"
      if (editingId) payload.id = editingId

      const res  = await fetch("/api/measurements", {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSaveSuccess(true)
      await loadMeasurements()
      setTimeout(() => setShowForm(false), 700)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save measurements.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(id)
    try {
      const res = await fetch("/api/measurements", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      await loadMeasurements()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.")
    } finally {
      setIsDeleting(null)
    }
  }

  const currentFields = GARMENT_FIELDS[garmentType]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Body Measurements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save your dimensions or select standard clothing sizes so tailors can craft a perfect custom fit.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={openAddForm}
            className="bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow flex items-center gap-2 px-5"
          >
            <Plus className="w-4 h-4" />
            Add Measurements
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" />
            {editingId ? "Edit Measurements" : "Add New Measurements"}
          </h2>

          {/* Option Switcher: Manual vs Standard */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              How would you like to add your measurements?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEntryMode("custom")
                  setSelectedSize(null)
                  setIsAdjusted(false)
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                  entryMode === "custom"
                    ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                    : "bg-background border-border hover:bg-muted/50"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${entryMode === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">I KNOW MY MEASUREMENTS</p>
                  <p className="text-[11px] text-muted-foreground">Manually enter exact body dimensions</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryMode("standard")
                  if (!selectedSize) {
                    handleSelectSize("M")
                  }
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                  entryMode === "standard"
                    ? "bg-primary/5 border-primary ring-1 ring-primary/30"
                    : "bg-background border-border hover:bg-muted/50"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${entryMode === "standard" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">I KNOW MY STANDARD SIZE</p>
                  <p className="text-[11px] text-muted-foreground">Select XS, S, M, L, XL, XXL to auto-fill</p>
                </div>
              </button>
            </div>
          </div>

          {/* Garment type selector */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Garment Type</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(GARMENT_LABELS) as GarmentType[]).map((gt) => (
                <button
                  key={gt}
                  type="button"
                  onClick={() => handleGarmentTypeChange(gt)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    garmentType === gt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {GARMENT_LABELS[gt]}
                </button>
              ))}
            </div>
          </div>

          {/* Standard Size Selector (Only visible in Standard Size mode) */}
          {entryMode === "standard" && (
            <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Select Your Size
                </p>
                {selectedSize && (
                  <span className="text-xs font-semibold text-primary">
                    Selected: <span className="font-bold text-foreground">{selectedSize}</span> ({GARMENT_LABELS[garmentType]})
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {STANDARD_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSelectSize(size)}
                    className={`min-w-[48px] h-10 px-4 rounded-xl text-xs font-bold border transition-all ${
                      selectedSize === size
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                        : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>These are standard size estimates. You can adjust them to your actual measurements below.</span>
              </div>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Profile Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder={`e.g. My ${GARMENT_LABELS[garmentType]} Measurements`}
              className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Measurement fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dimensions (in centimetres)
              </p>
              {entryMode === "standard" && isAdjusted && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Customized from standard {selectedSize}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {currentFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {field.label}
                    <span className="text-muted-foreground font-normal ml-1">({field.unit})</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              role="switch"
              aria-checked={isDefault}
              onClick={() => setIsDefault(!isDefault)}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${
                isDefault ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isDefault ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-foreground">Set as default profile</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !formLabel.trim() || (entryMode === "standard" && !selectedSize)}
              className="bg-primary text-primary-foreground font-semibold h-10 rounded-xl px-6"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : saveSuccess ? (
                <><Check className="w-4 h-4 mr-2" />Saved!</>
              ) : (
                editingId ? "Update" : "Save Measurements"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSaving}
              className="h-10 rounded-xl px-6 border-border"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Measurements list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      ) : measurements.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border border-dashed rounded-3xl space-y-4">
          <Ruler className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No measurements saved yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Save your body dimensions or choose standard sizes so tailors can craft garments that fit you perfectly.
          </p>
          <Button
            onClick={openAddForm}
            className="bg-primary text-primary-foreground font-semibold px-6 rounded-2xl h-11 mt-2"
          >
            Add My First Measurements
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {measurements.map((m) => {
            const gt = m.custom?.garment_type ?? "general"
            const sz = m.custom?.size ?? null
            const source = m.custom?.measurement_source ?? (sz ? "standard" : "custom")
            const fields = GARMENT_FIELDS[gt]
            const displayFields = fields.filter((f) => !!getFieldValue(m, f.key))

            return (
              <div
                key={m.id}
                className={`bg-card border rounded-3xl p-5 shadow-sm space-y-4 ${
                  m.is_default ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{m.label}</p>
                      {m.is_default && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          <Star className="w-2.5 h-2.5 fill-current" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{GARMENT_LABELS[gt]} Profile</span>
                      {sz && (
                        <span className="font-semibold text-primary bg-primary/10 px-2 py-0.2 rounded-md text-[11px]">
                          Size {sz} {source === "standard_adjusted" ? "(Customized)" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(m)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={isDeleting === m.id}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      {isDeleting === m.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Measurements grid */}
                {displayFields.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {displayFields.map((f) => (
                      <div key={f.key} className="bg-muted/50 rounded-xl p-2.5">
                        <p className="text-[10px] text-muted-foreground font-semibold">{f.label}</p>
                        <p className="text-sm font-bold text-foreground">{getFieldValue(m, f.key)} cm</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No dimensions entered yet.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
