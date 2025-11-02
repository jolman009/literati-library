// server2/src/routes/dataExport.js - GDPR Data Export API
import express from 'express';
import { supabase } from '../config/supabaseClient.js';

const supabaseAdmin = supabase; // Using service role key with admin privileges

export default function dataExportRouter(authenticateToken) {
  const router = express.Router();

/**
 * GET /api/data-export/user-data
 * Export all user data in JSON format (GDPR Article 20 - Right to Data Portability)
 */
  router.get('/user-data', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`📦 Starting data export for user ${userId}`);

    // 1. Get user account information
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Get all books
    const { data: books = [], error: booksError } = await supabaseAdmin
      .from('books')
      .select(`
        id, title, author, isbn, publisher, published_date,
        page_count, language, description, genre,
        added_date, file_path, cover_image_url,
        last_accessed, file_size, file_type, status
      `)
      .eq('user_id', userId)
      .order('added_date', { ascending: false });

    if (booksError) console.error('❌ Books fetch error:', booksError);

    // 3. Get reading progress for all books
    const { data: readingProgress = [], error: progressError } = await supabaseAdmin
      .from('reading_progress')
      .select(`
        book_id, current_page, total_pages,
        progress_percentage, last_read_date,
        reading_status, time_spent_seconds
      `)
      .eq('user_id', userId);

    if (progressError) console.error('❌ Reading progress fetch error:', progressError);

    // 4. Get all notes and highlights
    const { data: notes = [], error: notesError} = await supabaseAdmin
      .from('notes')
      .select(`
        id, book_id, content, type,
        page, position, color, tags,
        created_at, updated_at,
        books (title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notesError) console.error('❌ Notes fetch error:', notesError);

    // 5. Get reading sessions
    const { data: sessions = [], error: sessionsError } = await supabaseAdmin
      .from('reading_sessions')
      .select(`
        id, book_id, start_time, end_time,
        duration_seconds, pages_read,
        start_page, end_page
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(1000);

    if (sessionsError) console.error('❌ Sessions fetch error:', sessionsError);

    // 6. Get gamification data - points and achievements
    const { data: gamificationStats = [], error: gamificationError } = await supabaseAdmin
      .from('user_stats')
      .select(`
        total_points, level, reading_streak as current_streak,
        books_read as books_completed, total_reading_time,
        pages_read, notes_created, highlights_created
      `)
      .eq('user_id', userId)
      .single();

    if (gamificationError) console.error('❌ Gamification stats fetch error:', gamificationError);

    // 7. Get achievements
    const { data: achievements = [], error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select(`
        achievement_id, unlocked_at, progress,
        achievement_name, achievement_description
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (achievementsError) console.error('❌ Achievements fetch error:', achievementsError);

    // 8. Get reading goals
    const { data: goals = [], error: goalsError } = await supabaseAdmin
      .from('reading_goals')
      .select(`
        id, goal_type, target_value, current_value,
        period, start_date, end_date, status,
        created_at, completed_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (goalsError) console.error('❌ Goals fetch error:', goalsError);

    // 9. Get reading statistics
    const { data: dailyStats = [], error: statsError } = await supabaseAdmin
      .from('daily_reading_stats')
      .select(`
        stat_date, books_read, pages_read,
        time_spent_seconds, notes_created,
        achievements_earned, streak_days
      `)
      .eq('user_id', userId)
      .order('stat_date', { ascending: false })
      .limit(365);

    if (statsError) console.error('❌ Daily stats fetch error:', statsError);

    // 10. Compile comprehensive export data
    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        user_id: userId,
        format_version: '1.0',
        gdpr_compliance: 'This export contains all personal data we store about you as required by GDPR Article 20',
      },
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        account_created: user.created_at,
        last_updated: user.updated_at,
      },
      library: {
        total_books: books?.length || 0,
        books: (books || []).map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publisher: book.publisher,
          published_date: book.published_date,
          page_count: book.page_count,
          language: book.language,
          description: book.description,
          genre: book.genre,
          added_date: book.added_date,
          last_accessed: book.last_accessed,
          file_size: book.file_size,
          file_type: book.file_type,
          status: book.status,
          // Note: Actual book files are not included in export for size reasons
          // Users can download files separately from the app
          file_note: 'Book file can be downloaded separately from the application',
        })),
      },
      reading_progress: {
        total_books_tracked: readingProgress?.length || 0,
        progress_data: (readingProgress || []).map(p => ({
          book_id: p.book_id,
          current_page: p.current_page,
          total_pages: p.total_pages,
          progress_percentage: p.progress_percentage,
          last_read_date: p.last_read_date,
          reading_status: p.reading_status,
          time_spent_minutes: p.time_spent_seconds ? Math.round(p.time_spent_seconds / 60) : 0,
        })),
      },
      notes_and_highlights: {
        total_notes: notes?.length || 0,
        notes: (notes || []).map(note => ({
          id: note.id,
          book_id: note.book_id,
          book_title: note.books?.title || 'Unknown',
          content: note.content,
          type: note.type,
          page: note.page,
          position: note.position,
          color: note.color,
          tags: note.tags,
          created_at: note.created_at,
          updated_at: note.updated_at,
        })),
      },
      reading_sessions: {
        total_sessions: sessions?.length || 0,
        sessions: (sessions || []).map(s => ({
          book_id: s.book_id,
          start_time: s.start_time,
          end_time: s.end_time,
          duration_minutes: s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0,
          pages_read: s.pages_read,
          start_page: s.start_page,
          end_page: s.end_page,
        })),
      },
      gamification: {
        overall_stats: gamificationStats ? {
          total_points: gamificationStats.total_points || 0,
          level: gamificationStats.level || 1,
          current_streak: gamificationStats.current_streak || 0,
          longest_streak: gamificationStats.current_streak || 0, // Adjust if you have this field
          books_completed: gamificationStats.books_completed || 0,
          total_reading_time_hours: gamificationStats.total_reading_time ? Math.round(gamificationStats.total_reading_time / 3600) : 0,
          pages_read_total: gamificationStats.pages_read || 0,
          notes_created: gamificationStats.notes_created || 0,
          highlights_created: gamificationStats.highlights_created || 0,
        } : null,
        achievements: (achievements || []).map(a => ({
          achievement_id: a.achievement_id,
          name: a.achievement_name,
          description: a.achievement_description,
          unlocked_at: a.unlocked_at,
          progress: a.progress,
        })),
        reading_goals: (goals || []).map(g => ({
          id: g.id,
          type: g.goal_type,
          target: g.target_value,
          current: g.current_value,
          period: g.period,
          start_date: g.start_date,
          end_date: g.end_date,
          status: g.status,
          created_at: g.created_at,
          completed_at: g.completed_at,
        })),
      },
      statistics: {
        daily_stats_count: dailyStats?.length || 0,
        daily_statistics: (dailyStats || []).map(stat => ({
          date: stat.stat_date,
          books_read: stat.books_read,
          pages_read: stat.pages_read,
          time_spent_minutes: stat.time_spent_seconds ? Math.round(stat.time_spent_seconds / 60) : 0,
          notes_created: stat.notes_created,
          achievements_earned: stat.achievements_earned,
          streak_days: stat.streak_days,
        })),
      },
      privacy_info: {
        data_usage: 'This data is used solely to provide you with the ShelfQuest service',
        data_sharing: 'We do not sell or share your personal data with third parties',
        retention: 'Data is retained until you delete your account',
        rights: 'You have the right to access, rectify, delete, or port this data at any time',
        contact: 'info@shelfquest.pro',
      },
    };

    console.log(`✅ Data export completed for user ${userId}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shelfquest-data-export-${userId}-${Date.now()}.json"`);

    return res.status(200).json(exportData);

  } catch (error) {
    console.error('❌ Data export error:', error);
    return res.status(500).json({
      error: 'Failed to export user data',
      message: error.message
    });
  }
  });

/**
 * GET /api/data-export/summary
 * Get a summary of exportable data (for UI display)
 */
  router.get('/summary', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const summary = {
      books_count: 0,
      notes_count: 0,
      sessions_count: 0,
      achievements_count: 0,
      reading_stats_days: 0,
    };

    // Count books
    const { count: booksCount, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!booksError) summary.books_count = booksCount || 0;

    // Count notes
    const { count: notesCount, error: notesError } = await supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!notesError) summary.notes_count = notesCount || 0;

    // Count sessions
    const { count: sessionsCount, error: sessionsError } = await supabaseAdmin
      .from('reading_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!sessionsError) summary.sessions_count = sessionsCount || 0;

    // Count achievements
    const { count: achievementsCount, error: achievementsError } = await supabaseAdmin
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!achievementsError) summary.achievements_count = achievementsCount || 0;

    // Count daily stats
    const { count: statsCount, error: statsError } = await supabaseAdmin
      .from('daily_reading_stats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!statsError) summary.reading_stats_days = statsCount || 0;

    return res.status(200).json(summary);

  } catch (error) {
    console.error('❌ Failed to get export summary:', error);
    return res.status(500).json({
      error: 'Failed to get export summary',
      message: error.message
    });
  }
  });

  return router;
}
