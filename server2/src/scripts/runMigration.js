// src/scripts/runMigration.js
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  // Check command line arguments for migration type
  const migrationArg = process.argv[2] || 'security';

  if (migrationArg === 'gamification') {
    console.log('🔄 Starting gamification database migration...');
  } else {
    console.log('🔄 Starting security database migration...');
  }

  try {
    // Read the migration file based on argument
    // Consolidated migrations are in database/consolidated/
    const consolidatedDir = join(__dirname, '../../../../database/consolidated');
    let migrationPath;
    if (migrationArg === 'gamification') {
      migrationPath = join(consolidatedDir, '002_gamification_core.sql');
    } else if (migrationArg === 'security') {
      migrationPath = join(consolidatedDir, '004_security_infrastructure.sql');
    } else if (migrationArg === 'all') {
      // Run all consolidated migrations in order
      const files = [
        '001_core_tables.sql', '002_gamification_core.sql', '003_gamification_phase2.sql',
        '004_security_infrastructure.sql', '005_ai_rag.sql', '006_supplementary_tables.sql',
        '007_functions_triggers_views.sql', '008_rls_policies.sql', '009_indexes_performance.sql'
      ];
      for (const file of files) {
        console.log(`\n📄 Running ${file}...`);
        const sql = readFileSync(join(consolidatedDir, file), 'utf8');
        const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
        for (const stmt of stmts) {
          try {
            await supabase.rpc('exec_sql', { sql: stmt + ';' });
          } catch (e) {
            console.log(`⚠️  ${e.message?.substring(0, 100)}`);
          }
        }
        console.log(`✅ ${file} done`);
      }
      console.log('\n🎉 All consolidated migrations completed!');
      process.exit(0);
    } else {
      migrationPath = join(consolidatedDir, '004_security_infrastructure.sql');
    }

    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📖 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.trim().length === 0) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try direct query for simpler statements
          const { error: queryError } = await supabase
            .from('_migration_temp')
            .select('1')
            .limit(1);

          // If the table doesn't exist, that's expected
          if (queryError && !queryError.message.includes('does not exist')) {
            throw error;
          }

          // Try raw SQL execution (this might not work in all Supabase setups)
          console.log(`⚠️  Standard execution failed, trying alternative method...`);

          // For this approach, we'll need to use the Supabase REST API directly
          // But for safety, we'll just log the statement and ask user to run manually
          console.log(`❌ Could not execute: ${statement.substring(0, 100)}...`);
          console.log(`Please run this statement manually in Supabase SQL Editor`);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        console.log(`⚠️  Statement ${i + 1} failed: ${statementError.message}`);

        // Continue with other statements for non-critical errors
        if (statementError.message.includes('already exists')) {
          console.log(`ℹ️  Skipping - already exists`);
        } else {
          console.log(`❌ Error details:`, statementError.message.substring(0, 200));
        }
      }
    }

    console.log('🎉 Migration process completed!');
    console.log('');
    console.log('🔍 Next steps:');

    if (migrationArg === 'gamification') {
      console.log('1. Check Supabase Dashboard > Database > Tables to verify new gamification tables');
      console.log('2. Test the gamification API endpoints (/achievements, /goals, /actions)');
      console.log('3. Verify the user level and points calculation functions');
      console.log('');
      console.log('📋 New gamification tables created:');
      console.log('  - user_achievements');
      console.log('  - user_goals');
      console.log('  - user_actions');
      console.log('  - goal_templates');
      console.log('');
      console.log('🔧 New functions created:');
      console.log('  - get_user_total_points()');
      console.log('  - get_user_level()');
      console.log('  - award_achievement()');
    } else {
      console.log('1. Check Supabase Dashboard > Database > Tables to verify new tables');
      console.log('2. Verify the users table has new security columns');
      console.log('3. Test the enhanced authentication endpoints');
      console.log('');
      console.log('📋 New tables created:');
      console.log('  - security_audit_log');
      console.log('  - user_sessions');
      console.log('  - rate_limit_tracking');
      console.log('  - security_settings');
      console.log('  - file_upload_log');
      console.log('  - api_usage_log');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('🔧 Alternative approach:');
    console.log('1. Open Supabase Dashboard > SQL Editor');

    const migrationArg = process.argv[2] || 'security';
    if (migrationArg === 'gamification') {
      console.log('2. Copy contents from: database/consolidated/002_gamification_core.sql');
    } else {
      console.log('2. Copy contents from: database/consolidated/004_security_infrastructure.sql');
    }

    console.log('3. Paste and run in SQL Editor');
    console.log('');
    process.exit(1);
  }
}

// Check if we have proper environment setup
function validateEnvironment() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('  - SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_KEY');
    console.log('');
    console.log('📝 Please ensure your .env file is properly configured');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_KEY.substring(0, 20)}...`);
}

// Main execution
async function main() {
  const migrationArg = process.argv[2] || 'security';

  if (migrationArg === 'gamification') {
    console.log('🚀 ShelfQuest Gamification Migration Tool');
    console.log('=======================================');
  } else {
    console.log('🚀 ShelfQuest Security Migration Tool');
    console.log('=====================================');
  }

  validateEnvironment();
  await runMigration();
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Migration script failed:', error.message);
  process.exit(1);
});