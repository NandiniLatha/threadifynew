"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  Link as LinkIcon,
  Tag,
  X,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Scissors,
  Layers,
  ArrowRight,
  UserCheck,
  BadgeCheck,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { getInspirationById, type InspirationItem } from "@/lib/data/inspiration-gallery"
import { motion, AnimatePresence } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/variants"
import { duration, easing } from "@/lib/motion"

import { useGarmentClassifier } from "@/hooks/useGarmentClassifier"
import { useFashionRag } from "@/hooks/useFashionRag"

const options = {
  fabric: {
    title: "Fabric",
    customLabel: "+ Custom Fabric",
    placeholder: "Enter fabric name",
    items: ["Silk", "Cotton", "Linen", "Velvet", "Wool Blend"],
  },
  color: {
    title: "Color",
    customLabel: "+ Custom Color",
    placeholder: "Enter preferred color",
    items: ["Midnight Blue", "Crimson Red", "Emerald Green", "Ivory White", "Charcoal"],
  },
  pattern: {
    title: "Pattern",
    customLabel: "+ Custom Pattern",
    placeholder: "Enter preferred pattern",
    items: ["Solid", "Floral", "Geometric", "Striped", "Paisley"],
  },
  style: {
    title: "Cut & Style",
    customLabel: "+ Custom Style",
    placeholder: "Enter preferred style",
    items: ["A-Line", "Straight Cut", "Anarkali", "Lehenga", "Indo-Western", "Gown"],
  },
  sleeve: {
    title: "Sleeves",
    customLabel: "+ Custom Sleeve",
    placeholder: "Enter sleeve style (e.g. Butterfly, Cape)",
    items: ["Sleeveless", "Short", "Three-Quarter", "Full Length", "Bell"],
  },
  collar: {
    title: "Collar / Neckline",
    customLabel: "+ Custom Neckline",
    placeholder: "Enter neckline style",
    items: ["V-Neck", "Round", "Mandarin", "Sweetheart", "High Neck"],
  },
  size: {
    title: "Size",
    customLabel: "+ Custom Size",
    placeholder: "Enter your size",
    items: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"],
  },
  fit: {
    title: "Fit",
    customLabel: "+ Custom Fit",
    placeholder: "Enter fit preference",
    items: ["Slim Fit", "Regular Fit", "Loose Fit", "Oversized", "Tailored Fit"],
  },
};

type OptionCategory = keyof typeof options;

