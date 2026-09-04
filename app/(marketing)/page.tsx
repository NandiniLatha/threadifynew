"use client"

import * as React from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { Footer } from "@/components/shared/Footer"
import { easing } from "@/lib/motion"
import { MarketingNavbar } from "@/components/shared/MarketingNavbar"
import DesignerCard from "@/components/shared/explore/DesignerCard"
import { getTailorConfig } from "@/lib/data/tailor-config"
import { getFashionPortfolioImages, getFashionCoverImage } from "@/lib/data/fashion-images"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { Scissors, ArrowRight, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { HowItWorksJourney } from "@/components/luxury/HowItWorksJourney"
import { WhyThreadifySection } from "@/components/luxury/WhyThreadifySection"

// ─── Dynamic imports — split heavy sections into separate JS chunks ──────────
// Each lazy-loaded section only downloads when first rendered (below the fold).
import { CinematicHero } from "@/components/CinematicHero"

const PremiumPortfolioGallery = dynamic(
  () => import("@/components/PremiumPortfolioGallery").then((m) => ({ default: m.PremiumPortfolioGallery })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-3xl" />
      </div>
    ),
  }
)

const AboutFounder = dynamic(
  () => import("@/components/luxury/AboutFounder").then((m) => ({ default: m.AboutFounder })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-96 rounded-3xl" />,
  }
)

function FallbackImage({ src, alt, ...props }: any) {
  const [imgSrc, setImgSrc] = React.useState(src)
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc("/images/hero-editorial.webp")}
    />
  )
}

const Divider = () => (
  <div className="w-full flex items-center justify-center py-20 opacity-40">
    <div className="w-1/3 border-t border-dashed border-primary/40" />
    <Scissors className="w-4 h-4 mx-4 text-primary/60 rotate-45" />
    <div className="w-1/3 border-t border-dashed border-primary/40" />
  </div>
)

export default function MarketingPage() {
  const shouldReduceMotion = usePrefersReducedMotion()

  // ─── Memoised motion variants (stable across re-renders) ────────────────
  const luxuryReveal = React.useMemo(() => ({
    hidden: { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: 1.2, ease: easing.easeOut },
    },
  }), [])

  const staggerContainer = React.useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.15 },
    },
  }), [shouldReduceMotion])

  const tailors = React.useMemo(() => [
    {
      id: "priya-sharma",
      name: "Priya Sharma",
      isVerified: true,
      rating: 4.95,
      ordersCompleted: 280,
      config: getTailorConfig("priya-sharma", "Bridal Couture"),
      images: getFashionPortfolioImages("Bridal Couture", 5, 0),
      badge: "top-rated" as const,
    },
    {
      id: "vikram-malhotra",
      name: "Vikram Malhotra",
      isVerified: true,
      rating: 4.9,
      ordersCompleted: 310,
      config: getTailorConfig("vikram-malhotra", "Menswear"),
      images: getFashionPortfolioImages("Menswear", 5, 0),
      badge: "ai-recommended" as const,
    },
    {
      id: "lakshmi-studio",
      name: "Lakshmi Stitch Studio",
      isVerified: true,
      rating: 4.8,
      ordersCompleted: 190,
      config: getTailorConfig("lakshmi-studio", "Designer Blouses"),
      images: getFashionPortfolioImages("Designer Blouses", 5, 0),
    },
    {
      id: "maharaja-groom",
      name: "Maharaja Groom Wear",
      isVerified: true,
      rating: 5.0,
      ordersCompleted: 340,
      config: getTailorConfig("maharaja-groom", "Sherwanis"),
      images: getFashionPortfolioImages("Sherwanis", 5, 0),
      badge: "top-rated" as const,
    },
  ], [])

  const testimonials = [
    { quote: "Threadify transformed how I think about my wardrobe. I uploaded a vintage dress photo, and Ravi Kumar created a modern version that fits me flawlessly.", name: "Priya Sharma", role: "Creative Director", beforeImg: getFashionCoverImage("Bridal Couture", 0), afterImg: getFashionCoverImage("Bridal Couture", 1) },
    { quote: "Off-the-rack suits never fit my frame right. Lakshmi Boutique drafted a bespoke double-breasted wool suit that looks and feels premium.", name: "Ananya Reddy", role: "Consultant", beforeImg: getFashionCoverImage("Menswear", 0), afterImg: getFashionCoverImage("Menswear", 1) },
    { quote: "The transparency of escrow payments made the process stress-free. Suresh Master Tailor kept me updated with pictures throughout the entire tailoring.", name: "Sneha Patel", role: "Fashion Blogger", beforeImg: getFashionCoverImage("Western Dresses", 0), afterImg: getFashionCoverImage("Western Dresses", 1) }
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      <MarketingNavbar />
      <CinematicHero />
      
      {/* Editorial Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-serif font-black text-foreground/5 opacity-5 pointer-events-none whitespace-nowrap z-[-1]">
        ATELIER
      </div>

      <Divider />

      {/* 3. How It Works Section */}
      <HowItWorksJourney />

      <Divider />

      {/* 4. Inspiration Gallery */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight">Visions Realized</h2>
            <p className="text-muted-foreground mt-6 text-lg font-light">Immerse yourself in the breathtaking creations brought to life by our master tailors.</p>
          </motion.div>
        </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="w-full">
          <PremiumPortfolioGallery />
        </motion.div>
      </section>

      <Divider />

      {/* 5. Designer Showcase */}
      <section id="explore" className="py-24 px-4 md:px-8 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight">The Masters</h2>
            <p className="text-muted-foreground mt-6 text-lg font-light">Verified artisans entrusted with the craft of fine tailoring.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tailors.map((tailor) => (
              <DesignerCard
                key={tailor.id}
                id={tailor.id}
                name={tailor.name}
                isVerified={tailor.isVerified}
                rating={tailor.rating}
                ordersCompleted={tailor.ordersCompleted}
                config={tailor.config}
                images={tailor.images}
                badge={tailor.badge}
                initialSaved={false}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <Divider />

      {/* 6. Features Grid */}
      <WhyThreadifySection />

      <Divider />

      {/* 7. Customer Reviews */}
      <section id="testimonials" className="py-24 px-4 md:px-8 relative z-10 pb-40">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight">Legacies Woven</h2>
            <p className="text-muted-foreground mt-6 text-lg font-light">Stories from those who have experienced true bespoke tailoring.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <motion.div key={idx} variants={luxuryReveal} className="flex flex-col justify-between p-10 rounded-[2rem] border border-border/30 bg-background/40 backdrop-blur-md shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="space-y-6">
                  <div className="flex text-amber-500 space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500" />
                    ))}
                  </div>
                  <blockquote className="text-foreground/90 font-serif text-lg italic leading-relaxed">
                    &ldquo;{test.quote}&rdquo;
                  </blockquote>
                </div>
                <div className="mt-10 pt-8 border-t border-border/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-foreground font-serif">{test.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{test.role}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full border border-border/50 overflow-hidden relative shadow-sm" title="Inspiration Image">
                      <FallbackImage src={test.beforeImg} alt="Inspiration" fill className="object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary/40" />
                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 overflow-hidden relative shadow-md" title="Finished Garment">
                      <FallbackImage src={test.afterImg} alt="Finished" fill className="object-cover hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Divider />

      <AboutFounder />

      <Footer />
    </div>
  )
}
