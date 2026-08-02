import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Reading the tariff catalog is a public/marketing feature. Editing it
  // is not.
  if (req.method !== 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
  }

  try {
    if (req.method === 'GET') {
      const { q = '', category = '', origin = '', destination = '' } = req.query;
      let query = supabase.from('tariffs').select('*').order('hs_code', { ascending: true });
      if (q) query = query.or(`hs_code.ilike.%${q}%,description_fr.ilike.%${q}%,description_en.ilike.%${q}%,keywords.ilike.%${q}%`);
      if (category) query = query.eq('category', category);
      if (origin) query = query.eq('origin_country', origin);
      if (destination) query = query.eq('destination_country', destination);
      const { data, error } = await query.limit(60);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.hs_code || !payload.description_fr) return res.status(400).json({ error: 'Code SH et description requis' });
      const { data, error } = await supabase.from('tariffs').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase.from('tariffs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('tariffs').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
