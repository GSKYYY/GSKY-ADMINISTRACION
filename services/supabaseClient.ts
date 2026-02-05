// @ts-ignore
const { createClient } = window.supabase;

const supabaseUrl = 'https://fastafxiyqjyqlnggrfq.supabase.co';

// Clave Pública (anon) correcta
const supabaseKey = 'sb_publishable_rlsx4phvnGEphZhNw01xPA_KYwSWUlr';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  realtime: {
    enabled: false // Desactivado para evitar errores de WebSocket
  }
});
