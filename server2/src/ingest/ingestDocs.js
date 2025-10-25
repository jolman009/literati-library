// src/ingest/ingestDocs.js
// Ingests markdown/help content, chunks, embeds, and upserts into Supabase (rag_chunks)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import OpenAI from 'openai';
import { supabase } from '../config/supabaseClient.js';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

const ROOT = path.resolve(path.join(__dirname, '..', '..', '..'));
const SOURCES = [
  'docs',
  'README.md',
  'client2/src/pages',
];

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function isTextFile(file) {
  return /(\.md|\.mdx|\.txt|README\.md|\.jsx|\.tsx|\.js)$/i.test(file);
}

function readSourceFiles() {
  const files = [];
  for (const src of SOURCES) {
    const full = path.resolve(ROOT, src);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) {
      for (const f of walk(full)) if (isTextFile(f)) files.push(f);
    } else if (isTextFile(full)) files.push(full);
  }
  return files;
}

function stripJsx(content) {
  // Very simple stripper for JSX/JS to human-readable text
  return content
    .replace(/<[^>]+>/g, ' ')        // rudimentary tag removal
    .replace(/\{[^}]*\}/g, ' ')     // remove inline JS blocks
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // block comments
    .replace(/\/\/.*$/gm, ' ')      // line comments
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

function normalizeText(file, raw) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.md' || ext === '.mdx' || /README\.md$/i.test(file)) return raw;
  return stripJsx(raw);
}

function chunkText(text, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let i = 0; const len = text.length;
  while (i < len) {
    const end = Math.min(len, i + chunkSize);
    const slice = text.slice(i, end).trim();
    if (slice.length > 100) chunks.push(slice);
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

function metaFor(file) {
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  const base = path.basename(file).toLowerCase();
  const routeHints = [];
  const tags = [];
  if (rel.includes('/Upload') || /upload/i.test(rel)) { routeHints.push('/upload'); tags.push('upload'); }
  if (/notes?/i.test(rel)) { routeHints.push('/notes'); tags.push('notes'); }
  if (/library/i.test(rel)) { routeHints.push('/library'); tags.push('library'); }
  if (/dashboard|landing/i.test(rel)) { routeHints.push('/dashboard'); tags.push('dashboard'); }
  if (/onboarding|guide/i.test(rel)) { routeHints.push('/onboarding'); tags.push('onboarding'); }
  return {
    sourcePath: rel,
    title: base.replace(/\.(mdx?|jsx?|txt)$/i, ''),
    routeHints: Array.from(new Set(routeHints)),
    tags: Array.from(new Set(tags))
  };
}

async function embedBatch(openai, inputs) {
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: inputs });
  return res.data.map(d => d.embedding);
}

async function upsertChunk({ content, metadata, embedding, contentSha }) {
  const { data, error } = await supabase.rpc('insert_rag_chunk', {
    p_content: content,
    p_metadata: metadata,
    p_embedding: embedding,
    p_content_sha: contentSha
  });
  if (error) throw error;
  return data;
}

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is required');
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const files = readSourceFiles();
  console.log(`Found ${files.length} candidate files`);

  let totalChunks = 0;
  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const text = normalizeText(file, raw);
    if (!text || text.length < 200) continue;
    const chunks = chunkText(text);
    if (chunks.length === 0) continue;

    // Embed in batches of 64
    const batchSize = 64;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize);
      const embeddings = await embedBatch(openai, slice);
      for (let j = 0; j < slice.length; j++) {
        const content = slice[j];
        const contentSha = sha1(`${file}::${i + j}::${content}`);
        const metadata = metaFor(file);
        try {
          await upsertChunk({ content, metadata, embedding: embeddings[j], contentSha });
          totalChunks += 1;
        } catch (e) {
          console.warn('Upsert failed (continuing):', e?.message || e);
        }
      }
    }
  }
  console.log(`Ingestion complete. Upserted ${totalChunks} chunks.`);
}

run().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});

