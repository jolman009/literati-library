// Test Database Connection and Foreign Key Relationship
// Run this with: node test-database-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and foreign key relationships...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...');
    
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('count')
      .limit(1);
    
    if (booksError) {
      console.error('❌ Books table error:', booksError.message);
    } else {
      console.log('✅ Books table exists');
    }

    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('count')
      .limit(1);
    
    if (notesError) {
      console.error('❌ Notes table error:', notesError.message);
    } else {
      console.log('✅ Notes table exists');
    }

    // Test 2: Check foreign key constraints
    console.log('\n2. Checking foreign key constraints...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'notes' });
    
    if (constraintsError) {
      console.log('⚠️  Could not check constraints directly, but this is normal');
    } else {
      console.log('✅ Foreign key constraints:', constraints);
    }

    // Test 3: Try a simple join query
    console.log('\n3. Testing join query...');
    
    const { data: joinTest, error: joinError } = await supabase
      .from('notes')
      .select(`
        id,
        content,
        books!inner(title, author)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('❌ Join query failed:', joinError.message);
      console.log('This is the error you\'re experiencing. The foreign key relationship needs to be fixed.');
    } else {
      console.log('✅ Join query successful');
    }

    // Test 4: Alternative approach - separate queries
    console.log('\n4. Testing alternative approach (separate queries)...');
    
    const { data: notesData, error: notesDataError } = await supabase
      .from('notes')
      .select('*')
      .limit(5);
    
    if (notesDataError) {
      console.error('❌ Notes query failed:', notesDataError.message);
    } else {
      console.log(`✅ Found ${notesData.length} notes`);
      
      if (notesData.length > 0) {
        const bookIds = [...new Set(notesData.filter(n => n.book_id).map(n => n.book_id))];
        
        if (bookIds.length > 0) {
          const { data: booksData, error: booksDataError } = await supabase
            .from('books')
            .select('id, title, author')
            .in('id', bookIds);
          
          if (booksDataError) {
            console.error('❌ Books query failed:', booksDataError.message);
          } else {
            console.log(`✅ Found ${booksData.length} related books`);
            console.log('✅ Alternative approach works - this is what we\'ll use');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDatabaseConnection();