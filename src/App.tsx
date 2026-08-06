import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bell, BookOpen, Bot, Calculator, Check, ChevronDown, CreditCard, Database, FileText, Globe2, Lock, Menu, Moon, PackageCheck, Plane, RailSymbol, Search, Settings, ShieldCheck, Ship, Sparkles, Star, Sun, Truck, Users, X, Zap } from 'lucide-react';
import supabase from './lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from './lib/googleAuth';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

handleGoogleRedirect();

type Tariff = { id: number; hs_code: string; description_fr: string; description_en: string; category: string; origin_country: string; destination_country: string; duty_rate: number; vat_rate: number; excise_rate: number; restrictions: string; regulations: string; required_documents: string; incoterms_notes: string; keywords: string };
type Carrier = { id: number; name: string; mode: string; lanes: string; base_rate: number; currency: string; transit_days_min: number; transit_days_max: number; reliability_score: number; co2_score: number; services: string; payment_methods: string };
type Quote = { id: number; company_name: string; contact_email: string; hs_code: string; mode: string; origin: string; destination: string; goods_value: number; weight_kg: number; volume_cbm: number; incoterm: string; status: string; estimated_total: number; created_at: string };
type Shipment = { id: number; reference: string; tracking_number: string; bl_awb: string; container_number: string; mode: string; carrier_name: string; origin: string; destination: string; status: string; eta: string; progress: number; alert_level: string };
type ContentItem = { id: number; type: string; lang: string; title: string; summary: string; body: string; published_at: string; tags: string };
type Subscription = { id: number; plan_name: string; monthly_price: number; currency: string; features: string; recommended: boolean; limits: string };
type Kpis = { tariffCount: number; carrierCount: number; quoteCount: number; quoteTotal: number; shipmentCount: number; inTransit: number; contentCount: number; averageReliability: number };
type AdminData = { users: Array<{ id: number; email: string; company_name: string; role: string; plan: string; two_factor_enabled: boolean; status: string }>; logs: Array<{ id: number; actor: string; action: string; severity: string; created_at: string }>; payments: Array<{ id: number; company_name: string; provider: string; amount: number; currency: string; status: string }> };

type Lang = 'FR' | 'EN' | 'AR';
type Theme = 'light' | 'dark';
const modes = ['air', 'sea', 'road', 'rail'];
const nav = ['Accueil', 'Dashboard', 'Devis', 'Tracking', 'Docs', 'IA', 'Admin'];
const accentMap: Record<string, string> = { air: 'from-sky-500 to-cyan-400', sea: 'from-blue-600 to-indigo-500', road: 'from-orange-500 to-pink-500', rail: 'from-emerald-500 to-lime-400' };

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { headers, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erreur réseau');
  return data as T;
}

