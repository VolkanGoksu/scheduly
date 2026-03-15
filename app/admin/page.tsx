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
  // New Staff State
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      
      const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (data?.role === 'admin') {
        setIsAdmin(true);
        fetchProviders();
      }
    }
    checkAdmin();
  }, [router]);

  const fetchProviders = async () => {
    const { data } = await supabase.from("users").select("*").eq("role", "provider").order("created_at", { ascending: false });
    setProviders(data || []);
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedEmail = email.trim();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

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
      // Create initial staff if provided
      if (staffName && staffPhone) {
        await supabase.from("staff").insert({
          user_id: authData.user?.id,
          name: staffName,
          phone_number: staffPhone
        });
      }
      
      alert(lang === 'tr' ? "İşletme ve Çalışan başarıyla oluşturuldu!" : "Provider and Staff created successfully!");
      setEmail(""); setPassword(""); setBusinessName(""); setPhoneNumber(""); setSlug(""); setStaffName(""); setStaffPhone("");
      fetchProviders();
    }
    setLoading(false);
  };

  if (!isAdmin) return <div className="p-20 text-center font-bold">Checking Admin Access...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tightest">ADMIN PANEL</h1>
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-bold text-xs">
            {lang.toUpperCase()}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Create Form */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-zinc-800 h-fit">
            <h2 className="text-xl font-black uppercase mb-8 italic">{t.addProvider}</h2>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Giriş Bilgileri</p>
                <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">İşletme Bilgileri</p>
                <input type="text" placeholder={t.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                <input type="text" placeholder={t.urlSlug} value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
              </div>

              <div className="space-y-2 p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-3xl border border-emerald-100 dark:border-emerald-500/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">İlk Çalışanı Ekle (Opsiyonel)</p>
                <input type="text" placeholder="Çalışan İsmi" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl outline-none border border-transparent focus:border-emerald-500 transition-all text-sm font-medium" />
                <input type="tel" placeholder="Çalışan WP (90...)" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-900 rounded-xl outline-none border border-transparent focus:border-emerald-500 transition-all text-sm font-medium" />
              </div>

              <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl">
                {loading ? '...' : t.addProvider}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black uppercase italic mb-4">{t.existingProviders}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map(p => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-xl tracking-tight leading-none mb-2">{p.business_name}</h3>
                      <p className="text-xs font-bold text-zinc-400">/{p.slug}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => supabase.from("users").update({ is_active: !p.is_active }).eq("id", p.id).then(fetchProviders)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-lg hover:scale-110 transition-all">
                        {p.is_active ? '❄️' : '🔥'}
                       </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/dashboard`)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">PANELE GİT</button>
                    <button onClick={() => window.open(`/${p.slug}`, '_blank')} className="flex-1 border-2 border-zinc-100 dark:border-zinc-800 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-black transition-all">GÖRÜNTÜLE</button>
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
