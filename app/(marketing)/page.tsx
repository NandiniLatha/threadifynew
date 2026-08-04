"use client"

import * as React from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Footer } from "@/components/shared/Footer"
import { easing } from "@/lib/motion"
import { MarketingNavbar } from "@/components/shared/MarketingNavbar"
import DesignerCard from "@/components/explore/DesignerCard"
import { getTailorConfig } from "@/lib/data/tailor-config"
import { getFashionPortfolioImages, getFashionCoverImage } from "@/lib/data/fashion-images"
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Upload, Wand2, FileText, UserCheck, Package, Sparkles,
  ShieldCheck, MessageSquare, Scissors, ArrowRight, X, Star,
  Loader2, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InteractiveProcessCard } from "@/components/InteractiveProcessCard"
// ─── Dynamic imports — split heavy sections into separate JS chunks ──────────
// Each lazy-loaded section only downloads when first rendered (below the fold).
const CinematicHero = dynamic(
  () => import("@/components/CinematicHero").then((m) => ({ default: m.CinematicHero })),
  {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-background/50 animate-pulse rounded-3xl" />,
  }
)

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
      onError={() => setImgSrc("https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&h=600&q=80")}
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
  const router = useRouter()
  const supabase = createClient()
  const shouldReduceMotion = usePrefersReducedMotion()
  
  const { scrollYProgress } = useScroll()
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -150])

  // Interactive Features State
  const [activeFeature, setActiveFeature] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [notifyLoading, setNotifyLoading] = React.useState(false)
  const [notifySuccess, setNotifySuccess] = React.useState(false)

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

  const steps = React.useMemo(() => [
    { title: "Upload Inspiration", description: "Submit a photo, sketch, or link of the garment you desire.", icon: Upload, href: "/how-it-works/upload" },
    { title: "Customize Design", description: "Our AI details fabric, cut, and patterns for your approval.", icon: Wand2, href: "/how-it-works/customize" },
    { title: "Receive Price Quotes", description: "Get transparent quotes from expert tailors in our network.", icon: FileText, href: "/how-it-works/quotations" },
    { title: "Choose Tailor", description: "Review ratings, portfolios, and choose the perfect fit.", icon: UserCheck, href: "/how-it-works/choose-tailor" },
    { title: "Track Production", description: "Receive updates and photos during the tailoring process.", icon: Package, href: "/how-it-works/track" },
    { title: "Wear Your Outfit", description: "Delivered to your door with a perfect fit guarantee.", icon: Sparkles, href: "/how-it-works/wear" },
  ], [])

  const features = React.useMemo(() => [
    { title: "AI Design Recognition", description: "Scan any image to identify fabrics, seam structures, and styling details automatically.", icon: Wand2, actionType: "link", href: "/design-studio" },
    { title: "Verified Master Tailors", description: "Every tailor undergoes rigorous craftsmanship evaluation and verification.", icon: Scissors, actionType: "link", href: "/explore" },
    { title: "Secure Payments", description: "Funds are held in secure escrow and only released after you confirm the final fit.", icon: ShieldCheck, actionType: "modal", modalId: "secure_payments" },
    { title: "Live Chat & Consultations", description: "Direct message your tailor to collaborate on adjustments and check details.", icon: MessageSquare, actionType: "link", href: "/dashboard/messages", requiresAuth: true },
    { title: "Real-Time Tracking", description: "See the stages of production from pattern drafting to final pressing.", icon: Package, actionType: "link", href: "/dashboard/orders", requiresAuth: true },
    { title: "Personalized Fashion", description: "Every garment is made-to-measure for your unique silhouette and style.", icon: Sparkles, actionType: "link", href: "/dashboard/custom-design", requiresAuth: true },
  ], [])

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

  const handleFeatureClick = async (feature: any) => {
    if (feature.actionType === "modal") {
      setModalOpen(true)
      setNotifySuccess(false)
      return
    }
    setActiveFeature(feature.title)
    if (feature.requiresAuth) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (feature.href) router.push(`/login?next=${encodeURIComponent(feature.href)}`)
        return
      }
    }
    if (feature.href) router.push(feature.href)
  }

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
      <section id="how-it-works" className="py-24 px-4 md:px-8 relative z-10">
        <motion.div style={{ y: shouldReduceMotion ? 0 : yParallax }} className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight">The Process</h2>
            <p className="text-muted-foreground mt-6 text-lg md:text-xl font-light">A seamless journey to absolute sartorial perfection.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <InteractiveProcessCard
                key={idx}
                stepNumber={idx + 1}
                title={step.title}
                description={step.description}
                href={step.href}
                variants={luxuryReveal}
                className="group relative flex flex-col p-10 rounded-[2rem] border border-border/30 bg-background/40 backdrop-blur-md hover:border-primary/40 transition-colors duration-500 overflow-hidden w-full h-full"
              >
                <div className="absolute -right-4 -top-4 font-serif text-[8rem] font-bold text-muted-foreground/5 group-hover:text-primary/10 transition-colors duration-700 pointer-events-none">
                  {idx + 1}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent text-primary flex items-center justify-center mb-8 shadow-inner">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-muted-foreground font-light leading-relaxed">
                  {step.description}
                </p>
              </InteractiveProcessCard>
            ))}
          </motion.div>
        </motion.div>
      </section>

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
      <section id="features" className="py-24 px-4 md:px-8 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={luxuryReveal} className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground tracking-tight">Craftsmanship meets Intelligence</h2>
            <p className="text-muted-foreground mt-6 text-lg font-light">State of the art technology elevating traditional bespoke tailoring.</p>
          </motion.div>

          <AnimatePresence>
            {modalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-background border border-border/50 rounded-[2rem] p-10 shadow-2xl max-w-md w-full relative">
                  <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors focus-visible:outline-none">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent text-primary flex items-center justify-center mb-8 shadow-inner">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-foreground mb-4">Secure Secure Payment</h3>
                  <p className="text-muted-foreground text-sm mb-10 leading-relaxed font-light">
                    We&apos;re finalizing our Razorpay integration. Your funds will be held in a secure vault and released exclusively upon your confirmation of the final fit.
                  </p>
                  {notifySuccess ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-3 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>You&apos;re on the exclusive list.</span>
                    </motion.div>
                  ) : (
                    <Button onClick={() => { setNotifyLoading(true); setTimeout(() => { setNotifyLoading(false); setNotifySuccess(true) }, 1200) }} disabled={notifyLoading} className="w-full h-14 bg-primary text-primary-foreground font-serif text-base font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
                      {notifyLoading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : null}
                      Request Early Access
                    </Button>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.button key={idx} variants={luxuryReveal} onClick={() => handleFeatureClick(feature)} className="group flex flex-col items-start text-left p-8 rounded-[2rem] border border-border/30 bg-background/30 backdrop-blur-sm hover:border-primary/40 hover:bg-background/60 transition-all duration-500 w-full overflow-hidden relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-transparent text-primary flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground mb-3 group-hover:text-primary transition-colors flex items-center justify-between w-full">
                  {feature.title}
                  {activeFeature === feature.title && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </h3>
                <p className="text-muted-foreground text-sm font-light leading-relaxed">{feature.description}</p>
                
                <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

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
