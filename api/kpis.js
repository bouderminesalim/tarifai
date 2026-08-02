import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // These KPIs include total quote revenue and shipment volume — business
  // metrics, not public marketing stats.
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    if (req.method === 'GET') {
      const [tariffs, carriers, quotes, shipments, content] = await Promise.all([
        supabase.from('tariffs').select('id, category, duty_rate, vat_rate'),
        supabase.from('carriers').select('id, mode, reliability_score'),
        supabase.from('quote_requests').select('id, estimated_total, status'),
        supabase.from('shipments').select('id, status, eta'),
        supabase.from('content_items').select('id, type')
      ]);
      for (const result of [tariffs, carriers, quotes, shipments, content]) if (result.error) throw result.error;
      const quoteTotal = quotes.data.reduce((sum, q) => sum + Number(q.estimated_total || 0), 0);
      const averageReliability = carriers.data.length ? carriers.data.reduce((sum, c) => sum + Number(c.reliability_score || 0), 0) / carriers.data.length : 0;
      return res.status(200).json({
        tariffCount: tariffs.data.length,
        carrierCount: carriers.data.length,
        quoteCount: quotes.data.length,
        quoteTotal,
        shipmentCount: shipments.data.length,
        inTransit: shipments.data.filter(s => s.status !== 'Livré').length,
        contentCount: content.data.length,
        averageReliability: Math.round(averageReliability * 10) / 10
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