function AppShell() {
  const [page, setPage] = useState('Accueil');
  const [theme, setTheme] = useState<Theme>('light');
  const [lang, setLang] = useState<Lang>('FR');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const scrollToPage = (target: string) => {
    setPage(target);
    setMenuOpen(false);
    setTimeout(() => document.getElementById(target.toLowerCase())?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 transition-colors dark:bg-[#050816] dark:text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400/30 via-fuchsia-500/25 to-amber-300/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-gradient-to-l from-blue-700/25 to-emerald-300/20 blur-3xl" />
      </div>
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/65">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => scrollToPage('Accueil')} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 via-fuchsia-600 to-amber-400 text-white shadow-lg shadow-fuchsia-500/20"><Sparkles size={20} /></span>
            <span className="text-xl font-black tracking-tight">Tarif<span className="text-blue-600 dark:text-cyan-300">AI</span></span>
          </button>
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map(item => <button key={item} onClick={() => scrollToPage(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${page === item ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}>{item}</button>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <select value={lang} onChange={e => setLang(e.target.value as Lang)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/10"><option>FR</option><option>EN</option><option>AR</option></select>
            <button aria-label="Changer le thème" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="rounded-full border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/10">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
            <AuthPanel />
          </div>
          <button className="rounded-full border border-slate-200 p-2 lg:hidden dark:border-white/10" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        </div>
        {menuOpen && <div className="mx-4 mb-4 rounded-3xl border border-white/30 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-slate-900 lg:hidden">{nav.map(item => <button key={item} onClick={() => scrollToPage(item)} className="block w-full rounded-2xl px-4 py-3 text-left font-bold hover:bg-slate-100 dark:hover:bg-white/10">{item}</button>)}<div className="px-2 py-3"><AuthPanel compact /></div></div>}
      </header>
      <main>
        <Home onNavigate={scrollToPage} lang={lang} />
        <Dashboard />
        <Quotes />
        <Tracking />
        <Docs />
        <Assistant />
        <ClassificationWizard />
        <Admin />
      </main>
      <Footer />
    </div>
  );
}

function AuthPanel({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    if (!email.includes('@') || password.length < 6) { setAuthError('Email valide et mot de passe 6 caractères minimum.'); return; }
    setBusy(true);
    const { error } = isSignUp ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else setOpen(false);
    setBusy(false);
  };

  if (loading) return <span className="rounded-full bg-slate-100 px-4 py-2 text-sm dark:bg-white/10">Session...</span>;
  if (user) return <button onClick={() => supabase.auth.signOut()} className="rounded-full bg-gradient-to-r from-slate-950 to-blue-800 px-4 py-2 text-sm font-bold text-white shadow-lg dark:from-white dark:to-cyan-200 dark:text-slate-950">{compact ? 'Déconnexion' : user.email}</button>;
  return <div className="relative"><button onClick={() => setOpen(!open)} className="rounded-full bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 px-5 py-2 text-sm font-black text-white shadow-lg shadow-fuchsia-500/25">Connexion</button>{open && <form onSubmit={submit} className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-white/30 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900"><h3 className="text-lg font-black">Accès sécurisé</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Email, Google, Microsoft et 2FA prêt SaaS.</p><label className="mt-4 block text-xs font-bold uppercase text-slate-500">Email</label><input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/10"/><label className="mt-3 block text-xs font-bold uppercase text-slate-500">Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/10"/>{authError && <p className="mt-3 rounded-xl bg-red-50 p-2 text-sm text-red-600 dark:bg-red-500/10">{authError}</p>}<button disabled={busy} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-60 dark:bg-white dark:text-slate-950">{busy ? 'Validation...' : isSignUp ? 'Créer un compte' : 'Se connecter'}</button><div className="my-3 text-center text-xs font-bold uppercase text-slate-400">ou</div><button type="button" onClick={() => signInWithGoogle('TarifAI')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold dark:border-white/10">Continuer avec Google</button><button type="button" onClick={() => setAuthError('Microsoft OAuth: connecteur prêt pour Azure Entra ID en production.')} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold dark:border-white/10">Continuer avec Microsoft</button><button type="button" onClick={() => setIsSignUp(!isSignUp)} className="mt-3 w-full text-sm font-bold text-blue-600">{isSignUp ? 'Déjà inscrit ? Connexion' : 'Créer un compte entreprise'}</button></form>}</div>;
}

function Home({ onNavigate, lang }: { onNavigate: (page: string) => void; lang: Lang }) {
  const [q, setQ] = useState('');
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [tariffsData, plansData, contentData] = await Promise.all([api<Tariff[]>('/api/tariffs'), api<Subscription[]>('/api/subscriptions'), api<ContentItem[]>('/api/content')]);
      setTariffs(tariffsData); setPlans(plansData); setContents(contentData);
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const faqs = contents.filter(c => c.type === 'FAQ').slice(0, 4);
  const news = contents.filter(c => c.type === 'News').slice(0, 3);
  const searchResults = tariffs.filter(t => q && (`${t.hs_code} ${t.description_fr} ${t.keywords}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 4);

  return <section id="accueil" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20"><div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}><div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm dark:border-cyan-300/20 dark:bg-white/10 dark:text-cyan-200"><Zap size={16}/> Plateforme douane, fret & IA B2B</div><h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">Tarifs douaniers et logistique globale, <span className="bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 bg-clip-text text-transparent">augmentés par l’IA</span>.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">Consultez les codes SH, calculez droits, TVA, FOB/CIF/CFR/DAP, comparez transporteurs multimodaux, demandez un devis et suivez BL, AWB ou conteneur en temps réel. Langue active: {lang}.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => onNavigate('Dashboard')} className="rounded-full bg-slate-950 px-7 py-4 font-black text-white shadow-xl shadow-blue-900/20 dark:bg-white dark:text-slate-950">Lancer le dashboard</button><button onClick={() => onNavigate('Devis')} className="rounded-full border border-slate-200 bg-white px-7 py-4 font-black shadow-sm dark:border-white/10 dark:bg-white/10">Obtenir un devis</button></div><div className="mt-10 grid grid-cols-3 gap-3">{[{k:'17k+',v:'Codes SH'}, {k:'4',v:'Modes de transport'}, {k:'97',v:'Chapitres SH couverts'}].map(s => <div key={s.v} className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/10"><div className="text-2xl font-black">{s.k}</div><div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{s.v}</div></div>)}</div></motion.div><motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, delay: .1 }} className="rounded-[2.2rem] border border-white/50 bg-white/80 p-5 shadow-2xl shadow-blue-900/10 backdrop-blur dark:border-white/10 dark:bg-white/10"><div className="rounded-[1.7rem] bg-gradient-to-br from-blue-950 via-blue-800 to-fuchsia-700 p-5 text-white"><div className="flex items-center justify-between"><span className="font-black">Moteur intelligent</span><Bot className="text-cyan-200"/></div><div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15"><Search size={20}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Ex: batterie lithium, 8541, textile coton..." className="w-full bg-transparent outline-none placeholder:text-white/65"/></div>{loading ? <Skeleton /> : error ? <ErrorBox message={error} onRetry={load}/> : <div className="mt-5 space-y-3">{(searchResults.length ? searchResults : tariffs.slice(0, 4)).map(t => <div key={t.id} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{t.hs_code} · {t.category}</p><p className="mt-1 text-sm text-white/75">{t.description_fr}</p></div><span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-emerald-950">{Math.round(t.duty_rate * 100)}%</span></div></div>)}</div>}<div className="mt-5 grid grid-cols-2 gap-3"><MiniMetric label="Droits + TVA" value="Auto"/><MiniMetric label="Restrictions" value="Live"/></div></div></motion.div></div><p className="mt-16 text-center text-xs font-bold uppercase tracking-wide text-slate-400">Comparateur multimodal — tarifs indicatifs, hors partenariat officiel</p><div className="mt-4 grid gap-4 md:grid-cols-4">{['Fret aérien','Fret maritime','Fret routier','Fret ferroviaire'].map(p => <div key={p} className="rounded-3xl border border-slate-200 bg-white p-6 text-center font-black text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">{p}</div>)}</div><div className="mt-16 grid gap-6 lg:grid-cols-3">{plans.map(plan => <Card key={plan.id} className={plan.recommended ? 'ring-2 ring-fuchsia-500' : ''}><div className="flex items-center justify-between"><h3 className="text-2xl font-black">{plan.plan_name}</h3>{plan.recommended && <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-black text-fuchsia-700">Populaire</span>}</div><p className="mt-3 text-4xl font-black">{formatMoney(plan.monthly_price, plan.currency)}<span className="text-sm font-semibold text-slate-500">/mois</span></p><p className="mt-3 text-slate-600 dark:text-slate-300">{plan.limits}</p><ul className="mt-5 space-y-2">{plan.features.split('|').map(f => <li key={f} className="flex items-center gap-2 text-sm"><Check size={16} className="text-emerald-500"/>{f}</li>)}</ul></Card>)}</div><div className="mt-16 grid gap-6 lg:grid-cols-2"><Card><h2 className="text-2xl font-black">Nouveau sur TarifAI</h2><div className="mt-5 space-y-4"><p className="text-slate-600 dark:text-slate-300">Plateforme en phase de lancement pour les professionnels du commerce international en Algérie&nbsp;: commissionnaires en douane, importateurs, exportateurs et transitaires.</p><ul className="space-y-2 text-sm">{["Tarif douanier national complet et à jour","Classement guidé selon les Règles Générales d'Interprétation","Calcul automatique du coût atterri (droits, TVA, taxes)"].map(f => <li key={f} className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/>{f}</li>)}</ul><button onClick={() => onNavigate('Devis')} className="rounded-full bg-slate-950 px-6 py-3 font-black text-white dark:bg-white dark:text-slate-950">Devenir utilisateur pilote</button></div></Card><Card><h2 className="text-2xl font-black">Actualités & FAQ</h2><div className="mt-5 space-y-4">{news.map(n => <div key={n.id}><p className="font-black">{n.title}</p><p className="text-sm text-slate-500 dark:text-slate-400">{n.summary}</p></div>)}{faqs.map(f => <details key={f.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><summary className="flex cursor-pointer list-none items-center justify-between font-black">{f.title}<ChevronDown size={16}/></summary><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.body}</p></details>)}</div></Card></div></section>;
}

function Dashboard() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calc, setCalc] = useState({ value: 25000, weight: 860, length: 120, width: 80, height: 110, packages: 4, incoterm: 'CIF' });

  const load = async () => { setLoading(true); setError(''); try { const [t, c, k] = await Promise.all([api<Tariff[]>(`/api/tariffs?q=${encodeURIComponent(query)}`), api<Carrier[]>(`/api/carriers${mode ? `?mode=${mode}` : ''}`), api<Kpis>('/api/kpis')]); setTariffs(t); setCarriers(c); setKpis(k); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const selected = tariffs[0];
  const volume = (calc.length * calc.width * calc.height * calc.packages) / 1000000;
  const volumetricAir = (calc.length * calc.width * calc.height * calc.packages) / 6000;
  const duty = calc.value * Number(selected?.duty_rate || 0.12);
  const freight = Math.max(180, (mode === 'sea' ? volume * 220 : mode === 'air' ? volumetricAir * 4.8 : calc.weight * 1.2));
  const vat = (calc.value + duty + freight) * Number(selected?.vat_rate || 0.19);
  const total = calc.value + duty + freight + vat;

  return <section id="dashboard" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<BarChart3/>} eyebrow="Command Center" title="Dashboard douane, taxe et fret" subtitle="Recherche avancée, simulation import/export, KPI, graphiques opérationnels et comparaison multimodale." />{loading ? <SkeletonGrid/> : error ? <ErrorBox message={error} onRetry={load}/> : <><div className="grid gap-4 md:grid-cols-4">{kpis && [{l:'Tarifs',v:kpis.tariffCount, i:<Database/>}, {l:'Transporteurs',v:kpis.carrierCount, i:<Truck/>}, {l:'Devis',v:kpis.quoteCount, i:<FileText/>}, {l:'Reliabilité',v:`${kpis.averageReliability}%`, i:<Activity/>}].map(k => <Card key={k.l}><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-slate-500">{k.l}</p><p className="text-3xl font-black">{k.v}</p></div><span className="rounded-2xl bg-gradient-to-br from-blue-600 to-fuchsia-500 p-3 text-white">{k.i}</span></div></Card>)}</div><Card className="mt-6"><div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Code SH, description, mot-clé, réglementation..." className="w-full bg-transparent outline-none"/></div><select value={mode} onChange={e => setMode(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold dark:border-white/10 dark:bg-slate-900"><option value="">Tous modes</option>{modes.map(m => <option key={m} value={m}>{m}</option>)}</select><button onClick={load} className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white dark:bg-white dark:text-slate-950">Rechercher</button></div></Card><div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><Card><h3 className="text-xl font-black">Tarifs douaniers & réglementations</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-3">Code SH</th><th>Description</th><th>Droits</th><th>TVA</th><th>Documents</th><th>Restrictions</th></tr></thead><tbody>{tariffs.map(t => <tr key={t.id} className="border-t border-slate-100 dark:border-white/10"><td className="py-4 font-black text-blue-600 dark:text-cyan-300">{t.hs_code}</td><td><p className="font-bold">{t.description_fr}</p><p className="text-xs text-slate-500">{t.regulations}</p></td><td>{Math.round(t.duty_rate * 100)}%</td><td>{Math.round(t.vat_rate * 100)}%</td><td>{t.required_documents}</td><td><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">{t.restrictions}</span></td></tr>)}</tbody></table></div></Card><Card><h3 className="text-xl font-black">Calculateur FOB/CIF/CFR/DAP</h3><div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(calc).map(([key, val]) => <label key={key} className="text-xs font-bold uppercase text-slate-500">{key}<input value={val} onChange={e => setCalc({...calc, [key]: key === 'incoterm' ? e.target.value : Number(e.target.value)})} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-base normal-case text-slate-950 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white"/></label>)}</div><div className="mt-5 space-y-3 rounded-3xl bg-gradient-to-br from-blue-950 to-fuchsia-700 p-5 text-white"><MiniMetric label="Volume CBM" value={volume.toFixed(2)} /><MiniMetric label="Poids volumétrique air" value={`${volumetricAir.toFixed(1)} kg`} /><MiniMetric label="Fret estimé" value={formatMoney(freight)} /><MiniMetric label="Droits + TVA" value={formatMoney(duty + vat)} /><div className="border-t border-white/20 pt-3"><MiniMetric label="Coût landed" value={formatMoney(total)} /></div></div></Card></div><div className="mt-6 grid gap-4 lg:grid-cols-4">{carriers.map(c => <Card key={c.id}><div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-r ${accentMap[c.mode] || accentMap.road} p-3 text-white`}>{c.mode === 'air' ? <Plane/> : c.mode === 'sea' ? <Ship/> : c.mode === 'rail' ? <RailSymbol/> : <Truck/>}</div><h4 className="text-lg font-black">{c.name}</h4><p className="mt-1 text-sm text-slate-500">{c.lanes}</p><div className="mt-4 flex items-center justify-between"><span className="font-black">{formatMoney(c.base_rate, c.currency)}</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{c.reliability_score}%</span></div><p className="mt-3 text-xs text-slate-500">ETA {c.transit_days_min}-{c.transit_days_max} jours · Paiement {c.payment_methods}</p></Card>)}</div></>}</section>;
}

function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ company_name: '', contact_email: '', hs_code: '', mode: 'sea', origin: 'Alger', destination: 'Marseille', goods_value: 15000, weight_kg: 500, volume_cbm: 4, incoterm: 'CIF', duty_rate: 0.12, vat_rate: 0.19 });
  const load = async () => { setLoading(true); setError(''); try { setQuotes(await api<Quote[]>('/api/quotes')); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setFormError(''); if (!form.company_name || !form.contact_email.includes('@') || !form.hs_code) { setFormError('Entreprise, email valide et code SH obligatoires.'); return; } try { await api('/api/quotes', { method: 'POST', body: JSON.stringify(form) }); setForm({ ...form, company_name: '', contact_email: '', hs_code: '' }); load(); } catch (err) { setFormError((err as Error).message); } };
  const update = async (q: Quote, status: string) => { await api('/api/quotes', { method: 'PUT', body: JSON.stringify({ id: q.id, status }) }); load(); };
  const remove = async (id: number) => { await api('/api/quotes', { method: 'DELETE', body: JSON.stringify({ id }) }); load(); };
  return <section id="devis" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<FileText/>} eyebrow="Quote-to-cash" title="Devis intelligent & CRM" subtitle="Capture de besoins, estimation automatique, statut commercial, notifications email/PDF/Excel prêtes à brancher."/><div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]"><Card><h3 className="text-xl font-black">Nouvelle demande</h3><form onSubmit={submit} className="mt-4 grid gap-3">{Object.entries(form).map(([key, value]) => <label key={key} className="text-xs font-bold uppercase text-slate-500">{key.replaceAll('_',' ')}<input value={value} onChange={e => setForm({ ...form, [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base normal-case text-slate-950 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-white/10 dark:bg-white/10 dark:text-white"/></label>)}{formError && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 dark:bg-red-500/10">{formError}</p>}<button className="rounded-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 px-5 py-4 font-black text-white shadow-lg">Calculer & envoyer</button></form></Card><Card><h3 className="text-xl font-black">Pipeline CRM</h3>{loading ? <Skeleton/> : error ? <ErrorBox message={error} onRetry={load}/> : <div className="mt-4 space-y-3">{quotes.map(q => <div key={q.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="font-black">{q.company_name} · {q.hs_code}</p><p className="text-sm text-slate-500">{q.origin} → {q.destination} · {q.mode.toUpperCase()} · {q.incoterm}</p></div><div className="text-right"><p className="text-lg font-black">{formatMoney(q.estimated_total)}</p><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">{q.status}</span></div></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => update(q, 'Qualifié')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">Qualifier</button><button onClick={() => update(q, 'Envoyé PDF')} className="rounded-full bg-fuchsia-100 px-3 py-2 text-xs font-black text-fuchsia-700">PDF</button><button onClick={() => remove(q.id)} className="rounded-full bg-red-100 px-3 py-2 text-xs font-black text-red-700">Supprimer</button></div></div>)}</div>}</Card></div></section>;
}

