"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Wand2, CheckCircle2, Save, Scissors } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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

export default function CustomizeDesignPage() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  // Selected chip for each category (can be predefined option or customLabel)
  const [selectedOptions, setSelectedOptions] = useState<Record<OptionCategory, string>>({
    fabric: "Silk",
    color: "Midnight Blue",
    pattern: "Solid",
    style: "A-Line",
    sleeve: "Sleeveless",
    collar: "V-Neck",
    size: "M",
    fit: "Tailored Fit",
  });

  // Custom text input for each category when custom chip is selected
  const [customValues, setCustomValues] = useState<Record<OptionCategory, string>>({
    fabric: "",
    color: "",
    pattern: "",
    style: "",
    sleeve: "",
    collar: "",
    size: "",
    fit: "",
  });

  // Multiline special requirements
  const [specialRequirements, setSpecialRequirements] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  // Helper to resolve the final value (custom or predefined)
  const getResolvedValue = (category: OptionCategory): string => {
    const sel = selectedOptions[category];
    const customLabel = options[category].customLabel;
    if (sel === customLabel) {
      const customVal = customValues[category]?.trim();
      return customVal ? customVal.slice(0, 100) : customLabel.replace("+ ", "");
    }
    return sel;
  };

  // Debounced auto-save simulation
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setSavedTime(currentTime);

      // Save resolved values for tailors / submission context
      const resolvedConfig = {
        fabric: getResolvedValue("fabric"),
        color: getResolvedValue("color"),
        pattern: getResolvedValue("pattern"),
        style: getResolvedValue("style"),
        sleeve: getResolvedValue("sleeve"),
        collar: getResolvedValue("collar"),
        size: getResolvedValue("size"),
        fit: getResolvedValue("fit"),
        specialRequirements: specialRequirements.trim().slice(0, 500),
        rawSelections: selectedOptions,
        customInputs: customValues,
      };

      try {
        localStorage.setItem("threadify_custom_design_config", JSON.stringify(resolvedConfig));
      } catch {
        // ignore localStorage error
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedOptions, customValues, specialRequirements]);

  const handleSelectOption = (category: OptionCategory, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [category]: value }));
  };

  const handleCustomInputChange = (category: OptionCategory, val: string) => {
    // Trim length to 100 characters max
    const trimmedVal = val.slice(0, 100);
    setCustomValues((prev) => ({ ...prev, [category]: trimmedVal }));
  };

  const OptionSection = ({ category }: { category: OptionCategory }) => {
    const configGroup = options[category];
    const isCustomSelected = selectedOptions[category] === configGroup.customLabel;
    const allChips = [...configGroup.items, configGroup.customLabel];

    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {configGroup.title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {allChips.map((opt) => {
            const isSelected = selectedOptions[category] === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(category, opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-background border-border text-foreground hover:border-primary/50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Inline custom value text input when custom option chip is selected */}
        <AnimatePresence>
          {isCustomSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                maxLength={100}
                value={customValues[category]}
                onChange={(e) => handleCustomInputChange(category, e.target.value)}
                placeholder={configGroup.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center flex-1 h-full py-12 max-w-6xl mx-auto w-full">
      <div className="w-full flex items-center justify-between mb-8">
        <Button
          onClick={() => router.push("/how-it-works/upload")}
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          {isSaving ? (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Save className="w-4 h-4" /> Saving...
            </motion.div>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary" /> Saved at {savedTime}
            </>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 w-full">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground flex items-center justify-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" /> Custom Design
        </h1>
        <p className="text-muted-foreground text-lg">
          Our AI has analyzed your inspiration. Refine the details below.
        </p>
      </motion.div>

      <div className="w-full flex flex-col lg:flex-row gap-12 mb-12">
        {/* Left: Configuration Options */}
        <div className="flex-1">
          <OptionSection category="fabric" />
          <OptionSection category="color" />
          <OptionSection category="pattern" />
          <OptionSection category="style" />
          <OptionSection category="sleeve" />
          <OptionSection category="collar" />
          <OptionSection category="size" />
          <OptionSection category="fit" />

          {/* Special Requirements Multiline Textarea */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Special Requirements
            </h3>
            <textarea
              rows={4}
              maxLength={500}
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value.slice(0, 500))}
              placeholder={`Example:\n"I want hidden pockets."\n"Please use lightweight fabric."\n"I need extra sleeve length."\n"I want premium stitching."\n"I prefer a loose fit."`}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="flex-1 lg:max-w-md">
          <div className="sticky top-24 w-full aspect-[3/4] bg-muted/20 border border-border rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary font-medium mb-6">
                <Scissors className="w-5 h-5" /> Live Configuration
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={JSON.stringify({ selectedOptions, customValues, specialRequirements })}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  className="space-y-3 max-h-[60vh] overflow-y-auto pr-1"
                >
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Fabric</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("fabric")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Color</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("color")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Pattern</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("pattern")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Cut & Style</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("style")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Sleeve</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("sleeve")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Neckline</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("collar")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("size")}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2 text-sm">
                    <span className="text-muted-foreground">Fit</span>
                    <span className="font-medium text-foreground text-right">{getResolvedValue("fit")}</span>
                  </div>
                  {specialRequirements.trim() && (
                    <div className="border-b border-border/50 pb-2 text-sm space-y-1">
                      <span className="text-muted-foreground block">Special Requirements</span>
                      <p className="text-xs font-medium text-foreground italic bg-background/40 p-2 rounded-lg border border-border/40 line-clamp-3">
                        "{specialRequirements.trim()}"
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-6 text-center text-xs text-muted-foreground bg-background/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
              Real AI visual rendering would appear here, generating a 3D preview of {getResolvedValue("color")} {getResolvedValue("fabric")}.
            </div>
          </div>
        </div>
      </div>

      {/* Next Step CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-auto pt-8 flex w-full justify-end border-t border-border"
      >
        <Button
          onClick={() => router.push("/how-it-works/quotations")}
          className="h-14 px-8 rounded-full shadow-lg group font-medium text-base"
        >
          Finalize & Request Quotes
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}

