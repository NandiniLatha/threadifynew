import * as React from "react"
import Link from "next/link"
import { Ruler, Heart, Sparkles, Wand2, Plus, Clock, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CustomDesignPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Personalized Fashion</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your style preferences, body measurements, and AI-recommended aesthetics.
          </p>
        </div>
        <Link href="/design-studio" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
          <Button className="bg-primary text-primary-foreground font-semibold h-11 rounded-2xl shadow flex items-center gap-1.5 px-5">
            <Plus className="w-4 h-4" />
            <span>New Design</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Measurements & Preferences */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Measurements */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Ruler className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Saved Measurements</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
              Store your exact body dimensions to ensure a perfect fit for every custom order.
            </p>
            <Button variant="outline" className="h-10 rounded-xl border-border font-semibold">
              Add Measurements
            </Button>
          </section>

          {/* Preferences */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Style Preferences</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
              Tell us your favorite fabrics, colors, and cuts to improve AI design recommendations.
            </p>
            <Button variant="outline" className="h-10 rounded-xl border-border font-semibold">
              Update Style Profile
            </Button>
          </section>

        </div>

        {/* Right Column: Designs & Recommendations */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Previous Designs */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold text-foreground">Previous Designs</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-2xl bg-muted/30">
              <Shirt className="w-10 h-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-semibold text-foreground mb-1">No custom designs yet</p>
              <p className="text-xs text-muted-foreground max-w-sm text-center mb-6">
                Your past tailored garments will appear here. Start your journey by creating a unique design with our AI.
              </p>
              <Link href="/design-studio" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
                <Button className="bg-primary text-primary-foreground font-semibold h-9 rounded-xl shadow px-6 text-sm">
                  Start Designing
                </Button>
              </Link>
            </div>
          </section>

          {/* Recommended Garments */}
          <section className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Wand2 className="w-5 h-5 text-primary" />
              <h3 className="font-serif text-xl font-bold text-foreground">AI Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative group overflow-hidden rounded-2xl border border-border bg-muted aspect-[4/3] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-rust/20 to-terracotta/20 opacity-50" />
                <Sparkles className="w-8 h-8 text-rust/40" />
                <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
                  <p className="text-sm font-bold text-foreground mb-2">Unlock Recommendations</p>
                  <p className="text-xs text-muted-foreground">Add your style profile to see personalized ideas.</p>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl border border-border bg-muted aspect-[4/3] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-thread-green/20 to-ivory/20 dark:to-ink/20 opacity-50" />
                <Sparkles className="w-8 h-8 text-thread-green/40" />
                <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
                  <p className="text-sm font-bold text-foreground mb-2">Unlock Recommendations</p>
                  <p className="text-xs text-muted-foreground">Add your style profile to see personalized ideas.</p>
                </div>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  )
}
