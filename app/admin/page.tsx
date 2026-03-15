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
  
  // Multiple Staff State
  const [staffMembers, setStaffMembers] = useState([{ name: "", phone: "" }]);
  
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
      } else {
        router.push("/dashboard");
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
      alert("Auth Error: " + authError.message);
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
      alert("Profile Error: " + profileError.message);
    } else {
      for (const s of staffMembers) {
        if (s.name.trim()) {
          await supabase.from("staff").insert({
            user_id: authData.user?.id,
            name: s.name,
            phone_number: s.phone
          });
        }
      }
      alert(lang === 'tr' ? "İşletme ve Çalışanlar başarıyla oluşturuldu!" : "Provider and Staff created successfully!");
      setEmail(""); setPassword(""); setBusinessName(""); setPhoneNumber(""); setSlug(""); setStaffMembers([{ name: "", phone: "" }]);
      fetchProviders();
    }
    setLoading(false);
  };

  const deleteProvider = async (id: string) => {
    if (!confirm(lang === 'tr' ? "Bu işletmeyi silmek istediğine emin misin? Bu işlem geri alınamaz." : "Are you sure you want to delete this provider? This cannot be undone.")) return;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchProviders();
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
    
    if (error) {
      console.error("Trial Error:", error);
      alert("Hata: " + error.message);
    } else {
      alert("7 Günlük Deneme Tanımlandı!");
      fetchProviders();
    }
  };

  const extendSubscription = async (id: string, months: number, currentExpiry: string | null) => {
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    if (baseDate < new Date()) baseDate.setTime(new Date().getTime());
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    
    const { error } = await supabase.from("users").update({ 
      expires_at: newExpiry.toISOString(),
      is_active: true,
    }).eq("id", id);
    
    if (error) {
       console.error("Extension Error:", error);
       alert("Hata: " + error.message);
    } else {
      alert(`Abonelik ${months} ay uzatıldı!`);
      fetchProviders();
    }
  };

  const addStaffField = () => setStaffMembers([...staffMembers, { name: "", phone: "" }]);
  const removeStaffField = (index: number) => setStaffMembers(staffMembers.filter((_, i) => i !== index));
  const updateStaffField = (index: number, field: 'name' | 'phone', value: string) => {
    const newStaff = [...staffMembers];
    newStaff[index][field] = value;
    setStaffMembers(newStaff);
  };

  if (!isAdmin) return <div className="p-20 text-center font-bold">Checking Admin Access...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tightest">SCHEDULY ADMIN</h1>
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-bold text-xs uppercase">
            {lang.toUpperCase()}
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Create Form */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-zinc-800 h-fit">
              <h2 className="text-xl font-black uppercase mb-8 italic">{t.addProvider}</h2>
              <form onSubmit={handleCreateProvider} className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Giriş Bilgileri</p>
                  <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                  <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">İşletme Bilgileri</p>
                  <input type="text" placeholder={t.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                  <input type="text" placeholder={t.urlSlug} value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-transparent focus:border-black transition-all" required />
                </div>

                <div className="space-y-4 p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">{lang === 'tr' ? 'ÇALIŞANLAR' : 'STAFF'}</p>
                    <button type="button" onClick={addStaffField} className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black hover:scale-105 transition-all">+ EKLE</button>
                  </div>
                  {staffMembers.map((s, i) => (
                    <div key={i} className="space-y-2 relative p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-emerald-50 shadow-sm">
                      <input type="text" placeholder="İsim" value={s.name} onChange={(e) => updateStaffField(i, 'name', e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-bold" />
                      <input type="tel" placeholder="WP (90...)" value={s.phone} onChange={(e) => updateStaffField(i, 'phone', e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-bold" />
                      {staffMembers.length > 1 && (
                        <button type="button" onClick={() => removeStaffField(i)} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>

                <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl">
                  {loading ? '...' : t.addProvider}
                </button>
              </form>
            </div>
          </div>

          {/* Provider List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black uppercase italic mb-4">{t.existingProviders}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map(p => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-black text-xl tracking-tight leading-none">{p.business_name}</h3>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {p.is_active ? 'Açık' : 'Kapalı'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">/{p.slug}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => toggleActive(p.id, p.is_active)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-lg hover:bg-black hover:text-white transition-all">
                        {p.is_active ? '❄️' : '🔥'}
                       </button>
                       <button onClick={() => deleteProvider(p.id)} className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl text-lg hover:bg-red-500 hover:text-white transition-all">
                        🗑️
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t.expiresAt}</p>
                      <p className={`text-sm font-bold ${p.expires_at && new Date(p.expires_at) < new Date() ? 'text-red-500' : ''}`}>
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString('tr-TR') : 'Sınırsız'}
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Durum</p>
                      <p className="text-sm font-bold">{p.is_active ? 'Aktif' : 'Donduruldu'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setTrial(p.id)} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] transition-all">7 GÜN DENEME</button>
                    <button onClick={() => extendSubscription(p.id, 1, p.expires_at)} className="flex-1 border-2 border-zinc-100 dark:border-zinc-800 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-black transition-all">+1 AY EKLE</button>
                  </div>

                  <div className="pt-2 flex gap-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                    <button onClick={() => window.open(`/${p.slug}`, '_blank')} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors underline">Siteyi Gör →</button>
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
