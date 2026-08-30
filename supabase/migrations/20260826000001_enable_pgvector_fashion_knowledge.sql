-- ============================================================
-- Threadify Fashion RAG — pgvector & Knowledge Base Migration
-- Migration: 20260826000001_enable_pgvector_fashion_knowledge.sql
-- ============================================================

-- 1. Enable pgvector extension for zero-cost vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Public Fashion Knowledge Vector Store
CREATE TABLE IF NOT EXISTS public.fashion_knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL UNIQUE,
  garment_type TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(384) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HNSW Cosine Similarity Index for sub-10ms vector retrieval
CREATE INDEX IF NOT EXISTS fashion_knowledge_embedding_hnsw_idx
  ON public.fashion_knowledge_vectors
  USING hnsw (embedding vector_cosine_ops);

-- Index metadata & garment_type for fast hybrid filtering
CREATE INDEX IF NOT EXISTS fashion_knowledge_garment_type_idx
  ON public.fashion_knowledge_vectors (garment_type);

CREATE INDEX IF NOT EXISTS fashion_knowledge_category_idx
  ON public.fashion_knowledge_vectors (category);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.fashion_knowledge_vectors ENABLE ROW LEVEL SECURITY;

-- Allow public read access to fashion knowledge (anon & authenticated)
DROP POLICY IF EXISTS "Allow public read access to fashion knowledge" ON public.fashion_knowledge_vectors;
CREATE POLICY "Allow public read access to fashion knowledge"
  ON public.fashion_knowledge_vectors FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow admin full access for seeding/updating knowledge base
DROP POLICY IF EXISTS "Allow admin write access to fashion knowledge" ON public.fashion_knowledge_vectors;
CREATE POLICY "Allow admin write access to fashion knowledge"
  ON public.fashion_knowledge_vectors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Vector Cosine Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_fashion_knowledge(
  query_embedding vector(384),
  match_count INT DEFAULT 5,
  filter_garment_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  document_id TEXT,
  garment_type TEXT,
  category TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.document_id,
    v.garment_type,
    v.category,
    v.content,
    v.metadata,
    1 - (v.embedding <=> query_embedding) AS similarity
  FROM public.fashion_knowledge_vectors v
  WHERE
    (filter_garment_type IS NULL OR LOWER(v.garment_type) = LOWER(filter_garment_type))
  ORDER BY v.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;
