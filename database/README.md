# 🗄️ Database Setup & Migrations

## Overview
This directory contains SQL migration files for setting up the Literati database schema in Supabase.

## Quick Setup

### 1. Apply Migration to Supabase

**Option A: Supabase Dashboard (Recommended)**
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `migrations/001_create_gamification_tables.sql`
5. Run the script

**Option B: Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db reset
supabase db push
```

### 2. Verify Tables Created
After running the migration, verify these tables exist:
- `user_achievements`
- `user_goals`
- `user_actions`
- `reading_streaks`
- `user_preferences`

### 3. Check Row Level Security
Ensure RLS is enabled and policies are active:
```sql
-- Run this in Supabase SQL Editor to verify
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_achievements', 'user_goals', 'user_actions', 'reading_streaks', 'user_preferences');
```

## Database Schema

### Core Tables

#### `user_achievements`
Tracks unlocked achievements for each user.
- Links to achievement definitions in code
- Prevents duplicate unlocks with unique constraint
- Timestamped for analytics

#### `user_goals`
Stores user reading goals and progress.
- Flexible goal types (books, time, streaks)
- Progress tracking with current/target values
- Automatic completion detection

#### `user_actions`
Detailed log of all user actions for points calculation.
- Source of truth for points system
- Supports analytics and debugging
- Optional linking to books/sessions

#### `reading_streaks`
Optimized daily reading activity tracking.
- Pre-calculated daily statistics
- Efficient streak calculation
- Supports multiple activity types

#### `user_preferences`
User-specific gamification settings.
- Enable/disable features
- Goal preferences
- Notification settings

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User isolation** - users can only access their own data
- **Foreign key constraints** for data integrity
- **Input validation** via CHECK constraints

### Performance Optimizations

- **Strategic indexes** for common query patterns
- **Composite indexes** for multi-column searches
- **Analytics views** for reporting
- **Updated_at triggers** for automatic timestamps

## Environment Variables

Update your server `.env` file:
```env
# Add to server2/.env
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Migration Status

- [x] **001_create_gamification_tables.sql** - Core gamification tables
- [ ] **002_create_indexes.sql** - Additional performance indexes (if needed)
- [ ] **003_seed_data.sql** - Sample data for development (optional)

## Troubleshooting

### Common Issues

**1. RLS Policy Errors**
```sql
-- If you get permission errors, check policies:
SELECT * FROM pg_policies WHERE tablename = 'user_achievements';
```

**2. Foreign Key Violations**
```sql
-- Ensure auth.users table exists:
SELECT * FROM auth.users LIMIT 1;
```

**3. Index Creation Failures**
```sql
-- Drop and recreate if needed:
DROP INDEX IF EXISTS idx_user_achievements_user_id;
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
```

### Testing the Setup

Run this query to test the tables:
```sql
-- Insert test data (replace with actual user ID)
INSERT INTO user_preferences (user_id)
SELECT id FROM auth.users LIMIT 1;

-- Verify it worked
SELECT * FROM user_preferences;
```

## Production Considerations

1. **Backup Strategy** - Set up automated backups
2. **Monitoring** - Monitor table sizes and query performance
3. **Scaling** - Consider partitioning for large datasets
4. **Security Audit** - Regular review of RLS policies

## Next Steps

After applying this migration:
1. Update server code to use new tables
2. Test gamification endpoints
3. Verify achievement tracking works
4. Set up monitoring for table performance