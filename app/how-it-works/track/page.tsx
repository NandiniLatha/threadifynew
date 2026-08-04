import Image from "next/image"
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Package, Clock, Truck, Camera, MapPin } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const stages = [
  { id: "confirmed", label: "Order Confirmed", date: "Oct 12, 10:00 AM", completed: true },
  { id: "fabric", label: "Fabric Purchased", date: "Oct 13, 2:30 PM", completed: true, photos: ["/images/inspiration/menswear.png"] },
  { id: "cutting", label: "Cutting & Pattern", date: "Oct 14, 11:15 AM", completed: true, photos: ["/images/inspiration/designer_sarees.png"] },
  { id: "stitching", label: "Stitching", date: "In Progress", completed: false },
  { id: "quality", label: "Quality Check", date: null, completed: false },
  { id: "packaging", label: "Packaging", date: null, completed: false },
  { id: "shipping", label: "Out for Delivery", date: null, completed: false },
  { id: "delivered", label: "Delivered", date: null, completed: false },
];

export default function TrackProductionPage() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  
  // Animation simulation for progression
  const [activeStage, setActiveStage] = useState(2); // Start at Cutting

  useEffect(() => {
    // Simulate progression to Stitching after 2 seconds
    const timer = setTimeout(() => {
      setActiveStage(3);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const progressPercentage = (activeStage / (stages.length - 1)) * 100;

  return (
    <div className="flex flex-col flex-1 h-full py-12 max-w-5xl mx-auto w-full relative">
      <div className="w-full flex items-center justify-between mb-8">
        <Button onClick={() => router.push("/how-it-works/choose-tailor")} variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 w-full flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">Track Production</h1>
          <p className="text-muted-foreground text-lg">Receive updates and photos during the tailoring process.</p>
        </div>
        <div className="bg-background border border-border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Est. Delivery</p>
            <p className="font-bold text-foreground">Oct 24 - Oct 26</p>
          </div>
        </div>
      </motion.div>

      <div className="w-full flex flex-col lg:flex-row gap-12 mb-12">
        {/* Left: Stepper */}
        <div className="flex-1 bg-background border border-border rounded-[2rem] p-8 shadow-sm">
          <h3 className="font-serif font-bold text-2xl mb-8">Order Status</h3>
          
          <div className="relative pl-6">
            {/* Progress Line */}
            <div className="absolute left-[31px] top-4 bottom-8 w-0.5 bg-muted rounded-full">
              <motion.div 
                className="w-full bg-primary origin-top"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: progressPercentage / 100 }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ height: '100%' }}
              />
            </div>

            <div className="space-y-8 relative">
              {stages.map((stage, idx) => {
                const isCompleted = idx <= activeStage;
                const isCurrent = idx === activeStage;
                
                return (
                  <div key={stage.id} className="flex gap-6 relative z-10">
                    {/* Node */}
                    <div className="shrink-0 mt-0.5">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCompleted ? "hsl(var(--primary))" : "hsl(var(--background))",
                          borderColor: isCompleted ? "hsl(var(--primary))" : "hsl(var(--border))",
                          scale: isCurrent ? 1.2 : 1
                        }}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-sm z-10 ${
                          isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                        }`}
                      >
                        {isCompleted && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                            <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <h4 className={`font-medium text-lg ${isCurrent ? 'text-primary' : (isCompleted ? 'text-foreground' : 'text-muted-foreground')}`}>
                        {stage.label}
                      </h4>
                      {stage.date && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {stage.date}
                        </p>
                      )}
                      
                      {/* Photo Updates */}
                      <AnimatePresence>
                        {isCompleted && stage.photos && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            className="flex gap-2 overflow-hidden"
                          >
                            {stage.photos.map((photo, pIdx) => (
                              <div key={pIdx} className="w-20 h-20 rounded-xl overflow-hidden border border-border group relative">
                                <Image width={400} height={400} src={photo} alt={`${stage.label} update`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Map/Details */}
        <div className="flex-1 lg:max-w-md flex flex-col gap-6">
          <div className="bg-background border border-border rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-serif font-bold text-xl mb-4">Delivery Address</h3>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">John Doe</p>
                <p className="text-muted-foreground mt-1">123 Fashion Ave, Suite 400<br/>New York, NY 10001<br/>United States</p>
              </div>
            </div>
          </div>
          
          <div className="bg-background border border-border rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-serif font-bold text-xl mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order #</span>
                <span className="font-medium">TRD-98102</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tailor</span>
                <span className="font-medium">Priya Sharma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Garment</span>
                <span className="font-medium">Bespoke Suit</span>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-muted/20 border border-border rounded-[2rem] p-6 flex flex-col items-center justify-center text-center">
            <Truck className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground font-medium mb-1">Shipping via Express Courier</p>
            <p className="text-xs text-muted-foreground">Tracking ID will be generated upon Shipped.</p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-auto pt-8 flex w-full justify-end border-t border-border">
        <Button onClick={() => router.push("/how-it-works/wear")} className="h-14 px-8 rounded-full shadow-lg group font-medium text-base">
          Outfit Delivered (Next Step)
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
}
