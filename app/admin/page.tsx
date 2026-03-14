"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { translations, Language } from "@/lib/i18n";

export default function AdminPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang];
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found, redirecting to login");
        return router.push("/login");
      }
      
      const { data, error } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      console.log("Admin check - User ID:", user.id, "Role:", data?.role, "Error:", error);
      
      if (data?.role === 'admin') {
        setIsAdmin(true);
        fetchProviders();
      } else {
        console.log("Access denied, role is:", data?.role);
        // Do not redirect immediately so we can see the log if needed, 
        // but for UX we should show an error
      }
    }
    checkAdmin();
  }, []);

  const fetchProviders = async () => {
    const { data } = await supabase.from("users").select("*").eq("role", "provider").order("created_at", { ascending: false });
    setProviders(data || []);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("users").update({ is_active: !currentStatus }).eq("id", id);
    if (error) alert(error.message);
    else fetchProviders();
  };

  const setTrial = async (id: string) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { error } = await supabase.from("users").update({ 
      expires_at: expiresAt.toISOString(),
      is_active: true,
      activated_at: new Date().toISOString()
    }).eq("id", id);
    
    if (error) alert(error.message);
    else fetchProviders();
  };

  const extendSubscription = async (id: string, months: number, currentExpiry: string | null, currentActivatedAt: string | null) => {
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    if (baseDate < new Date()) {
      baseDate.setTime(new Date().getTime());
    }
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    
    const { error } = await supabase.from("users").update({ 
      expires_at: newExpiry.toISOString(),
      is_active: true,
      activated_at: currentActivatedAt || new Date().toISOString()
    }).eq("id", id);
    
    if (error) alert(error.message);
    else fetchProviders();
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider? This cannot be undone.")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchProviders();
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Create Auth User
    const trimmedEmail = email.trim();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (authError) {
      if (authError.message.includes("rate limit")) {
        alert(lang === 'tr' 
          ? "Çok fazla istek yapıldı. Lütfen biraz bekleyin veya Supabase panelinden 'Email Rate Limit' ayarını yükseltin." 
          : "Rate limit exceeded. Please wait a moment or increase 'Email Rate Limit' in Supabase settings.");
      } else {
        alert(authError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Create Profile
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user?.id,
      email: trimmedEmail,
      business_name: businessName,
      phone_number: phoneNumber,
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      role: 'provider',
      is_active: true,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });

    if (profileError) {
      alert(profileError.message);
    } else {
      alert(lang === 'tr' ? "İşletme başarıyla oluşturuldu! (7 Günlük Deneme Tanımlandı)" : "Provider created successfully! (7-Day Trial set)");
      setEmail("");
      setPassword("");
      setBusinessName("");
      setPhoneNumber("");
      setSlug("");
      fetchProviders();
    }
    setLoading(false);
  };

  const router = useRouter();

  if (!isAdmin) return (
    <div className="p-20 text-center space-y-4">
      <div className="text-4xl">🚫</div>
      <div className="font-black text-2xl uppercase tracking-widest">{t.loading}</div>
      <p className="text-zinc-500">Admin yetkisi kontrol ediliyor...</p>
      <button onClick={() => router.push("/dashboard")} className="text-sm font-bold text-blue-500 underline">Panele Dön</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black tracking-tightest uppercase">{t.admin}</h1>
          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-bold text-xs uppercase"
          >
            {lang.toUpperCase()}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Create Provider */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-6 italic">{t.addProvider}</h2>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none" required />
              <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none" required />
              <input type="text" placeholder={t.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none" required />
              <input type="tel" placeholder={lang === 'tr' ? "WhatsApp Numarası (90...)" : "WhatsApp Phone"} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none" required />
              <input type="text" placeholder={t.urlSlug} value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl outline-none" required />
              <button 
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition-all"
              >
                {loading ? t.loading : t.addProvider}
              </button>
            </form>
          </div>

          {/* Provider List */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-6 italic">{t.existingProviders}</h2>
            <div className="space-y-4">
              {providers.map(p => (
                <div key={p.id} className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-[2.5rem] shadow-xl border border-zinc-100 dark:border-zinc-800 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-xl tracking-tight">{p.business_name}</h3>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {p.is_active ? t.activate : t.freeze}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm font-medium">scheduly.com/{p.slug}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => toggleActive(p.id, p.is_active)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        {p.is_active ? '❄️' : '🔥'}
                       </button>
                       <button onClick={() => deleteProvider(p.id)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-red-500">
                        🗑️
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-700/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t.activatedAt}</p>
                      <p className="text-sm font-bold">{p.activated_at ? new Date(p.activated_at).toLocaleDateString('tr-TR') : t.notSet}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-700/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t.expiresAt}</p>
                      <p className={`text-sm font-bold ${p.expires_at && new Date(p.expires_at) < new Date() ? 'text-red-500' : ''}`}>
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString('tr-TR') : t.forever}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setTrial(p.id)}
                      className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                    >
                      {t.trial7Day}
                    </button>
                    <button 
                      onClick={() => extendSubscription(p.id, 1, p.expires_at, p.activated_at)}
                      className="flex-1 border-2 border-zinc-200 dark:border-zinc-800 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-black dark:hover:border-white transition-all"
                    >
                      {t.add1Month}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
