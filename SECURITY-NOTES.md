# Notes de sécurité — à lire avant de redéployer

## 1. Clé compromise — à faire en premier, avant tout redéploiement

`SUPABASE_SERVICE_ROLE_KEY` était codée en clair dans `vercel.json` (fichier
suivi par le contrôle de version). Cette clé contourne toutes les policies
RLS de Supabase : elle équivaut à un accès administrateur total à la base.

Étapes :
1. Supabase Dashboard → votre projet → **Project Settings → API**.
2. Section **Service role key** → **Reset / Regenerate**.
3. Copiez la nouvelle clé.
4. Vercel Dashboard → votre projet → **Settings → Environment Variables** →
   ajoutez `SUPABASE_SERVICE_ROLE_KEY` avec la nouvelle valeur, en
   **Production + Preview**, jamais dans un fichier commité.
5. Si `vercel.json` (avec l'ancienne clé) a été poussé sur un dépôt Git,
   la clé reste dans l'historique même après ce correctif — elle doit être
   considérée comme compromise définitivement. La régénérer (étape 2)
   rend l'ancienne valeur inutilisable, c'est la seule vraie protection.
6. Vérifiez dans Supabase → **Logs / Reports** s'il y a eu une activité
   inhabituelle pendant que l'ancienne clé était exposée.

`vercel.json` dans ce dossier a été modifié pour ne plus contenir cette
clé. Les autres valeurs (`NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`VITE_SUPABASE_ANON_KEY`, l'URL du projet, le Google Client ID) sont
prévues pour être publiques et peuvent rester telles quelles.

## 2. Ce qui a été corrigé dans le code (`api/`)

Un helper `api/_auth.js` vérifie le token Supabase (`Authorization: Bearer
<token>`) et, pour les routes admin, le rôle `Admin` dans `user_profiles`.

| Fichier              | GET                  | POST                 | PUT / DELETE |
|----------------------|----------------------|-----------------------|--------------|
| `admin.js`           | Admin requis         | Admin requis          | Admin requis |
| `kpis.js`             | Admin requis         | —                     | —            |
| `quotes.js`           | Admin requis         | **public** (formulaire de demande de devis) | Admin requis |
| `shipments.js`        | Admin requis         | Admin requis           | Admin requis |
| `tariffs.js`          | public (catalogue)   | Admin requis           | Admin requis |
| `carriers.js`         | public (catalogue)   | Admin requis           | Admin requis |
| `content.js`          | public (contenu marketing) | Admin requis     | Admin requis |
| `subscriptions.js`    | public (grille tarifaire)  | Admin requis     | Admin requis |
| `assistant.js`        | public               | public                | Admin requis (DELETE) |

Ce sont des choix par défaut raisonnables, pas une vérité absolue — à
ajuster selon votre modèle réel (ex: si des clients doivent un jour voir
leurs propres devis/expéditions, il faudra une route dédiée qui filtre par
leur `company_id`, pas un accès admin large).

## 3. Ce qui reste à faire

- **Le front-end n'a pas encore de garde de rôle** : le bouton "Admin"
  dans la nav reste visible pour tout le monde ; il ne devrait s'afficher
  que si `user.role === 'Admin'`. Le back-end refusera bien l'accès
  maintenant, mais l'UI doit refléter ça pour éviter la confusion.
- **RLS toujours absente au niveau base** : ces vérifications sont côté
  application (dans les fonctions serverless). Si une seule route oublie
  le check, ou si Supabase est un jour interrogé directement depuis un
  autre client avec la clé anon, les données restent protégées seulement
  si de vraies policies RLS existent sur chaque table. C'est la défense
  en profondeur recommandée pour la suite.
- Retirez les valeurs de démonstration pré-remplies (`demo@tarifai.com`,
  `password123`) du formulaire de connexion avant tout accès public réel.
