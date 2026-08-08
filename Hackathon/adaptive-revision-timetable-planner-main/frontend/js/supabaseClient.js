// Requires config.js and the Supabase CDN script to be loaded first (see each HTML page's <head>)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