function DesignStudio() {
  const searchParams = useSearchParams()

  // States
  const [dragActive, setDragActive] = React.useState(false)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [urlInput, setUrlInput] = React.useState("")

  const [tags, setTags] = React.useState<string[]>([])
  const [newTag, setNewTag] = React.useState("")

  const [budgetMin, setBudgetMin] = React.useState("")
  const [budgetMax, setBudgetMax] = React.useState("")
  const [deadline, setDeadline] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Customization Options
  const [selectedOptions, setSelectedOptions] = React.useState<Record<OptionCategory, string>>({
    fabric: "Silk",
    color: "Midnight Blue",
    pattern: "Solid",
    style: "A-Line",
    sleeve: "Sleeveless",
    collar: "V-Neck",
    size: "M",
    fit: "Tailored Fit",
  })
  const [customValues, setCustomValues] = React.useState<Record<OptionCategory, string>>({
    fabric: "",
    color: "",
    pattern: "",
    style: "",
    sleeve: "",
    collar: "",
    size: "",
    fit: "",
  })

  const [dynamicOptions, setDynamicOptions] = React.useState<Record<OptionCategory, string[]>>({
    fabric: [],
    color: [],
    pattern: [],
    style: [],
    sleeve: [],
    collar: [],
    size: [],
    fit: [],
  })

  const handleAddCustomOption = (category: OptionCategory) => {
    const val = customValues[category]?.trim()
    if (!val) return

    setDynamicOptions((prev) => {
      const existing = prev[category]
      if (existing.includes(val)) return prev
      return { ...prev, [category]: [...existing, val] }
    })
    
    setSelectedOptions((prev) => ({ ...prev, [category]: val }))
    setCustomValues((prev) => ({ ...prev, [category]: "" }))
  }

  const renderCategory = (category: OptionCategory) => {
    const configGroup = options[category]
    const isCustomSelected = selectedOptions[category] === configGroup.customLabel
    const allChips = [...configGroup.items, ...dynamicOptions[category], configGroup.customLabel]

    return (
      <div key={category} className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {configGroup.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {allChips.map((opt) => {
            const isSelected = selectedOptions[category] === opt
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(category, opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground hover:border-primary/50"
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Inline custom value text input */}
        <AnimatePresence>
          {isCustomSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={100}
                  value={customValues[category]}
                  onChange={(e) => handleCustomInputChange(category, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustomOption(category)
                    }
                  }}
                  placeholder={configGroup.placeholder}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleAddCustomOption(category)}
                  className="h-9 px-4 shrink-0"
                >
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Helper to resolve the final value (custom or predefined)
  const getResolvedValue = (category: OptionCategory): string => {
    const sel = selectedOptions[category]
    const customLabel = options[category].customLabel
    if (sel === customLabel) {
      const customVal = customValues[category]?.trim()
      return customVal ? customVal.slice(0, 100) : customLabel.replace("+ ", "")
    }
    return sel
  }

  const handleSelectOption = (category: OptionCategory, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [category]: value }))
  }

  const handleCustomInputChange = (category: OptionCategory, val: string) => {
    const trimmedVal = val.slice(0, 100)
    setCustomValues((prev) => ({ ...prev, [category]: trimmedVal }))
  }

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  // Preferred tailor commissioning
  const [preferredTailorId, setPreferredTailorId] = React.useState<string | null>(null)
  const [preferredTailorName, setPreferredTailorName] = React.useState<string | null>(null)
  const [isFetchingTailor, setIsFetchingTailor] = React.useState(false)

  // Custom Hooks for Vision & RAG orchestration
  const {
    isAnalyzing,
    visionStepMsg,
    analyzeImage,
    resetClassifier,
  } = useGarmentClassifier()

  const {
    ragState,
    loadRagRecommendations,
    resetRag,
  } = useFashionRag()

  // Tracks which inspiration item was pre-loaded (if any) for the banner display
  const [inspirationItem, setInspirationItem] = React.useState<InspirationItem | null>(null)
  
  // Tracks if we are loading a draft
  const [isDraftLoading, setIsDraftLoading] = React.useState(false)
  const [loadedDraftId, setLoadedDraftId] = React.useState<string | null>(null)

  // On mount: read query params and pre-fill accordingly
  React.useEffect(() => {
    // Handle ?inspiration= param
    const inspirationId = searchParams.get("inspiration")
    if (inspirationId) {
      const item = getInspirationById(inspirationId)
      if (item) {
        setInspirationItem(item)
        setImagePreview(item.image)
        setTags(item.tags)
      }
    }

    // Handle ?preferredTailor= param
    const tailorId = searchParams.get("preferredTailor")
    if (tailorId) {
      setPreferredTailorId(tailorId)
      setIsFetchingTailor(true)

      const supabase = createClient()
      supabase
        .from("tailor_profiles")
        .select("user:users!user_id(name)")
        .eq("user_id", tailorId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            setPreferredTailorName("Selected Tailor")
          } else {
            const name = (data.user as { name?: string | null } | null)?.name
            setPreferredTailorName(name ?? "Selected Tailor")
          }
          setIsFetchingTailor(false)
        })
    }

    // Handle ?draftId= param
    const draftId = searchParams.get("draftId")
    if (draftId) {
      setLoadedDraftId(draftId)
      setIsDraftLoading(true)
      const supabase = createClient()
      supabase
        .from("wishlist_items")
        .select("*")
        .eq("id", draftId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setImagePreview(data.image_url)
            if (data.ai_tags) setTags(data.ai_tags)
            if (data.budget_min) setBudgetMin(data.budget_min.toString())
            if (data.budget_max) setBudgetMax(data.budget_max.toString())
            if (data.deadline) setDeadline(data.deadline)
            if (data.notes) setNotes(data.notes)
          }
          setIsDraftLoading(false)
        })
    }
  }, [searchParams])

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        processFile(file)
      } else {
        setStatusMsg({ type: "error", text: "Please upload a valid image file (JPEG, PNG, WebP)." })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    // Clear all previous AI state and inspiration metadata completely
    setStatusMsg(null)
    setInspirationItem(null)
    setTags([])
    resetClassifier()
    resetRag()

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      setImagePreview(base64)
      
      const visionResult = await analyzeImage(base64)
      if (visionResult) {
        if (visionResult.detectionStatus === "UNCLEAR_IMAGE" || visionResult.detectionStatus === "NO_GARMENT") {
          setTags([])
          if (visionResult.userMessage) {
            setStatusMsg({ type: "info", text: visionResult.userMessage })
          }
        } else if (visionResult.labels && visionResult.labels.length > 0) {
          setTags(visionResult.labels)
          loadRagRecommendations({
            visionData: visionResult,
            detectedTags: visionResult.labels,
            budgetMin,
            budgetMax,
            deadline,
            notes,
          })
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setStatusMsg(null)
    setInspirationItem(null)
    setImagePreview("/images/features/feature_1_ai_scan.webp")
    setTags(["Custom Clothing", "Streetwear", "Bespoke Request"])
    setUrlInput("")
  }

  // Tag Handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTag("")
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove))
  }

  // Submit and Draft handlers
  const handleSubmitRequest = async (isDraft: boolean) => {
    if (!imagePreview) {
      setStatusMsg({ type: "error", text: "Please upload or provide an inspiration image first." })
      return
    }

    if (!isDraft) {
      if (!budgetMin || !budgetMax || !deadline) {
        setStatusMsg({ type: "error", text: "Please specify both your budget range and target delivery date." })
        return
      }
    }

    setIsSubmitting(true)
    setStatusMsg(null)

    if (isSubmitting) return

    try {
      const isUrl = imagePreview.startsWith("http")

      const res = await fetch("/api/design-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isUrl ? { imageUrl: imagePreview } : { imageBase64: imagePreview }),
          aiTags: tags,
          budgetMin: budgetMin || "0",
          budgetMax: budgetMax || "0",
          deadline: deadline || "",
          notes,
          customization: {
            fabric: getResolvedValue("fabric"),
            color: getResolvedValue("color"),
            pattern: getResolvedValue("pattern"),
            style: getResolvedValue("style"),
            sleeve: getResolvedValue("sleeve"),
            collar: getResolvedValue("collar"),
            size: getResolvedValue("size"),
            fit: getResolvedValue("fit"),
          },
          isDraft,
          draftId: loadedDraftId,
          // Include tailorId for direct commissions (live submissions only; drafts go to wishlist_items which has no tailor_id)
          ...(!isDraft && preferredTailorId ? { tailorId: preferredTailorId } : {}),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: isDraft
            ? "Draft successfully saved to your wishlist!"
            : preferredTailorId && preferredTailorName
            ? `Your commission has been sent directly to ${preferredTailorName}. They will review your specifications and respond shortly.`
            : "Design request submitted! Matched tailors have been notified and will review your specifications.",
        })
        if (!isDraft) {
          setImagePreview(null)
          setInspirationItem(null)
          setTags([])
          setBudgetMin("")
          setBudgetMax("")
          setDeadline("")
          setNotes("")
        }
      } else {
        setStatusMsg({ type: "error", text: data.error || "Submission failed. Please check details and try again." })
      }
    } catch {
      setStatusMsg({ type: "error", text: "An unexpected error occurred during submission. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Editorial Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Threadify
            </span>
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
              Atelier
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="container mx-auto max-w-5xl px-4 py-10">
        {/* Page Title & Context */}
        <div className="mb-8 max-w-2xl">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-primary mb-2">
            <Scissors className="w-3.5 h-3.5" />
            <span>Bespoke Design Studio</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Custom Clothing Request
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Upload your inspiration photo. Our vision system inspects garment architecture, silhouette, and craft details to match you with specialized master tailors.
          </p>
        </div>

        {/* Commissioning Banner — shown when a specific tailor is pre-selected */}
        {(preferredTailorId) && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-primary/5 border border-primary/20 text-sm shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              {/* Tailor avatar initial */}
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                {isFetchingTailor ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <span className="font-serif font-bold text-primary text-sm leading-none">
                    {preferredTailorName?.[0]?.toUpperCase() ?? "T"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70">Commissioning</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                </div>
                <span className="font-semibold text-foreground truncate block">
                  {isFetchingTailor ? "Loading tailor details…" : (preferredTailorName ?? "Selected Tailor")}
                </span>
              </div>
            </div>
            <a
              href={`/tailor/${preferredTailorId}`}
              className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors shrink-0 hidden sm:inline"
            >
              View Profile →
            </a>
          </div>
        )}

        {/* Pre-fill banner from gallery */}
        {inspirationItem && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border text-sm shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">
                <strong className="text-foreground font-semibold">{inspirationItem.title}</strong>
                <span className="text-muted-foreground font-normal"> · {inspirationItem.category}</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
              Pre-loaded inspiration
            </span>
          </div>
        )}

        {/* Status Messages */}
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-3 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : statusMsg.type === "info"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Media Uploader & Detected Attributes */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </span>
                  <span>Inspiration Photo</span>
                </h2>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setInspirationItem(null)
                      setTags([])
                      resetClassifier()
                      resetRag()
                      setStatusMsg(null)
                    }}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear photo
                  </button>
                )}
              </div>

              {/* Clean Atelier Uploader Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center overflow-hidden transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-background/50"
                } ${imagePreview ? "h-auto" : "h-72"}`}
              >
                {imagePreview ? (
                  <div className="w-full relative space-y-3">
                    <div className="relative rounded-lg overflow-hidden border border-border bg-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Inspiration preview"
                        className="w-full h-auto max-h-80 object-contain mx-auto"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            {visionStepMsg || "Analyzing Garment Structure..."}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Extracting silhouette, neckline, fabrics &amp; tailoring craft
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-base font-serif font-bold text-foreground">
                        Upload your reference design
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Drag &amp; drop a clear photo of a saree, suit, kurti, lehenga, or custom outfit.
                      </p>
                    </div>
                    <div>
                      <label className="inline-block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <span className="text-xs font-semibold px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-block shadow-sm">
                          Browse File
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* URL paste input */}
              <div className="mt-4 pt-4 border-t border-border">
                <form onSubmit={handleUrlSubmit} className="space-y-1.5">
                  <label htmlFor="url" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Or paste reference link
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="url"
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste Pinterest, Instagram or image link..."
                        className="w-full h-9 px-3 pl-8 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground" />
                    </div>
                    <Button type="submit" size="sm" variant="outline" className="h-9 px-3">
                      Load
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Tags, Specifications & Pricing */}
          <div className="lg:col-span-6 space-y-6">
            {/* 2. Detected & Custom Tags */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </span>
                  <span>Design &amp; Craftsmanship Tags</span>
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  {tags.length} detected
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                These attributes guide tailor matching and material recommendations. Add or remove tags as needed.
              </p>

              {/* Tag Container */}
              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 bg-background/50 border border-border rounded-xl">
                {tags.length > 0 ? (
                  tags.map((tag, idx) => (
                    <span
                      key={tag + idx}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(idx)}
                        className="hover:text-destructive transition-colors ml-0.5"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic py-1">
                    No tags yet. Upload an inspiration photo above to automatically detect garment attributes.
                  </span>
                )}
              </div>

              {/* Add Custom Tag */}
              <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add custom detail (e.g., Raw Silk, Backless, Zari Border)"
                  className="flex-1 h-9 px-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <Button type="submit" size="sm" variant="outline" className="h-9 px-3">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </form>
            </div>

            {/* 3. Transparent Bespoke Pricing Breakdown (Feature Flagged RAG) */}
            {process.env.NEXT_PUBLIC_RAG_ENABLED === "true" && ragState.status !== "idle" && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      3
                    </span>
                    <span>Transparent Pricing &amp; Knowledge</span>
                  </h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                    Bespoke Quote
                  </span>
                </div>

                {ragState.status === "loading" && (
                  <div className="p-4 rounded-xl bg-background/50 border border-border flex items-center space-x-3 text-xs">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-muted-foreground">{ragState.stepMsg || "Calculating bespoke labor & fabric pricing..."}</span>
                  </div>
                )}

                {ragState.status === "error" && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
                    Recommendations temporarily unavailable. You can still submit your request directly to tailors.
                  </div>
                )}

                {ragState.status === "success" && ragState.data && (
                  <div className="space-y-4">
                    {/* Pricing Quotation Grid */}
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border text-xs">
                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Pure Stitching Labor
                        </span>
                        <span className="font-bold text-foreground text-sm mt-0.5 block">
                          {ragState.data.estimatedStitchingRange?.min > 0 && ragState.data.estimatedStitchingRange?.max > 0
                            ? `₹${ragState.data.estimatedStitchingRange.min.toLocaleString()} - ₹${ragState.data.estimatedStitchingRange.max.toLocaleString()}`
                            : "Standard Bespoke"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          Fabric Material
                        </span>
                        <span className="font-bold text-foreground text-sm mt-0.5 block">
                          {ragState.data.pricingDetails?.fabricMin
                            ? `₹${ragState.data.pricingDetails.fabricMin.toLocaleString()} - ₹${ragState.data.pricingDetails.fabricMax?.toLocaleString()}`
                            : "Customer Provided / TBD"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold text-primary block">
                            Estimated Total Range
                          </span>
                          <span className="font-serif font-bold text-primary text-base">
                            {ragState.data.pricingDetails?.totalMin
                              ? `₹${ragState.data.pricingDetails.totalMin.toLocaleString()} - ₹${ragState.data.pricingDetails.totalMax.toLocaleString()} INR`
                              : `₹${ragState.data.estimatedStitchingRange?.min.toLocaleString()} - ₹${ragState.data.estimatedStitchingRange?.max.toLocaleString()} INR`}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Estimated Turnaround
                          </span>
                          <span className="font-semibold text-foreground text-xs">
                            {ragState.data.estimatedTurnaroundDays?.min > 0
                              ? `${ragState.data.estimatedTurnaroundDays.min}-${ragState.data.estimatedTurnaroundDays.max} Days`
                              : "5-10 Days"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Fabrics */}
                    {ragState.data.recommendedFabric?.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                          Recommended Fabrics for this Silhouette
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ragState.data.recommendedFabric.map((fab: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-secondary/80 text-secondary-foreground text-xs font-semibold">
                              {fab}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/80 italic pt-1">
                      Final quotation is confirmed directly by your matched tailor based on measurements and custom craftwork.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 mt-8">
          {/* 3. Customize Design */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {process.env.NEXT_PUBLIC_RAG_ENABLED === "true" && ragState.status !== "idle" ? "4" : "3"}
              </span>
              <span>Customize Design</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {(["fabric", "color", "pattern", "sleeve", "style", "collar", "size", "fit"] as OptionCategory[]).map(renderCategory)}
            </div>
          </div>

            {/* 4. Production Details & Submission Form */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {process.env.NEXT_PUBLIC_RAG_ENABLED === "true" && ragState.status !== "idle" ? "5" : "4"}
                </span>
                <span>Get Your Price</span>
              </h2>

              {/* Budget Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="budgetMin" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Min Budget (₹)
                  </label>
                  <div className="relative">
                    <input
                      id="budgetMin"
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full h-10 px-3 pl-7 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <span className="absolute left-2.5 top-3 text-xs text-muted-foreground">₹</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="budgetMax" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Max Budget (₹)
                  </label>
                  <div className="relative">
                    <input
                      id="budgetMax"
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g. 4500"
                      className="w-full h-10 px-3 pl-7 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <span className="absolute left-2.5 top-3 text-xs text-muted-foreground">₹</span>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Target Delivery Date
                </label>
                <div className="relative">
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-10 px-3 pl-9 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label htmlFor="notes" className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Specific Tailoring Notes &amp; Fit Preferences
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify lining requirements, zipper preferences, sleeve length adjustments, or fabric details..."
                  className="w-full p-3 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmitRequest(true)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex-1 h-11 text-xs font-semibold"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmitRequest(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto flex-[2] h-11 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {preferredTailorId ? "Sending Commission…" : "Submitting Request..."}
                    </>
                  ) : preferredTailorId && preferredTailorName ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5" />
                      Commission {preferredTailorName.split(" ")[0]}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Submit Request to Master Tailors
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}

export default function DesignStudioPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <DesignStudio />
    </React.Suspense>
  )
}
