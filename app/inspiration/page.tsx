"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { easing } from "@/lib/motion"
import { Search, Sparkles, Heart, X, Scissors, Info, Clock, IndianRupee, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { inspirationGallery, InspirationItem } from "@/lib/data/inspiration-gallery"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import Image from "next/image"

// Using unique categories from the dataset
const categories = ["All", ...Array.from(new Set(inspirationGallery.map(i => i.category)))]

export default function InspirationGalleryPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selectedImage, setSelectedImage] = React.useState<InspirationItem | null>(null)
  
  const [loadedImages, setLoadedImages] = React.useState<Record<string, boolean>>({})
  const [savedItems, setSavedItems] = React.useState<Record<string, boolean>>({})
  const [likedItems, setLikedItems] = React.useState<Record<string, boolean>>({})

  const filteredItems = inspirationGallery.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.tags.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All" || item.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  // Ensure body scroll is locked when modal is open
  React.useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [selectedImage])

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSavedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setLikedItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black relative selection:bg-orange-500/20 selection:text-orange-600 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 transition-colors">
        <div className="px-4 md:px-8 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-serif text-3xl font-black tracking-tighter text-black dark:text-white transition-colors">
              Threadify
            </span>
          </a>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/explore" className="text-sm font-semibold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Designers</a>
            <a href="/design-studio" className="text-sm font-semibold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">Studio</a>
            <a href="/inspiration" className="text-sm font-semibold text-black dark:text-white border-b-2 border-black dark:border-white pb-1">Inspiration</a>
            <a href="/about" className="text-sm font-semibold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild variant="ghost" className="text-sm font-semibold hover:bg-gray-100 dark:hover:bg-white/10 rounded-full h-10 px-6 hidden sm:inline-flex">
              <a href="/login">Log in</a>
            </Button>
            <Button asChild className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-full h-10 px-6 font-semibold shadow-none">
              <a href="/dashboard">Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-24 pt-8">
        <div className="px-4 md:px-8">
          
          {/* Filters & Search - Floating sticky below header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div className="flex overflow-x-auto w-full md:w-auto pb-2 md:pb-0 gap-2 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`relative px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === category
                      ? "text-white dark:text-black shadow-md"
                      : "bg-gray-100 text-black border border-transparent hover:bg-gray-200 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                  }`}
                >
                  {activeCategory === category && (
                    <motion.div
                      layoutId="activeCategoryBgInspiration"
                      className="absolute inset-0 bg-black dark:bg-white rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {category}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 font-bold" />
              <input
                type="text"
                placeholder="Search styles, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-full border-0 bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-900 dark:text-white dark:focus:ring-white transition-all text-sm font-medium placeholder:text-gray-500 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Luxury Pinterest-style Masonry Grid */}
          {filteredItems.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6 md:gap-8 md:space-y-8">
              {filteredItems.map((item, idx) => {
                const mockTailor = ["Aisha Designs", "Rivaaj Bespoke", "Studio K", "Zari Couture", "Elite Stitch"][idx % 5]
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="break-inside-avoid relative group cursor-zoom-in rounded-3xl overflow-hidden bg-muted shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2"
                    onClick={() => setSelectedImage(item)}
                  >
                    {/* Skeleton while loading */}
                    {!loadedImages[item.id] && (
                       <Skeleton className={`absolute inset-0 z-0 ${item.aspect}`} />
                    )}

                    <Image
                      src={item.image}
                      alt={item.title}
                      width={500}
                      height={800} // providing dimensions helps Image layout
                      className={`w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110 ${loadedImages[item.id] ? "opacity-100" : "opacity-0"}`}
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = item.fallback
                      }}
                    />
                    
                    {/* Premium Glass Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-5">
                      
                      {/* Top Bar: Category & Save */}
                      <div className="flex justify-between items-start transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm border border-white/20">
                          {item.category}
                        </span>
                        <Button 
                          onClick={(e) => toggleSave(e, item.id)}
                          className={`h-9 px-5 rounded-full font-bold shadow-lg transition-all duration-300 ${savedItems[item.id] ? 'bg-white text-black hover:bg-gray-100' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'}`}
                        >
                          {savedItems[item.id] ? 'Saved' : 'Save'}
                        </Button>
                      </div>
                      
                      {/* Bottom Bar: Title, Tailor, Like */}
                      <div className="flex justify-between items-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="flex flex-col text-white max-w-[75%]">
                          <h3 className="font-serif text-lg font-bold leading-tight mb-1 truncate drop-shadow-md">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                              {mockTailor.charAt(0)}
                            </span>
                            By {mockTailor}
                          </div>
                        </div>

                        <Button 
                          onClick={(e) => toggleLike(e, item.id)}
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-black shadow-lg border border-white/30 hover:scale-110 transition-all duration-300 flex-shrink-0"
                        >
                          <Heart className={`w-5 h-5 ${likedItems[item.id] ? 'fill-rose-500 text-rose-500' : 'text-white hover:text-rose-500'}`} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-black dark:text-white mb-3">No inspiration found</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                We couldn&apos;t find any designs matching your criteria.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setActiveCategory("All")
                }}
                className="rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 h-12 px-8 font-semibold shadow-none"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 lg:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={easing.spring}
              className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[95vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Desktop */}
              <button 
                onClick={() => setSelectedImage(null)}
                className="hidden md:flex absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-black dark:text-white" />
              </button>
              
              {/* Image Section (Left) */}
              <div className="w-full md:w-1/2 bg-gray-100 dark:bg-black relative min-h-[40vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
                {/* Close Button - Mobile */}
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="md:hidden absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md items-center justify-center transition-colors flex text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <Image 
                  src={selectedImage.image} 
                  alt={selectedImage.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              
              {/* Details Section (Right) */}
              <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 overflow-y-auto no-scrollbar flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-3">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={(e) => toggleLike(e, selectedImage.id)}
                       className="rounded-full w-12 h-12 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                     >
                       <Heart className={`w-6 h-6 ${likedItems[selectedImage.id] ? 'fill-red-500 text-red-500' : ''}`} />
                     </Button>
                  </div>
                  <Button 
                     onClick={(e) => toggleSave(e, selectedImage.id)}
                     className={`h-12 px-6 rounded-full font-bold text-base shadow-none transition-colors ${savedItems[selectedImage.id] ? 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200' : 'bg-red-500 text-white hover:bg-red-600'}`}
                  >
                    {savedItems[selectedImage.id] ? 'Saved' : 'Save'}
                  </Button>
                </div>
                
                <h2 className="font-serif text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 leading-tight">
                  {selectedImage.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-black dark:text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    {selectedImage.category}
                  </span>
                  <span className="text-gray-500 text-sm font-semibold flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-gray-400 text-gray-400" /> {selectedImage.likes.toLocaleString()}
                  </span>
                </div>
                
                <div className="prose dark:prose-invert mb-8">
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    {selectedImage.description}
                  </p>
                </div>

                {/* Estimate Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex flex-col items-start">
                     <IndianRupee className="w-5 h-5 text-orange-500 mb-2" />
                     <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Stitching</span>
                     <span className="text-sm font-bold text-black dark:text-white mt-1">{selectedImage.estimatedPrice}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex flex-col items-start">
                     <Clock className="w-5 h-5 text-orange-500 mb-2" />
                     <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivery</span>
                     <span className="text-sm font-bold text-black dark:text-white mt-1">{selectedImage.estimatedDelivery}</span>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex flex-col items-start col-span-2 md:col-span-1">
                     <Gauge className="w-5 h-5 text-orange-500 mb-2" />
                     <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</span>
                     <span className="text-sm font-bold text-black dark:text-white mt-1">{selectedImage.difficultyLevel}</span>
                  </div>
                </div>
                
                <div className="mb-10">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Fabric Suggestions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.fabricSuggestions.map(fabric => (
                      <span key={fabric} className="px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                        {fabric}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mb-12 mt-auto">
                  <Button asChild className="h-14 px-8 rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 font-bold text-base flex-1 shadow-none">
                    <Link href={`/design-studio?inspiration=${selectedImage.id}`}>
                      Customize This Design
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-14 px-8 rounded-full border-gray-300 dark:border-zinc-700 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 font-bold text-base shadow-none">
                    <Link href={`/explore`}>
                      <Scissors className="w-5 h-5 mr-2" /> Find Tailor
                    </Link>
                  </Button>
                </div>
                
                {/* Similar Designs Strip */}
                <div className="border-t border-gray-200 dark:border-zinc-800 pt-8">
                  <h4 className="font-bold text-lg text-black dark:text-white mb-6">More {selectedImage.category}</h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                    {inspirationGallery
                      .filter(item => item.id !== selectedImage.id && item.category === selectedImage.category) // STRICT CATEGORY MATCHING
                      .map(similar => (
                        <div 
                          key={similar.id} 
                          className="shrink-0 w-32 md:w-40 cursor-pointer group"
                          onClick={() => setSelectedImage(similar)}
                        >
                          <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                            <Image src={similar.image} alt={similar.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <p className="text-sm font-semibold text-black dark:text-white line-clamp-1">{similar.title}</p>
                        </div>
                    ))}
                    {/* Fallback if no exact category matches */}
                    {inspirationGallery.filter(item => item.id !== selectedImage.id && item.category === selectedImage.category).length === 0 && (
                      <p className="text-gray-500 text-sm italic">No more items in this category.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
