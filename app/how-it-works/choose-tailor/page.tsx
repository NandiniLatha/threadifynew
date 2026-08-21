"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, MessageSquare, Check, X, ShieldCheck, Send, Award, Clock } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatINR } from "@/lib/utils/currency";

interface TailorDetail {
  id: string;
  name: string;
  studio: string;
  rating: number;
  reviews: number;
  experience: number;
  completedOrders: number;
  specialization: string;
  responseTime: string;
  portfolio: string[];
  price?: number;
  deliveryDays?: number;
  available: boolean;
}

const fallbackTailors: TailorDetail[] = [
  {
    id: "t1",
    name: "Priya Sharma",
    studio: "Artisanal Ethnic Studio",
    rating: 4.95,
    reviews: 280,
    experience: 12,
    completedOrders: 420,
    specialization: "Custom Ethnic & Bespoke Tailoring",
    responseTime: "2 hrs",
    available: true,
    portfolio: ["/images/fashion/designer_1.webp", "/images/fashion/designer_2.webp", "/images/fashion/designer_3.webp"],
    price: 3200,
    deliveryDays: 7,
  },
  {
    id: "t2",
    name: "Vikram Malhotra",
    studio: "Heritage Suitcrafters",
    rating: 4.85,
    reviews: 310,
    experience: 15,
    completedOrders: 510,
    specialization: "Structured Suits & Blazers",
    responseTime: "4 hrs",
    available: true,
    portfolio: ["/images/fashion/designer_2.webp", "/images/fashion/designer_3.webp", "/images/fashion/designer_1.webp"],
    price: 4800,
    deliveryDays: 10,
  },
];

