// Quick test to verify your Supabase credentials work
// Run: node test-supabase-connection.js

const SUPABASE_URL = 'https://your-project-id.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with your key

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      console.log('✅ Supabase connection successful!');
      console.log('📊 Status:', response.status);
      console.log('🔗 URL:', SUPABASE_URL);
      console.log('🔑 Key length:', SUPABASE_ANON_KEY.length, 'characters');

      // Test authentication endpoint
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (authResponse.ok) {
        console.log('✅ Auth endpoint accessible');
      } else {
        console.log('⚠️ Auth endpoint not accessible (this might be normal)');
      }

    } else {
      console.log('❌ Supabase connection failed');
      console.log('📊 Status:', response.status, response.statusText);
    }

  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 Check your URL and key values');
  }
}

// Only run if URL and key are provided
if (SUPABASE_URL.includes('your-project-id') || SUPABASE_ANON_KEY.includes('eyJhbGciOiJIUzI1NiIs')) {
  console.log('💡 Please update the SUPABASE_URL and SUPABASE_ANON_KEY values in this file');
  console.log('   Then run: node test-supabase-connection.js');
} else {
  testSupabaseConnection();
}