"use client";
import Image from "next/image"

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, UploadCloud, Link as LinkIcon, X, CheckCircle, AlertCircle, FileImage } from "lucide-react";
import { InspirationItem } from "@/lib/mocks/types";

export default function UploadInspirationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateUpload = async () => {
    setUploading(true);
    setError(null);
    setProgress(0);
    
    // Simulate network progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }
    
    setUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB).");
      return;
    }

    await simulateUpload();

    const newItem: InspirationItem = {
      id: Math.random().toString(36).substring(7),
      type: 'image',
      src: URL.createObjectURL(file), // Mock object URL
      addedAt: new Date().toISOString()
    };
    
    setItems([...items, newItem]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }
    
    await simulateUpload();

    const newItem: InspirationItem = {
      id: Math.random().toString(36).substring(7),
      type: 'url',
      src: urlInput, // Real app would scrape OpenGraph image preview
      addedAt: new Date().toISOString()
    };
    
    setItems([...items, newItem]);
    setUrlInput("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError("Please drop a valid image file.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large (max 10MB).");
      return;
    }

    await simulateUpload();

    const newItem: InspirationItem = {
      id: Math.random().toString(36).substring(7),
      type: 'image',
      src: URL.createObjectURL(file),
      addedAt: new Date().toISOString()
    };
    
    setItems([...items, newItem]);
  };

  return (
    <div className="flex flex-col items-center flex-1 h-full py-12 max-w-4xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 w-full">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-foreground">Upload Inspiration</h1>
        <p className="text-muted-foreground text-lg">Submit a photo, sketch, or link to start your bespoke journey.</p>
      </motion.div>
      
      {/* Upload Zone */}
      <div className="w-full flex flex-col md:flex-row gap-6 mb-8">
        
        {/* Drag and Drop */}
        <div
          className={`flex-1 border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg, image/png, image/webp"
          />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="font-medium text-foreground mb-1">Click to browse or drag image here</p>
          <p className="text-sm text-muted-foreground">JPG, PNG, WEBP (Max 10MB)</p>
        </div>

        {/* URL Input */}
        <div className="flex-1 border border-border rounded-3xl p-8 flex flex-col justify-center bg-background/50">
          <div className="flex items-center gap-3 mb-4 text-foreground font-medium">
            <LinkIcon className="w-5 h-5 text-muted-foreground" />
            <span>Or paste a link</span>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Pinterest, Instagram, or any website"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
            />
            <Button onClick={handleUrlAdd} disabled={!urlInput.trim() || uploading} variant="secondary" className="px-6 rounded-xl">
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Status / Errors */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full mb-6 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full mb-8 overflow-hidden">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Analyzing and uploading... {progress}%</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Grid */}
      {items.length > 0 && (
        <div className="w-full mb-12">
          <h3 className="font-serif text-xl font-bold mb-4">Your Inspiration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border group"
                >
                  {item.type === 'image' ? (
                    <Image width={400} height={400} src={item.src} alt="Upload preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center p-4 text-center break-all">
                      <LinkIcon className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground line-clamp-3">{item.src}</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="bg-destructive text-destructive-foreground p-2 rounded-full hover:scale-110 transition-transform"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Next Step CTA */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-auto pt-8 flex items-center justify-center gap-4">
            <div className="flex items-center text-primary font-medium mr-4">
              <CheckCircle className="w-5 h-5 mr-2" /> Upload complete
            </div>
            <Button onClick={() => router.push("/how-it-works/customize")} className="h-14 px-8 rounded-full shadow-lg group font-medium text-base">
              Continue to Custom Design
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
