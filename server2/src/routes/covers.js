// src/routes/covers.js
import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { ensureCoverForBook } from "../services/covers.js";

export function coversRouter(authenticateToken) {
  const router = express.Router();

  router.post("/resolve", authenticateToken, async (req, res) => {
    try {
      const bookId = req.body?.bookId || req.query?.bookId;
      if (!bookId) return res.status(400).json({ error: "bookId required" });

      const { data: book, error } = await supabase
        .from("books")
        .select("id, user_id, title, author, isbn10, isbn13, cover_url, cover_base, cover_etag")
        .eq("id", bookId)
        .eq("user_id", req.user.id)
        .single();

      if (error || !book) return res.status(404).json({ error: "Book not found" });

      const result = await ensureCoverForBook(book);
      return res.json(result);
    } catch (e) {
      console.error("cover resolve error:", e);
      return res.status(500).json({ error: "Cover resolve failed", details: e.message });
    }
  });

  router.get("/etag", authenticateToken, async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id required" });

    const { data, error } = await supabase
      .from("books")
      .select("cover_etag")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Not found" });
    return res.json({ etag: data.cover_etag });
  });

  return router;
}