function Tracking() {
  const [shipments, setShipments] = useState<Shipment[]>([]); const [q, setQ] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setShipments(await api<Shipment[]>(`/api/shipments?q=${encodeURIComponent(q)}`)); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const update = async (id: number, status: string, progress: number) => { await api('/api/shipments', { method: 'PUT', body: JSON.stringify({ id, status, progress }) }); load(); };
  return <section id="tracking" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<PackageCheck/>} eyebrow="Visibility tower" title="Suivi BL, AWB et conteneurs" subtitle="Tracking multimodal, ETA, statuts, alertes et timeline opérationnelle."/><Card><div className="flex flex-col gap-3 sm:flex-row"><input value={q} onChange={e => setQ(e.target.value)} placeholder="BL, AWB, conteneur, référence..." className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/10"/><button onClick={load} className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white dark:bg-white dark:text-slate-950">Tracker</button></div></Card>{loading ? <SkeletonGrid/> : error ? <ErrorBox message={error} onRetry={load}/> : <div className="mt-6 grid gap-4 lg:grid-cols-3">{shipments.map(s => <Card key={s.id}><div className="flex items-start justify-between"><div><p className="font-black">{s.reference}</p><p className="text-sm text-slate-500">{s.tracking_number}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${s.alert_level === 'red' ? 'bg-red-100 text-red-700' : s.alert_level === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{s.status}</span></div><div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><p className="text-sm font-bold">{s.origin} → {s.destination}</p><p className="mt-1 text-xs text-slate-500">{s.mode.toUpperCase()} · {s.carrier_name} · BL/AWB {s.bl_awb}</p><p className="mt-1 text-xs text-slate-500">Conteneur {s.container_number || 'N/A'} · ETA {new Date(s.eta).toLocaleDateString('fr-FR')}</p><div className="mt-4 h-3 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500" style={{ width: `${s.progress}%` }} /></div></div><div className="mt-4 flex gap-2"><button onClick={() => update(s.id, 'En dédouanement', 75)} className="rounded-full bg-blue-100 px-3 py-2 text-xs font-black text-blue-700">Dédouanement</button><button onClick={() => update(s.id, 'Livré', 100)} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">Livré</button></div></Card>)}</div>}</section>;
}

function Docs() {
  const [items, setItems] = useState<ContentItem[]>([]); const [type, setType] = useState('Document'); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setItems(await api<ContentItem[]>(`/api/content?type=${type}`)); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [type]);
  return <section id="docs" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<BookOpen/>} eyebrow="Knowledge base" title="Base documentaire, réglementations et aide" subtitle="Guides douaniers, documents requis, actualités, FAQ et centre d’aide multilingue."/><div className="mb-6 flex flex-wrap gap-2">{['Document','Regulation','News','FAQ','Help'].map(t => <button key={t} onClick={() => setType(t)} className={`rounded-full px-4 py-2 text-sm font-black ${type === t ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'bg-white text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{t}</button>)}</div>{loading ? <SkeletonGrid/> : error ? <ErrorBox message={error} onRetry={load}/> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <Card key={item.id}><span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">{item.type} · {item.lang}</span><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.summary}</p><p className="mt-4 text-sm leading-6">{item.body}</p><p className="mt-4 text-xs font-bold text-slate-400">Tags: {item.tags}</p></Card>)}</div>}</section>;
}

function Assistant() {
  const [question, setQuestion] = useState('Quel code SH pour des panneaux solaires ?'); const [messages, setMessages] = useState<Array<{ id: number; question: string; answer: string }>>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const ask = async () => { setError(''); if (!question.trim()) { setError('Veuillez saisir une question.'); return; } setBusy(true); try { const msg = await api<{ id: number; question: string; answer: string }>('/api/assistant', { method: 'POST', body: JSON.stringify({ question, lang: 'FR' }) }); setMessages([msg, ...messages]); setQuestion(''); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } };
  return <section id="ia" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<Bot/>} eyebrow="AI customs copilot" title="Assistant IA TarifAI" subtitle="Recommandation de code SH, explication des règles douanières, calculs et réponses contextuelles fondées sur la base métier."/><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><Card><div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-fuchsia-800 p-5 text-white"><Bot size={42}/><h3 className="mt-4 text-2xl font-black">Posez votre question</h3><p className="mt-2 text-white/70">Exemples: documents pour batterie lithium, CIF Alger, droits TVA textile, restrictions alimentaire.</p></div><textarea value={question} onChange={e => setQuestion(e.target.value)} className="mt-4 min-h-36 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-white/10 dark:bg-white/10" />{error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}<button onClick={ask} disabled={busy} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 px-5 py-4 font-black text-white disabled:opacity-60">{busy ? 'Analyse...' : 'Demander à l’IA'}</button></Card><Card><h3 className="text-xl font-black">Conversation</h3><div className="mt-4 space-y-4">{messages.length === 0 && <div className="rounded-3xl bg-slate-50 p-6 text-slate-500 dark:bg-white/5">Aucune question dans cette session. Les réponses sont générées depuis la base Supabase assistant_knowledge et historisées.</div>}{messages.map(m => <div key={m.id} className="rounded-3xl bg-slate-50 p-5 dark:bg-white/5"><p className="font-black text-blue-600 dark:text-cyan-300">Q: {m.question}</p><p className="mt-3 whitespace-pre-line leading-7">{m.answer}</p></div>)}</div></Card></div></section>;
}

const STOPWORDS = new Set(['de','la','le','les','du','des','un','une','et','en','pour','avec','sur','dans','au','aux','ou','par','ce','cette','ces','type','genre']);

type RgiStep = 'search' | 'incomplete' | 'composite' | 'specific' | 'essential' | 'result';

function ClassificationWizard() {
  const [productQuery, setProductQuery] = useState('');
  const [candidates, setCandidates] = useState<Tariff[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<RgiStep>('search');
  const [trail, setTrail] = useState<string[]>([]);
  const [result, setResult] = useState<Tariff | null>(null);
  const [essentialInput, setEssentialInput] = useState('');

  const search = async () => {
    setError('');
    if (!productQuery.trim()) { setError('Décrivez le produit à classer (matière, fonction, nom usuel...).'); return; }
    setBusy(true);
    try {
      const words = productQuery.toLowerCase().split(/[^a-zàâçéèêëîïôûùüÿñæœ0-9]+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
      const uniqueWords = Array.from(new Set(words)).sort((a, b) => b.length - a.length).slice(0, 4);
      const attempts = [productQuery.trim(), ...uniqueWords];

      let best: Tariff[] | null = null;
      let bestTerm = '';
      for (const term of attempts) {
        const found = await api<Tariff[]>(`/api/tariffs?q=${encodeURIComponent(term)}`);
        if (found.length >= 1 && found.length <= 20) { best = found; bestTerm = term; break; }
        if (found.length > 0 && (!best || found.length < best.length)) { best = found; bestTerm = term; }
      }

      if (!best || best.length === 0) {
        setError('Aucun code trouvé pour cette description. Essayez des mots plus généraux (matière, fonction principale).');
      } else if (best.length > 20) {
        setError(`${best.length} résultats pour « ${bestTerm} » — trop pour comparer précisément. Précisez avec la matière, la fonction ou un terme plus spécifique.`);
      } else if (best.length === 1) {
        setCandidates(best);
        setResult(best[0]);
        setTrail([`Une seule position correspond à « ${bestTerm} » — retenue directement (Règle 1).`]);
        setStep('result');
      } else {
        setCandidates(best);
        setTrail(bestTerm === productQuery.trim() ? [] : [`Recherche affinée sur « ${bestTerm} » (${best.length} positions candidates).`]);
        setStep('incomplete');
      }
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  const answerIncomplete = (isIncomplete: boolean) => {
    if (isIncomplete) setTrail(t => [...t, "Produit incomplet, non fini, démonté ou non monté : classé comme le produit complet dès lors qu'il en présente déjà les caractéristiques essentielles (Règle 2a)."]);
    setStep('composite');
  };

  const answerComposite = (isComposite: boolean) => {
    setTrail(t => [...t, isComposite
      ? "Produit mélangé, composite ou vendu en assortiment : classement selon la Règle 3."
      : "Le libellé de position le plus précis prévaut sur un libellé plus général (Règle 1)."]);
    setStep('specific');
  };

  const pickSpecific = (t: Tariff | null) => {
    if (t) {
      setResult(t);
      setTrail(tr => [...tr, `Position la plus spécifique retenue (Règle 3a) : ${t.hs_code} — ${t.description_fr}`]);
      setStep('result');
    } else {
      setStep('essential');
    }
  };

  const submitEssential = () => {
    if (!essentialInput.trim()) return;
    const needle = essentialInput.toLowerCase();
    const match = candidates.find(c => c.description_fr.toLowerCase().includes(needle));
    if (match) {
      setResult(match);
      setTrail(t => [...t, `Caractère essentiel identifié ("${essentialInput}") : position retenue selon la Règle 3b — ${match.hs_code} — ${match.description_fr}`]);
    } else {
      const fallback = [...candidates].sort((a, b) => b.hs_code.localeCompare(a.hs_code))[0] || null;
      setResult(fallback);
      setTrail(t => [...t, fallback
        ? `Caractère essentiel non déterminant à partir des libellés disponibles : position retenue par défaut, la dernière par ordre de numérotation parmi les candidates (Règle 3c) — ${fallback.hs_code} — ${fallback.description_fr}`
        : "Aucune position candidate n'a pu être retenue automatiquement — une vérification manuelle est nécessaire."]);
    }
    setStep('result');
  };

  const reset = () => { setStep('search'); setCandidates([]); setResult(null); setTrail([]); setProductQuery(''); setEssentialInput(''); setError(''); };

  return <section id="classement" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <SectionTitle icon={<ShieldCheck/>} eyebrow="Classement guidé" title="Assistant de classement (Règles Générales d'Interprétation)" subtitle="Un questionnaire pas à pas fondé sur les 6 Règles Générales d'Interprétation du Système Harmonisé — déterministe et traçable, pas une estimation par IA générative."/>
    <Card>
      {step === 'search' && <div>
        <p className="font-black text-lg">Décrivez le produit à classer</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Nom usuel, matière principale, fonction. Ex: "table de cuisine en bois", "kit de spaghetti avec sauce et fromage".</p>
        <textarea value={productQuery} onChange={e => setProductQuery(e.target.value)} className="mt-4 min-h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-white/10 dark:bg-white/10" />
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10">{error}</p>}
        <button onClick={search} disabled={busy} className="mt-4 rounded-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 px-6 py-3 font-black text-white disabled:opacity-60">{busy ? 'Recherche...' : 'Commencer le classement'}</button>
      </div>}

      {step === 'incomplete' && <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{candidates.length} positions correspondent à « {productQuery} ».</p>
        <p className="mt-3 font-black text-lg">Le produit est-il incomplet, non fini, présenté démonté ou non monté ?</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => answerIncomplete(true)} className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white dark:bg-white dark:text-slate-950">Oui</button>
          <button onClick={() => answerIncomplete(false)} className="rounded-2xl border border-slate-200 px-6 py-3 font-black dark:border-white/10">Non</button>
        </div>
      </div>}

      {step === 'composite' && <div>
        <p className="font-black text-lg">Est-ce un mélange de matières, un assemblage de plusieurs éléments différents, ou un lot/kit vendu ensemble ?</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => answerComposite(true)} className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white dark:bg-white dark:text-slate-950">Oui</button>
          <button onClick={() => answerComposite(false)} className="rounded-2xl border border-slate-200 px-6 py-3 font-black dark:border-white/10">Non</button>
        </div>
      </div>}

      {step === 'specific' && <div>
        <p className="font-black text-lg">Choisissez la position dont le libellé décrit le plus précisément votre produit :</p>
        <div className="mt-4 space-y-2">
          {candidates.map(c => <button key={c.id} onClick={() => pickSpecific(c)} className="block w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-fuchsia-400 dark:border-white/10"><span className="font-black">{c.hs_code}</span> — {c.description_fr}</button>)}
          <button onClick={() => pickSpecific(null)} className="mt-2 rounded-2xl border border-dashed border-slate-300 px-6 py-3 font-black text-slate-500 dark:border-white/20">Aucune n'est plus précise qu'une autre</button>
        </div>
      </div>}

      {step === 'essential' && <div>
        <p className="font-black text-lg">Qu'est-ce qui donne à ce produit son caractère essentiel ?</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Matière dominante, fonction principale, poids ou valeur prépondérante...</p>
        <input value={essentialInput} onChange={e => setEssentialInput(e.target.value)} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-white/10 dark:bg-white/10" placeholder="Ex: coton, moteur électrique, bois..." />
        <button onClick={submitEssential} className="mt-4 rounded-2xl bg-gradient-to-r from-blue-700 via-fuchsia-600 to-orange-400 px-6 py-3 font-black text-white">Valider</button>
      </div>}

      {step === 'result' && <div>
        {result ? <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-900 to-fuchsia-800 p-6 text-white">
          <p className="text-sm font-bold text-white/70">Code SH suggéré</p>
          <p className="mt-1 text-3xl font-black">{result.hs_code}</p>
          <p className="mt-2 text-white/90">{result.description_fr}</p>
          <div className="mt-4 flex gap-4 text-sm"><span>Droit de douane : <strong>{Math.round((result.duty_rate || 0) * 100)}%</strong></span><span>TVA : <strong>{Math.round((result.vat_rate || 0) * 100)}%</strong></span></div>
        </div> : <p className="text-slate-500">Aucune position n'a pu être déterminée automatiquement — une vérification manuelle est nécessaire.</p>}
        <div className="mt-5">
          <p className="font-black">Raisonnement appliqué :</p>
          <ol className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">{trail.map((s, i) => <li key={i} className="flex gap-2"><span className="font-black text-fuchsia-600">{i + 1}.</span>{s}</li>)}</ol>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"><AlertTriangle size={18} className="mt-0.5 shrink-0"/><p>Suggestion générée automatiquement d'après les Règles Générales d'Interprétation. Elle ne remplace pas une décision de classement officielle — pour tout dossier engageant, faites confirmer ce code via la procédure de renseignement tarifaire de la DGD (modèle D.40).</p></div>
        <button onClick={reset} className="mt-5 rounded-2xl border border-slate-200 px-6 py-3 font-black dark:border-white/10">Nouveau classement</button>
      </div>}
    </Card>
  </section>;
}

function Admin() {
  const [data, setData] = useState<AdminData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { setData(await api<AdminData>('/api/admin')); } catch (err) { setError((err as Error).message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggleUser = async (id: number, status: string) => { await api('/api/admin', { method: 'PUT', body: JSON.stringify({ id, status }) }); load(); };
  return <section id="admin" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><SectionTitle icon={<Settings/>} eyebrow="Back-office" title="Administration SaaS & gouvernance" subtitle="Gestion utilisateurs, rôles, abonnements, paiements, tarifs, contenus, logs, statistiques et paramètres."/>{loading ? <SkeletonGrid/> : error ? <ErrorBox message={error} onRetry={load}/> : data && <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><h3 className="text-xl font-black">Utilisateurs & rôles</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-3">Entreprise</th><th>Email</th><th>Rôle</th><th>Plan</th><th>2FA</th><th>Status</th><th></th></tr></thead><tbody>{data.users.map(u => <tr key={u.id} className="border-t border-slate-100 dark:border-white/10"><td className="py-4 font-black">{u.company_name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.plan}</td><td>{u.two_factor_enabled ? 'Activé' : 'Non'}</td><td>{u.status}</td><td><button onClick={() => toggleUser(u.id, u.status === 'Actif' ? 'Suspendu' : 'Actif')} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black dark:bg-white/10">Basculer</button></td></tr>)}</tbody></table></div></Card><Card><h3 className="text-xl font-black">Paiements</h3><div className="mt-4 space-y-3">{data.payments.map(p => <div key={p.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><p className="font-black">{p.company_name}</p><p className="text-sm text-slate-500">{p.provider} · {formatMoney(p.amount, p.currency)} · {p.status}</p></div>)}</div></Card><Card className="lg:col-span-3"><h3 className="text-xl font-black">Logs & sécurité</h3><div className="mt-4 grid gap-3 md:grid-cols-3">{data.logs.map(l => <div key={l.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><p className="font-black">{l.action}</p><p className="text-sm text-slate-500">{l.actor} · {l.severity} · {new Date(l.created_at).toLocaleString('fr-FR')}</p></div>)}</div></Card></div>}</section>;
}

function SectionTitle({ icon, eyebrow, title, subtitle }: { icon: React.ReactNode; eyebrow: string; title: string; subtitle: string }) { return <div className="mb-8 max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm dark:bg-white/10 dark:text-cyan-200">{icon}{eyebrow}</div><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{title}</h2><p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{subtitle}</p></div>; }
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-[1.7rem] border border-white/60 bg-white/82 p-5 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-white/[0.07] ${className}`}>{children}</div>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold opacity-75">{label}</span><span className="font-black">{value}</span></div>; }
function Skeleton() { return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-white/10" />)}</div>; }
function SkeletonGrid() { return <div className="grid gap-4 md:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-white/10" />)}</div>; }
function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10"><div className="flex items-center gap-2 font-black"><AlertTriangle/> Erreur</div><p className="mt-2">{message}</p><button onClick={onRetry} className="mt-4 rounded-full bg-red-600 px-4 py-2 font-black text-white">Réessayer</button></div>; }
function Footer() { return <footer className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-[2rem] bg-slate-950 p-8 text-white dark:bg-white/10"><div className="grid gap-8 md:grid-cols-4"><div><h3 className="text-2xl font-black">TarifAI</h3><p className="mt-3 text-sm text-white/60">Plateforme de classification tarifaire et de logistique douanière pour les professionnels du commerce international en Algérie.</p></div>{[['Sécurité',[<ShieldCheck key="s"/>, 'Row Level Security, authentification chiffrée']], ['Facturation',[<CreditCard key="c"/>, 'Sur devis, facturation entreprise']], ['Langue',[<Globe2 key="g"/>, 'Français (Algérie)']], ['Alertes',[<Bell key="b"/>, 'Notifications par email']]].map(([title, body]) => <div key={title as string}><h4 className="font-black">{title}</h4><p className="mt-3 flex items-center gap-2 text-sm text-white/60">{body as React.ReactNode}</p></div>)}</div></div></footer>; }

export default function App() { return <AuthProvider><AppShell /></AuthProvider>; }
