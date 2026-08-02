import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
  }

  try {
    if (req.method === 'GET') {
      const { type = '', lang = '' } = req.query;
      let query = supabase.from('content_items').select('*').order('published_at', { ascending: false });
      if (type) query = query.eq('type', type);
      if (lang) query = query.eq('lang', lang);
      const { data, error } = await query.limit(120);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.title || !payload.type) return res.status(400).json({ error: 'Titre et type requis' });
      const { data, error } = await supabase.from('content_items').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase.from('content_items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('content_items').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
