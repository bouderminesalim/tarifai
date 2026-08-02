import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

function computeEstimate(body) {
  const value = Number(body.goods_value || 0);
  const weight = Number(body.weight_kg || 0);
  const volume = Number(body.volume_cbm || 0);
  const duty = Number(body.duty_rate || 0.15);
  const vat = Number(body.vat_rate || 0.19);
  const freightRate = body.mode === 'air' ? 4.8 : body.mode === 'sea' ? 180 : body.mode === 'rail' ? 0.95 : 1.35;
  const freight = body.mode === 'sea' ? Math.max(450, volume * freightRate) : Math.max(120, weight * freightRate);
  const customsDuty = value * duty;
  const taxable = value + freight + customsDuty;
  return Math.round((freight + customsDuty + taxable * vat) * 100) / 100;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // POST stays public: it's the "request a quote" lead-capture form used by
  // anonymous prospects. Viewing, editing or deleting the resulting CRM
  // pipeline is internal-only.
  if (req.method !== 'POST') {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
  }

  try {
    if (req.method === 'GET') {
      const { status = '' } = req.query;
      let query = supabase.from('quote_requests').select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      if (!payload.company_name || !payload.hs_code || !payload.origin || !payload.destination) {
        return res.status(400).json({ error: 'Entreprise, code SH, origine et destination requis' });
      }
      const record = { ...payload, status: payload.status || 'Nouveau', estimated_total: computeEstimate(payload) };
      const { data, error } = await supabase.from('quote_requests').insert(record).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const next = { ...updates };
      if (updates.goods_value || updates.weight_kg || updates.volume_cbm || updates.mode) next.estimated_total = computeEstimate(updates);
      const { data, error } = await supabase.from('quote_requests').update(next).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('quote_requests').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
