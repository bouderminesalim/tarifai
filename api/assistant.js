import supabase from './db-client.js';
import { requireAdmin } from './_auth.js';

function score(item, q) {
  const text = `${item.topic} ${item.answer} ${item.tags}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('assistant_knowledge').select('*').order('topic', { ascending: true }).limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { question, lang = 'FR' } = req.body;
      if (!question) return res.status(400).json({ error: 'Question requise' });
      const { data: knowledge, error } = await supabase.from('assistant_knowledge').select('*').limit(100);
      if (error) throw error;
      const ranked = [...knowledge].sort((a, b) => score(b, question) - score(a, question));
      const best = ranked[0];
      const answer = best && score(best, question) > 0
        ? `${best.answer}\n\nRecommandation IA TarifAI: vérifiez le pays d'origine, l'Incoterm, la valeur transactionnelle et les documents avant dépôt. Source métier: ${best.topic}.`
        : `Je peux aider à identifier un code SH, expliquer les droits/taxes, calculer CIF/CFR/DAP ou préparer une liste documentaire. Pour votre question: "${question}", précisez la marchandise, composition, usage, origine et destination.`;
      const { data, error: insertError } = await supabase.from('assistant_messages').insert({ question, answer, lang }).select().single();
      if (insertError) throw insertError;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id requis' });
      const { error } = await supabase.from('assistant_messages').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
