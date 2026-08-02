import { createClient } from '@supabase/supabase-js';

// Uses the service role key only to VERIFY tokens and look up roles server-side.
// Never expose this client or its key to the browser.
const authClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Returns the authenticated user, or null if missing/invalid.
 */
export async function getUserFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Rejects the request with 401 if there is no valid, logged-in user.
 * Returns the user on success (so the caller can use it), or null after
 * already writing the error response (caller must `return` immediately).
 */
export async function requireAuth(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Authentification requise.' });
    return null;
  }
  return user;
}

/**
 * Rejects the request with 401/403 unless the caller is logged in AND
 * has role = 'Admin' in user_profiles. Adjust the role check to match
 * whatever roles you actually use.
 */
export async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null; // requireAuth already responded
  const { data: profile, error } = await authClient
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (error || !profile || profile.role !== 'Admin') {
    res.status(403).json({ error: 'Accès administrateur requis.' });
    return null;
  }
  return user;
}
