"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { MarketingNavbar } from "@/components/shared/MarketingNavbar";
import { Footer } from "@/components/shared/Footer";
import React from "react";

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <MarketingNavbar />
      
      <main className="flex-1 flex flex-col pt-24 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1 container mx-auto max-w-5xl px-4 md:px-8 h-full flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
