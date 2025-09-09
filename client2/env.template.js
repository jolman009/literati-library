// Runtime environment configuration template
// This file gets processed by docker-entrypoint.sh to inject environment variables
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_AI_SERVICE_URL: "${VITE_AI_SERVICE_URL}"
};