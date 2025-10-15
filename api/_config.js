export function getDBConfig() {
  return {
    table: process.env.DB_USERS_TABLE || 'users',
    col: {
      id: process.env.DB_COL_ID || 'id',
      email: process.env.DB_COL_EMAIL || 'email',
      username: process.env.DB_COL_USERNAME || 'username',
      password: process.env.DB_COL_PASSWORD || 'password',
      role: process.env.DB_COL_ROLE || 'role',
    },
  };
}

export function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key: serviceRole || anon, hasServiceRole: Boolean(serviceRole) };
}
