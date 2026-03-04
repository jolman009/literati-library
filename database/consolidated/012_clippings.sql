-- =====================================================
-- ShelfQuest Consolidated Migration 012
-- Clippings (Web Clipper — Phase 2.2)
-- =====================================================
-- Stores web page clippings captured by the browser extension.
-- Each clipping belongs to a user and may optionally link to a
-- library book via the nullable book_id FK.

-- =====================================================
-- TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS clippings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id     UUID REFERENCES books(id) ON DELETE SET NULL,

    url         TEXT NOT NULL,
    title       VARCHAR(500) NOT NULL,
    selected_text TEXT,
    content     TEXT,                     -- markdown-converted selection

    site_name   VARCHAR(255),
    description TEXT,
    image_url   TEXT,
    favicon_url TEXT,

    tags        TEXT[] DEFAULT '{}',
    is_read     BOOLEAN DEFAULT false,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_clippings_user_created
    ON clippings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clippings_user_unread
    ON clippings (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_clippings_book
    ON clippings (book_id)
    WHERE book_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY  (same two-policy pattern as 008)
-- =====================================================
DO $$ BEGIN ALTER TABLE clippings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

DROP POLICY IF EXISTS "clippings_select_own" ON clippings;
CREATE POLICY "clippings_select_own" ON clippings
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "clippings_service_role_all" ON clippings;
CREATE POLICY "clippings_service_role_all" ON clippings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TRIGGER  (reuse update_updated_at_column from 007)
-- =====================================================
DROP TRIGGER IF EXISTS update_clippings_updated_at ON clippings;
CREATE TRIGGER update_clippings_updated_at
    BEFORE UPDATE ON clippings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
