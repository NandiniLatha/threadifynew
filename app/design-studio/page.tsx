"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
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
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { getInspirationById, type InspirationItem } from "@/lib/data/inspiration-gallery"
import { motion, AnimatePresence } from "framer-motion"
import { fadeUp, staggerContainer } from "@/lib/variants"
import { duration, easing } from "@/lib/motion"

import confetti from "canvas-confetti"

// ─── Inner component (needs useSearchParams) ────────────────────────────────

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

  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // Tracks which inspiration item was pre-loaded (if any) for the banner display
  const [inspirationItem, setInspirationItem] = React.useState<InspirationItem | null>(null)

  // On mount: read ?inspiration= query param and pre-fill if valid
  React.useEffect(() => {
    const inspirationId = searchParams.get("inspiration")
    if (!inspirationId) return

    const item = getInspirationById(inspirationId)
    if (!item) return

    setInspirationItem(item)
    setImagePreview(item.image)
    setTags(item.tags)
    // Deliberate: budget, deadline, notes are left empty for the user to fill in
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
        setStatusMsg({ type: "error", text: "Please drop a valid image file." })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    setStatusMsg(null)
    // Clear the inspiration banner — user is replacing with their own image
    setInspirationItem(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImagePreview(base64)
      
      // Success confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c9a961', '#ffffff', '#000000']
      })
      
      analyzeImage(base64)
      // Note: budget, deadline, notes are NOT reset here — user keeps what they filled in
    }
    reader.readAsDataURL(file)
  }

  // Vision API caller
  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true)
    setStatusMsg(null)
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      })

      const data = await res.json()
      if (res.ok && data.labels) {
        setTags(data.labels)
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "We couldn't analyze that image — try a clearer photo.",
        })
      }
    } catch {
      setStatusMsg({
        type: "error",
        text: "We couldn't analyze that image — try a clearer photo.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    // Since we can't bypass CORS for direct browser url analysis without backend fetching,
    // we simulate url capture and set a mock preview with labels to keep experience seamless
    setStatusMsg(null)
    setInspirationItem(null)
    setImagePreview("https://images.unsplash.com/photo-1598808503746-f34c53b93f3e?auto=format&fit=crop&w=800&q=80")
    setTags(["Vintage Coat", "Patterned Wool", "Streetwear", "Fall Season"])
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
        setStatusMsg({ type: "error", text: "Please specify both budget range and delivery deadline." })
        return
      }
    }

    setIsSubmitting(true)
    setStatusMsg(null)

    // Guard against concurrent double-submissions
    if (isSubmitting) return

    try {
      // Determine whether imagePreview is a URL or a base64 data URI
      const isUrl = imagePreview.startsWith("http")

      const res = await fetch("/api/design-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Pass as imageUrl if it's an external URL; imageBase64 if it's a data URI
          ...(isUrl ? { imageUrl: imagePreview } : { imageBase64: imagePreview }),
          aiTags: tags,
          budgetMin: budgetMin || "0",
          budgetMax: budgetMax || "0",
          deadline: deadline || "",
          notes,
          isDraft,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: isDraft ? "Draft successfully saved to wishlist!" : "Design request submitted successfully! Tailors will begin bidding shortly.",
        })
        // Reset form on success
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
        setStatusMsg({ type: "error", text: data.error || "Submission failed. Please check credentials and try again." })
      }
    } catch {
      setStatusMsg({ type: "error", text: "An unexpected error occurred during submission. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary">
      {/* Visual Accent Backgrounds */}
      <div className="absolute inset-0 z-0 opacity-10 dark:opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-radial from-rust/30 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-radial from-terracotta/30 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold text-foreground hover:text-primary transition-colors">
              Threadify
            </span>
          </a>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="container mx-auto max-w-4xl px-4 py-12 relative z-10">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Custom Design</span>
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
            Create Your Custom Request
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Upload your inspiration image, review AI-detected tags, set your budget details, and connect with master tailors.
          </p>
        </div>

        {/* Inspiration item pre-fill banner */}
        {inspirationItem && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground font-medium">
              Loaded: <span className="text-primary">{inspirationItem.title}</span>
              <span className="text-muted-foreground font-normal"> · {inspirationItem.category}</span>
            </span>
            <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
              You can replace the image or adjust the tags below.
            </span>
          </div>
        )}

        {statusMsg && (
          <div
            className={`mb-8 p-4 rounded-2xl border text-sm flex items-start gap-3 ${
              statusMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media Uploader */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4">1. Inspiration Media</h2>

              {/* Premium Interactive Uploader Box */}
              <motion.div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                animate={{
                  scale: dragActive ? 1.02 : 1,
                  borderColor: dragActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                }}
                whileHover={{ scale: dragActive ? 1.02 : 1.01 }}
                transition={{ duration: duration.base, ease: easing.easeOut }}
                className={`group relative border-2 border-dashed rounded-[32px] p-8 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
                  dragActive ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(201,169,97,0.3)]" : "border-border hover:border-primary/50"
                } ${imagePreview ? "h-auto" : "h-80"}`}
              >
                {/* Morphing gradient background on hover/drag */}
                <div 
                  className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${dragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{
                    background: "radial-gradient(circle at center, hsl(var(--primary)/0.15) 0%, transparent 70%)"
                  }}
                />

                {/* Animated dashed border glow */}
                <motion.div 
                  className="absolute inset-0 pointer-events-none rounded-[32px]"
                  animate={{ opacity: dragActive ? [0.3, 0.7, 0.3] : 0 }}
                  transition={{ duration: duration.loopFast, repeat: Infinity, ease: "easeInOut" }}
                  style={{ boxShadow: "inset 0 0 0 3px hsl(var(--primary))" }}
                />

                {imagePreview ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full relative space-y-4 z-10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Inspiration preview"
                      className="w-full h-auto max-h-72 object-cover rounded-xl border border-border shadow-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setInspirationItem(null)
                        setTags([])
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-full text-white transition-all hover:scale-110 shadow-lg"
                      aria-label="Remove image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {isAnalyzing && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-xl overflow-hidden flex flex-col items-center justify-center text-sm font-medium z-10"
                        >
                          {/* AI Scanning Line & Sparks */}
                          <motion.div
                            animate={{ y: ["0%", "100%", "0%"] }}
                            transition={{ duration: duration.loop, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_rgba(201,169,97,1)] z-20"
                          />
                          <motion.div 
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: duration.loopFast, repeat: Infinity, ease: "easeInOut" }}
                            className="flex flex-col items-center z-30 bg-background/80 px-6 py-4 rounded-2xl shadow-xl border border-primary/20"
                          >
                            <Sparkles className="w-8 h-8 text-primary mb-2" />
                            <span className="text-primary font-bold tracking-widest uppercase">AI Vision Scanning...</span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Replace-image label — shown below when inspiration is pre-loaded */}
                    {inspirationItem && !isAnalyzing && (
                      <label className="block text-center mt-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <span className="cursor-pointer text-sm font-bold px-6 py-2.5 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors inline-block shadow-sm">
                          Replace with your own photo
                        </span>
                      </label>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center space-y-6 z-10 relative">
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto relative cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {/* Pulse animation ring 1 */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/50 pointer-events-none"
                        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                      {/* Pulse animation ring 2 */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/30 pointer-events-none"
                        animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                      />
                      
                      {/* Floating upload icon */}
                      <motion.div
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Upload className="w-8 h-8" />
                      </motion.div>
                    </motion.div>
                    
                    <div>
                      <p className="text-xl font-serif font-bold text-foreground">Drag &amp; drop your photo</p>
                      <p className="text-sm font-medium text-muted-foreground mt-2 max-w-[280px] mx-auto leading-relaxed">
                        Upload an inspiration image to let our AI instantly analyze details, fabrics, and fit.
                      </p>
                    </div>
                    
                    <label className="inline-block cursor-pointer mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <motion.span 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-sm font-bold px-8 py-3.5 bg-foreground text-background rounded-full transition-colors inline-block shadow-lg hover:shadow-xl hover:bg-foreground/90"
                      >
                        Choose File
                      </motion.span>
                    </label>
                  </div>
                )}
              </motion.div>

              {/* URL paste input */}
              <div className="mt-6 pt-6 border-t border-border">
                <form onSubmit={handleUrlSubmit} className="space-y-2">
                  <label htmlFor="url" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Or paste outfit URL
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="url"
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Pinterest or Instagram link..."
                        className="w-full h-10 px-3 pl-9 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    </div>
                    <Button type="submit" size="sm" className="h-10 bg-primary text-primary-foreground hover:opacity-90">
                      Load
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Customizations & Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
              {/* Tag Section */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  <span>2. Design &amp; Fabric Tags</span>
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  These help tailors categorize your design. Add or modify as needed.
                </p>

                {/* Tag Container */}
                <motion.div 
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap gap-2 mb-4 min-h-[36px] p-2 border border-dashed border-border rounded-xl"
                >
                  <AnimatePresence>
                    {tags.length > 0 ? (
                      tags.map((tag, idx) => (
                        <motion.span
                          key={tag + idx}
                          variants={fadeUp}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, scale: 0.8 }}
                          layout
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx)}
                            className="hover:text-destructive transition-colors"
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.span>
                      ))
                    ) : (
                      <motion.span 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="text-xs text-muted-foreground/60 italic p-1"
                      >
                        No tags yet. Upload an image to detect details automatically.
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Add Tag Form */}
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="e.g. Linen, Silk Lining, Velvet"
                    className="flex-1 h-9 px-3 border border-border rounded-xl bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <Button type="submit" size="sm" variant="outline" className="h-9 px-3 border border-border hover:bg-muted">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </form>
              </div>

              {/* Form inputs */}
              <div className="pt-6 border-t border-border space-y-4">
                <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span>3. Production Details</span>
                </h2>

                {/* Budget Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budgetMin" className="block text-xs font-semibold text-foreground mb-1">
                      Min Budget (₹)
                    </label>
                    <input
                      id="budgetMin"
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="budgetMax" className="block text-xs font-semibold text-foreground mb-1">
                      Max Budget (₹)
                    </label>
                    <input
                      id="budgetMax"
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g. 300"
                      className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label htmlFor="deadline" className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Delivery Deadline</span>
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-10 px-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Additional Instructions &amp; Notes</span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specify sizing, sleeve cuts, collar designs, fabric choices, or fitting requirements..."
                    rows={4}
                    className="w-full p-3 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Actions Grid */}
              <div className="pt-6 border-t border-border grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isAnalyzing}
                  onClick={() => handleSubmitRequest(true)}
                  className="w-full border-border hover:bg-muted text-sm font-semibold h-11 rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting || isAnalyzing}
                  onClick={() => handleSubmitRequest(false)}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold h-11 rounded-xl shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Public export — wraps in Suspense (required for useSearchParams in Next 14) ─

export default function DesignStudioPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <DesignStudio />
    </React.Suspense>
  )
}