export default function ChooseTailorPage() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const [tailorsList, setTailorsList] = useState<TailorDetail[]>(fallbackTailors);
  const [selectedTailor, setSelectedTailor] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "tailor"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chosen tailor from accepted quote on mount
  useEffect(() => {
    try {
      const storedTailor = localStorage.getItem("threadify_selected_tailor");
      if (storedTailor) {
        const parsed = JSON.parse(storedTailor);
        const dynamicTailor: TailorDetail = {
          id: parsed.id || "t_accepted",
          name: parsed.name || "Artisan Tailor",
          studio: parsed.studio || "Bespoke Studio",
          rating: parsed.rating || 4.9,
          reviews: parsed.reviews || 240,
          experience: parsed.experience || 12,
          completedOrders: parsed.completedOrders || 350,
          specialization: parsed.specialization || "Custom Bespoke Couture",
          responseTime: parsed.responseTime || "1 hr",
          portfolio: parsed.portfolio || ["/images/fashion/designer_1.webp", "/images/fashion/designer_2.webp", "/images/fashion/designer_3.webp"],
          price: parsed.price || 3500,
          deliveryDays: parsed.deliveryDays || 8,
          available: true,
        };

        setTailorsList((prev) => {
          const exists = prev.some((t) => t.id === dynamicTailor.id);
          return exists ? prev : [dynamicTailor, ...prev];
        });
        setSelectedTailor(dynamicTailor.id);

        const priceText = dynamicTailor.price ? formatINR(dynamicTailor.price) : "your estimate";
        setMessages([
          {
            sender: "tailor",
            text: `Namaste! Thank you for accepting my quote of ${priceText}. I've reviewed your design requirements and am ready to begin crafting your garment.`,
          },
        ]);
        return;
      }
    } catch {
      // fallback
    }

    if (fallbackTailors.length > 0) {
      setSelectedTailor(fallbackTailors[0].id);
      setMessages([
        {
          sender: "tailor",
          text: "Hello! I saw your quotation acceptance. I'm excited to work on your custom design.",
        },
      ]);
    }
  }, []);

  const activeTailor = tailorsList.find((t) => t.id === selectedTailor);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = { sender: "user" as const, text: inputValue };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Auto-reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "tailor",
          text: "Got it! I have updated your order specifications with these details.",
        },
      ]);
    }, 1200);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  const confirmSelection = () => {
    if (activeTailor) {
      try {
        localStorage.setItem("threadify_confirmed_tailor", JSON.stringify(activeTailor));
      } catch {
        // ignore
      }
    }
    router.push("/how-it-works/track");
  };

  return (
    <div className="flex flex-col flex-1 h-full py-12 max-w-6xl mx-auto w-full relative">
      <div className="w-full flex items-center justify-between mb-8">
        <Button
          onClick={() => router.push("/how-it-works/quotations")}
          variant="ghost"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 w-full">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">Choose Tailor</h1>
        <p className="text-muted-foreground text-lg">Review portfolios and confirm your artisan master.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tailor List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {tailorsList.map((tailor) => (
            <button
              key={tailor.id}
              onClick={() => {
                setSelectedTailor(tailor.id);
                setChatOpen(false);
              }}
              className={`text-left p-6 rounded-[2rem] border transition-all ${
                selectedTailor === tailor.id
                  ? "bg-primary/5 border-primary shadow-md"
                  : "bg-background border-border hover:border-primary/40"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-serif font-bold text-xl">{tailor.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{tailor.studio}</p>
                </div>
                {tailor.available && (
                  <span className="bg-green-500/10 text-green-600 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold">
                    Available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-amber-500 font-medium mb-3">
                <Star className="w-4 h-4 fill-current" /> {tailor.rating}{" "}
                <span className="text-muted-foreground">({tailor.reviews})</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="bg-muted px-2 py-1 rounded-md">{tailor.experience} Yrs Exp</span>
                <span className="bg-muted px-2 py-1 rounded-md">Responds in {tailor.responseTime}</span>
                {tailor.price && (
                  <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded-md">
                    {formatINR(tailor.price)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Profile Detail / Chat View */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!activeTailor ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] border-2 border-dashed border-border rounded-[2rem] flex items-center justify-center text-muted-foreground"
              >
                Select a tailor to view details
              </motion.div>
            ) : chatOpen ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full min-h-[500px] bg-background border border-border rounded-[2rem] flex flex-col overflow-hidden shadow-sm relative"
              >
                {/* Chat Header */}
                <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif font-bold">
                      {activeTailor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{activeTailor.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Master Artisan
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setChatOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                          m.sender === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                            : "bg-muted text-foreground rounded-bl-sm border border-border/50"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-border/50 bg-background flex gap-2"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message tailor with questions..."
                    className="flex-1 bg-muted/30 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                  <Button type="submit" size="icon" className="rounded-full shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-background border border-border rounded-[2rem] p-8 shadow-sm h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-serif text-3xl font-bold mb-1 text-foreground">{activeTailor.name}</h2>
                    <p className="text-xs font-semibold text-primary mb-2">{activeTailor.studio}</p>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Specialist in {activeTailor.specialization.toLowerCase()}. Dedicated to perfect precision fits and luxury hand-finishing.
                    </p>
                  </div>
                  <Button
                    onClick={() => setChatOpen(true)}
                    variant="outline"
                    className="rounded-full gap-2 border-border"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat
                  </Button>
                </div>

                {activeTailor.price && (
                  <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Accepted Quote Total</span>
                      <span className="font-bold text-xl text-primary">{formatINR(activeTailor.price)}</span>
                    </div>
                    {activeTailor.deliveryDays && (
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Estimated Delivery</span>
                        <span className="font-semibold text-sm text-foreground">{activeTailor.deliveryDays} Days</span>
                      </div>
                    )}
                  </div>
                )}

                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-4">
                  Previous Work Portfolio
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-auto">
                  {activeTailor.portfolio.map((img, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt="Previous Work item"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-border/50 mt-8 flex justify-end">
                  <Button
                    onClick={confirmSelection}
                    className="h-14 px-8 rounded-full shadow-lg font-medium text-base gap-2"
                  >
                    <Check className="w-5 h-5" /> Confirm {activeTailor.name}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

