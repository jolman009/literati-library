-- Enable pgvector and create RAG schema
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Main table for RAG chunks
create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb not null,
  embedding vector(1536) not null,
  content_sha text unique,
  created_at timestamptz not null default now()
);

-- Vector index for similarity search (cosine)
create index if not exists rag_chunks_embedding_ivfflat
  on rag_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Useful metadata indexes
create index if not exists rag_chunks_metadata_gin on rag_chunks using gin (metadata);

-- RPC: insert/upsert a chunk by content_sha
create or replace function insert_rag_chunk(
  p_content text,
  p_metadata jsonb,
  p_embedding vector(1536),
  p_content_sha text
) returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into rag_chunks (content, metadata, embedding, content_sha)
  values (p_content, p_metadata, p_embedding, p_content_sha)
  on conflict (content_sha) do update
    set content = excluded.content,
        metadata = excluded.metadata,
        embedding = excluded.embedding
  returning id into v_id;
  return v_id;
end;
$$;

-- RPC: semantic search with optional route/tags filters
create or replace function rag_search(
  p_query_embedding vector(1536),
  p_match_count int default 6,
  p_route text default null,
  p_tags text[] default null
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  score float4,
  content_sha text
)
language sql
stable
as $$
  select rc.id,
         rc.content,
         rc.metadata,
         cast(1 - (rc.embedding <=> p_query_embedding) as float4) as score,
         rc.content_sha
  from rag_chunks rc
  where (
    p_route is null
    or (
      (rc.metadata ? 'routeHints' and (
        exists (
          select 1
          from jsonb_array_elements_text(rc.metadata->'routeHints') as r(h)
          where r.h = p_route
        )
      ))
      or (rc.metadata ? 'route' and rc.metadata->>'route' = p_route)
    )
  )
  and (
    p_tags is null
    or (
      rc.metadata ? 'tags' and (
        exists (
          select 1
          from jsonb_array_elements_text(rc.metadata->'tags') as t(tag)
          where t.tag = any(p_tags)
        )
      )
    )
  )
  order by rc.embedding <=> p_query_embedding asc
  limit coalesce(p_match_count, 6);
$$;
