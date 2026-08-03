export default function handler(req, res) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  res.status(200).json({
    url_vue_par_le_serveur: url,
    cle_longueur: key.length,
    cle_debut: key.slice(0, 6),
    cle_fin: key.slice(-6),
    contient_espace_ou_saut_de_ligne: /\s/.test(key),
    nombre_de_points: (key.match(/\./g) || []).length,
  });
}
