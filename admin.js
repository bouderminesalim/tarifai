import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // The whole admin console (users, payments, logs) is sensitive: every
  // method requires a logged-in user with role = 'Admin'.
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') {
      const [{ data: users, error: usersError }, { data: logs, error: logsError }, { data: payments, error: paymentsError }] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(80)
      ]);
      if (usersError) throw usersError;
      if (logsError) throw logsError;
      if (paymentsError) throw paymentsError;
      return res.status(200).json({ users, logs, payments });
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.email || !payload.company_name) return res.status(400).json({ error: 'Email et entreprise requis' });
      const { data, error } = await supabase.from('user_profiles').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase.from('user_profiles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('user_profiles').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
