-- =====================================================
-- ShelfQuest Consolidated Migration 005
-- AI / RAG (Retrieval-Augmented Generation) Support
-- =====================================================
-- From: server2/src/migrations/20251025_rag.sql (already clean)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- RAG_CHUNKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL,
    embedding vector(1536) NOT NULL,
    content_sha TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector index for similarity search (cosine)
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_ivfflat
    ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Metadata GIN index for JSON filtering
CREATE INDEX IF NOT EXISTS rag_chunks_metadata_gin
    ON rag_chunks USING gin (metadata);

-- =====================================================
-- RPC: Insert/Upsert a RAG chunk by content_sha
-- =====================================================
CREATE OR REPLACE FUNCTION insert_rag_chunk(
    p_content TEXT,
    p_metadata JSONB,
    p_embedding vector(1536),
    p_content_sha TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO rag_chunks (content, metadata, embedding, content_sha)
    VALUES (p_content, p_metadata, p_embedding, p_content_sha)
    ON CONFLICT (content_sha) DO UPDATE
        SET content = excluded.content,
            metadata = excluded.metadata,
            embedding = excluded.embedding
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- =====================================================
-- RPC: Semantic search with optional route/tags filters
-- =====================================================
CREATE OR REPLACE FUNCTION rag_search(
    p_query_embedding vector(1536),
    p_match_count INT DEFAULT 6,
    p_route TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    score FLOAT4,
    content_sha TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT rc.id,
           rc.content,
           rc.metadata,
           CAST(1 - (rc.embedding <=> p_query_embedding) AS FLOAT4) AS score,
           rc.content_sha
    FROM rag_chunks rc
    WHERE (
        p_route IS NULL
        OR (
            (rc.metadata ? 'routeHints' AND (
                EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(rc.metadata->'routeHints') AS r(h)
                    WHERE r.h = p_route
                )
            ))
            OR (rc.metadata ? 'route' AND rc.metadata->>'route' = p_route)
        )
    )
    AND (
        p_tags IS NULL
        OR (
            rc.metadata ? 'tags' AND (
                EXISTS (
                    SELECT 1
                    FROM jsonb_array_elements_text(rc.metadata->'tags') AS t(tag)
                    WHERE t.tag = ANY(p_tags)
                )
            )
        )
    )
    ORDER BY rc.embedding <=> p_query_embedding ASC
    LIMIT COALESCE(p_match_count, 6);
$$;

-- =====================================================
-- Migration 005 Complete
-- =====================================================
-- Extensions: vector, pgcrypto
-- Tables: rag_chunks
-- Functions: insert_rag_chunk, rag_search
