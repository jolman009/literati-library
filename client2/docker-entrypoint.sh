#!/bin/sh
set -e

# Generate runtime environment configuration
cat > /usr/share/nginx/html/env.js << EOF
// Runtime environment configuration
window.ENV = {
  VITE_API_BASE_URL: '${VITE_API_BASE_URL:-http://localhost:5000}',
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL:-}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY:-}',
  VITE_AI_SERVICE_URL: '${VITE_AI_SERVICE_URL:-http://localhost:8000}',
  NODE_ENV: '${NODE_ENV:-production}'
};
EOF

echo "Environment configuration generated:"
cat /usr/share/nginx/html/env.js

# Start nginx
exec nginx -g 'daemon off;'