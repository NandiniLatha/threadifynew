"use client";
import Image from "next/image"

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Download, Share2, Copy, RefreshCcw, CheckCircle } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Custom simple confetti component using Framer Motion
const Confetti = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [pieces, setPieces] = useState<any[]>([]);

  useEffect(() => {
    if (reducedMotion) return;
    const colors = ['#c9a961', '#f59e0b', '#10b981', '#3b82f6'];
    const newPieces = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.2,
      duration: Math.random() * 2 + 1.5,
    }));
    setPieces(newPieces);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: [1, 1, 0], rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
};

export default function WearOutfitPage() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copying, setCopying] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanShare(true);
    }
  }, []);

  const mockOutfitImages = [
    "/images/fashion/designer_1.webp",
    "/images/fashion/designer_2.webp",
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Bespoke Outfit from Threadify",
          text: "Check out my new custom tailored outfit!",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share cancelled or failed", err);
      }
    } else {
      // Fallback
      setCopying(true);
      navigator.clipboard.writeText(window.location.href);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  const handleDownloadInvoice = () => {
    // Generate simple mock invoice blob
    const content = `THREADIFY RECEIPT\nOrder: #TRD-98102\nTailor: Priya Sharma\nTotal: ₹350.00\nStatus: Delivered`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Threadify_Invoice_TRD-98102.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center flex-1 h-full py-12 max-w-4xl mx-auto w-full relative">
      <Confetti />
      
      {/* Delivery Banner */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full bg-primary/10 border border-primary/20 p-6 rounded-3xl flex items-center gap-4 mb-10 text-primary">
        <CheckCircle className="w-8 h-8 shrink-0" />
        <div>
          <h2 className="font-serif font-bold text-xl">Package Delivered Successfully</h2>
          <p className="text-sm opacity-90">Your custom outfit has arrived. We hope it fits perfectly!</p>
        </div>
      </motion.div>
      
      <div className="w-full flex flex-col md:flex-row gap-8 mb-12">
        {/* Gallery */}
        <div className="flex-1 flex gap-4">
          {mockOutfitImages.map((src, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex-1 rounded-3xl overflow-hidden aspect-[3/4] border border-border shadow-lg">
              <Image width={400} height={400} src={src} alt="Outfit preview" className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>

        {/* Actions & Review */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-background border border-border p-8 rounded-3xl shadow-sm">
            <h3 className="font-serif font-bold text-2xl mb-2">Rate your tailor</h3>
            <p className="text-muted-foreground text-sm mb-6">How was your experience with Priya Sharma?</p>
            
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="focus-visible:outline-none"
                      >
                        <Star className={`w-8 h-8 transition-colors ${
                          (hoverRating || rating) >= star ? "fill-primary text-primary" : "text-muted-foreground/30"
                        }`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Tell us what you loved..."
                    className="w-full h-24 bg-muted/20 border border-border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 resize-none"
                  />
                  <Button onClick={() => setSubmitted(true)} disabled={rating === 0} className="w-full rounded-xl">
                    Submit Review
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center text-center text-primary">
                  <CheckCircle className="w-12 h-12 mb-4" />
                  <p className="font-medium">Thank you for your feedback!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleDownloadInvoice} variant="outline" className="h-14 rounded-xl gap-2 font-medium">
              <Download className="w-4 h-4" /> Invoice
            </Button>
            <Button onClick={handleShare} variant="outline" className="h-14 rounded-xl gap-2 font-medium relative overflow-hidden">
              <AnimatePresence mode="wait">
                {copying ? (
                  <motion.div key="copied" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="absolute inset-0 flex items-center justify-center gap-2 bg-primary text-primary-foreground">
                    <CheckCircle className="w-4 h-4" /> Copied
                  </motion.div>
                ) : (
                  <motion.div key="share" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                    {canShare ? <Share2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Share
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button onClick={() => router.push("/how-it-works/upload")} variant="secondary" className="col-span-2 h-14 rounded-xl gap-2 font-medium">
              <RefreshCcw className="w-4 h-4" /> Reorder Similar Style
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Button onClick={() => router.push("/")} variant="ghost" className="rounded-full group text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
