"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Clock, Check, X, Scale, Sparkles, Award, CheckCircle2 } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { generateDynamicQuotes, TailorQuote, DesignConfig } from "@/lib/bidding/quote-generator";
import { formatINR } from "@/lib/utils/currency";

type SortMode = "price" | "rating" | "delivery";

export default function QuotationsPage() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const [designConfig, setDesignConfig] = useState<DesignConfig | null>(null);
  const [quotes, setQuotes] = useState<TailorQuote[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("price");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  // Load customer design config and generate dynamic quotes on mount
  useEffect(() => {
    let savedConfig: DesignConfig | null = null;
    try {
      const stored = localStorage.getItem("threadify_custom_design_config");
      if (stored) {
        savedConfig = JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    setDesignConfig(savedConfig);

    // Generate dynamic quotes based on design inputs
    const generated = generateDynamicQuotes(savedConfig);
    setQuotes(generated);
  }, []);

  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortMode === "price") return a.price - b.price;
    if (sortMode === "rating") return b.rating - a.rating;
    return a.deliveryDays - b.deliveryDays;
  });

  const displayQuotes = compareMode
    ? sortedQuotes.filter((q) => selectedForCompare.includes(q.id))
    : sortedQuotes;

  const handleDecline = (id: string) => {
    setQuotes(quotes.filter((q) => q.id !== id));
    setSelectedForCompare(selectedForCompare.filter((selId) => selId !== id));
  };

  const handleAccept = async (quoteId: string) => {
    const accepted = quotes.find((q) => q.id === quoteId);
    if (!accepted) return;

    setAcceptedId(quoteId);

    // Persist accepted quote and chosen tailor info for the workflow
    try {
      localStorage.setItem("threadify_accepted_quote", JSON.stringify(accepted));
      localStorage.setItem(
        "threadify_selected_tailor",
        JSON.stringify({
          id: accepted.tailorId,
          name: accepted.tailorName,
          studio: accepted.studioName,
          rating: accepted.rating,
          reviews: accepted.reviews,
          experience: accepted.experience,
          completedOrders: accepted.completedOrders,
          specialization: accepted.specialization,
          responseTime: accepted.responseTime,
          portfolio: accepted.portfolio,
          price: accepted.price,
          deliveryDays: accepted.deliveryDays,
        })
      );
    } catch {
      // ignore storage errors
    }

    // Optionally notify API of acceptance
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Quote of ${formatINR(accepted.price)} accepted for ${accepted.tailorName}!`,
          link: "/how-it-works/choose-tailor",
        }),
      });
    } catch {
      // fallback
    }

    setTimeout(() => {
      router.push("/how-it-works/choose-tailor");
    }, 1200);
  };

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s !== id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full py-12 max-w-5xl mx-auto w-full">
      <div className="w-full flex items-center justify-between mb-8">
        <Button
          onClick={() => router.push("/how-it-works/customize")}
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {designConfig && (
          <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>
              Design: <strong className="text-foreground">{designConfig.fabric}</strong>,{" "}
              <strong className="text-foreground">{designConfig.style || designConfig.pattern}</strong>
            </span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 w-full flex flex-col md:flex-row justify-between items-end gap-6"
      >
        <div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Price Quotes Received
          </h1>
          <p className="text-muted-foreground text-lg">
            Compare dynamic estimates from matched artisan tailors.
          </p>
        </div>

        <div className="flex gap-4">
          {!compareMode && (
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
              {(["price", "rating", "delivery"] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                    sortMode === mode
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setSelectedForCompare([]);
            }}
            variant={compareMode ? "default" : "outline"}
            className="rounded-xl gap-2"
          >
            <Scale className="w-4 h-4" />
            {compareMode ? "Exit Compare" : "Compare Mode"}
          </Button>
        </div>
      </motion.div>

      {/* Quotes Grid */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: reducedMotion ? 0 : 0.1 } },
        }}
        initial="hidden"
        animate="show"
        className={`grid gap-6 ${
          compareMode
            ? displayQuotes.length === 3
              ? "grid-cols-3"
              : "grid-cols-2"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        <AnimatePresence>
          {displayQuotes.map((quote) => (
            <motion.div
              key={quote.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative bg-background border rounded-[2rem] p-6 shadow-sm flex flex-col transition-colors ${
                acceptedId === quote.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {compareMode && !selectedForCompare.includes(quote.id) && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[2rem]">
                  <p className="font-medium text-muted-foreground">Not Selected</p>
                </div>
              )}

              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-muted border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={quote.thumbnail} alt={quote.tailorName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-xl text-foreground truncate">{quote.tailorName}</h3>
                  <p className="text-xs text-muted-foreground font-medium truncate">{quote.studioName}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-amber-500 font-medium mt-1">
                    <Star className="w-4 h-4 fill-current" /> {quote.rating}{" "}
                    <span className="text-muted-foreground font-normal">({quote.reviews})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md font-medium">
                      <Award className="w-3 h-3 text-primary" /> {quote.experience} Yrs Exp
                    </span>
                    <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md font-medium">
                      <Clock className="w-3 h-3" /> {quote.deliveryDays} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialization Badge */}
              <div className="mb-4 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">
                Specialist: {quote.specialization}
              </div>

              {/* Itemized Cost Breakdown (in INR) */}
              <div className="space-y-2.5 mb-6 bg-muted/20 p-4 rounded-2xl text-sm border border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material Cost</span>
                  <span className="font-medium text-foreground">{formatINR(quote.materialCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stitching & Labor</span>
                  <span className="font-medium text-foreground">{formatINR(quote.stitchingCost)}</span>
                </div>
                {quote.customizationCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customization & Finish</span>
                    <span className="font-medium text-foreground">{formatINR(quote.customizationCost)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/50 pt-2 text-base">
                  <span className="font-bold text-foreground">Total Quote</span>
                  <span className="font-bold text-primary text-lg">{formatINR(quote.price)}</span>
                </div>
              </div>

              {!compareMode ? (
                <div className="flex gap-3 mt-auto">
                  <Button
                    onClick={() => toggleCompare(quote.id)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                    disabled={acceptedId !== null}
                  >
                    {selectedForCompare.includes(quote.id) ? "Selected" : "Compare"}
                  </Button>
                  <Button
                    onClick={() => handleDecline(quote.id)}
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 rounded-xl px-3"
                    disabled={acceptedId !== null}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => handleAccept(quote.id)}
                    className="flex-1 rounded-xl gap-1.5"
                    disabled={acceptedId !== null}
                  >
                    {acceptedId === quote.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" /> Accepted
                      </>
                    ) : (
                      "Accept Quote"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="mt-auto">
                  <Button
                    onClick={() => handleAccept(quote.id)}
                    className="w-full rounded-xl gap-1.5"
                    disabled={acceptedId !== null}
                  >
                    {acceptedId === quote.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 animate-bounce" /> Accepted
                      </>
                    ) : (
                      "Accept This Quote"
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Helper Text for Compare Mode */}
      <AnimatePresence>
        {!compareMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground text-sm">
              Select "Compare" on 2-3 quotes, then click "Compare Mode" to view side-by-side.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

