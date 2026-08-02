import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Shipment records (customer refs, tracking numbers, ETAs) are not
  // meant to be publicly listable — this is your ops visibility tower.
  // If you later want customers to track their OWN shipment, build a
  // separate, scoped endpoint rather than opening this one.
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') {
      const { q = '', status = '' } = req.query;
      let query = supabase.from('shipments').select('*').order('eta', { ascending: true });
      if (q) query = query.or(`tracking_number.ilike.%${q}%,reference.ilike.%${q}%,container_number.ilike.%${q}%,bl_awb.ilike.%${q}%`);
      if (status) query = query.eq('status', status);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.tracking_number || !payload.mode || !payload.origin || !payload.destination) return res.status(400).json({ error: 'Tracking, mode, origine et destination requis' });
      const { data, error } = await supabase.from('shipments').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { data, error } = await supabase.from('shipments').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('shipments').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
