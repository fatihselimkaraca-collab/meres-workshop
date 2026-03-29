// ============================================
// SUPABASE CONFIGURATION
// ============================================
// 1. Go to https://supabase.com and create a free project
// 2. Go to Settings → API
// 3. Copy your Project URL and anon/public key
// 4. Replace the values below

const SUPABASE_URL = 'https://jvczsajemfvishwbobzf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Y3pzYWplbWZ2aXNod2JvYnpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzg2NDQsImV4cCI6MjA5MDM1NDY0NH0.33pxWt6VfLcEpz0AnK8hPIKf0RoJWpK0tud3ZUaCsX4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
