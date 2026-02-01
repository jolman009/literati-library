ARCHIVED MIGRATION FILES
========================
These files have been superseded by database/consolidated/001-009.
They are kept here for reference only. Do NOT run them against the database.

MAPPING: Old File -> Consolidated Into
---------------------------------------
database_migrations/001_create_gamification_tables.sql  -> consolidated/002_gamification_core.sql
database_migrations/002_create_user_stats_table.sql     -> consolidated/002 + 007
database_migrations/003_fix_rls_for_server_writes.sql   -> consolidated/008_rls_policies.sql

server2_src_migrations/addGamificationTables.sql        -> consolidated/002 (duplicate dropped)
server2_src_migrations/addSecurityColumns.sql           -> consolidated/004_security_infrastructure.sql
server2_src_migrations/20251025_rag.sql                 -> consolidated/005_ai_rag.sql

server2_migrations/004_gamification_phase2.sql          -> consolidated/003_gamification_phase2.sql

database_root/supabase_daily_checkins_table.sql         -> consolidated/006 (fixed SQL Server -> PostgreSQL)
database_root/database-optimization.sql                 -> consolidated/009_indexes_performance.sql
database_root/fix-notes-foreign-key.sql                 -> consolidated/001_core_tables.sql
