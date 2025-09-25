export const EDGE_BASE = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL.startsWith('http') ? import.meta.env.VITE_SUPABASE_URL : `https://${import.meta.env.VITE_SUPABASE_URL}`}/functions/v1`
  : "/functions/v1";