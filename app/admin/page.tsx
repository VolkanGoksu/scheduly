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
  
  // Registration Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [staffMembers, setStaffMembers] = useState([{ name: "", phone: "" }]);
  
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  
  // Detail/Edit Modal State
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerStaff, setProviderStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");
        
        const { data } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
        if (data?.role === 'admin') {
          setIsAdmin(true);
          await fetchProviders();
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Admin check failed", err);
      }
    }
    checkAdmin();
  }, [router]);

  const fetchProviders = async () => {
    const { data } = await supabase.from("users").select("*").eq("role", "provider").order("created_at", { ascending: false });
    setProviders(data || []);
  };

  const fetchStaffForProvider = async (providerId: string) => {
    const { data } = await supabase.from("staff").select("*").eq("user_id", providerId).order("created_at", { ascending: true });
    setProviderStaff(data || []);
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user?.id,
        email: email.trim(),
        business_name: businessName,
        phone_number: phoneNumber,
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        role: 'provider',
        is_active: true,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });

      if (profileError) throw profileError;

      for (const s of staffMembers) {
        if (s.name.trim()) {
          await supabase.from("staff").insert({
            user_id: authData.user?.id,
            name: s.name,
            phone_number: s.phone
          });
        }
      }
      alert("Başarıyla oluşturuldu!");
      setEmail(""); setPassword(""); setBusinessName(""); setPhoneNumber(""); setSlug(""); setStaffMembers([{ name: "", phone: "" }]);
      fetchProviders();
    } catch (err: any) {
      alert("Hata: " + (err.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("BU İŞLETMEYİ TAMAMEN SİLMEK İSTEDİĞİNE EMİN MİSİN?")) return;
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      alert("İşletme başarıyla silindi!");
      setSelectedProvider(null);
      await fetchProviders();
    } catch (err: any) {
      alert("Silme Hatası: " + err.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      alert("Durum güncellendi!");
      await fetchProviders();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const setTrial = async (id: string) => {
    if (!confirm("7 günlük deneme süresi tanımlıyorsunuz. Onaylıyor musunuz?")) return;
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const { error } = await supabase.from("users").update({ 
        expires_at: expiresAt.toISOString(), 
        is_active: true 
      }).eq("id", id);
      if (error) throw error;
      alert("7 Günlük Deneme başarıyla tanımlandı!");
      await fetchProviders();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const extendSubscription = async (id: string, months: number, currentExpiry: string | null) => {
    if (!confirm("+1 ay abonelik ekliyorsunuz. Onaylıyor musunuz?")) return;
    try {
      const baseDate = (currentExpiry && new Date(currentExpiry) > new Date()) ? new Date(currentExpiry) : new Date();
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + months);
      const { error } = await supabase.from("users").update({ 
        expires_at: newExpiry.toISOString(), 
        is_active: true 
      }).eq("id", id);
      if (error) throw error;
      alert("Abonelik +1 ay uzatıldı!");
      await fetchProviders();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const addStaffToProvider = async () => {
    if (!newStaffName.trim()) return;
    try {
      const { error } = await supabase.from("staff").insert({
        user_id: selectedProvider.id,
        name: newStaffName,
        phone_number: newStaffPhone
      });
      if (error) throw error;
      setNewStaffName(""); setNewStaffPhone("");
      await fetchStaffForProvider(selectedProvider.id);
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const removeStaffFromProvider = async (staffId: string) => {
    if (!confirm("Çalışanı silmek istediğine emin misin?")) return;
    try {
      const { error } = await supabase.from("staff").delete().eq("id", staffId);
      if (error) throw error;
      await fetchStaffForProvider(selectedProvider.id);
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  if (!isAdmin) return (
    <div className="flex flex-col h-screen items-center justify-center p-8 text-center space-y-6">
      <div className="animate-spin text-4xl">⚙️</div>
      <p className="font-black uppercase tracking-widest text-zinc-500">Admin yetkisi kontrol ediliyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tightest">ADMINMASTER</h1>
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">AKTİF</span>
          </div>
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl font-black text-[10px] uppercase shadow-sm border border-zinc-200 dark:border-zinc-700">
            {lang.toUpperCase()}
          </button>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[4rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 h-fit sticky top-8">
              <h2 className="text-2xl font-black uppercase mb-10 italic flex items-center gap-4">
                <span className="w-10 h-10 bg-black dark:bg-zinc-700 text-white rounded-2xl flex items-center justify-center text-lg rotate-12">+</span>
                {t.addProvider}
              </h2>
              <form onSubmit={handleCreateProvider} className="space-y-6">
                <div className="space-y-4">
                  <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all font-bold" required />
                  <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all font-bold" required />
                  <input type="text" placeholder={t.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all font-bold" required />
                  <input type="text" placeholder={t.urlSlug} value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] outline-none border-2 border-transparent focus:border-black dark:focus:border-white transition-all font-bold" required />
                </div>

                <div className="space-y-4 p-8 bg-emerald-50 dark:bg-emerald-500/5 rounded-[3rem] border-2 border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">ÇALIŞANLAR</p>
                    <button type="button" onClick={() => setStaffMembers([...staffMembers, { name: "", phone: "" }])} className="bg-emerald-500 text-white px-4 py-2 rounded-2xl text-xs font-black hover:scale-110 transition-all shadow-lg">+</button>
                  </div>
                  {staffMembers.map((s, i) => (
                    <div key={i} className="space-y-2 relative p-5 bg-white dark:bg-zinc-950 rounded-[2rem] border border-emerald-50 dark:border-emerald-900/30">
                      <input type="text" placeholder="İsim" value={s.name} onChange={(e) => { const n = [...staffMembers]; n[i].name = e.target.value; setStaffMembers(n); }} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-black uppercase tracking-tight" />
                      <input type="tel" placeholder="WP (90...)" value={s.phone} onChange={(e) => { const n = [...staffMembers]; n[i].phone = e.target.value; setStaffMembers(n); }} className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-black" />
                    </div>
                  ))}
                </div>

                <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] transition-all shadow-2xl">
                  {loading ? '...' : 'İşletmeyi Oluştur'}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              Kayıtlı İşletmeler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {providers.map(p => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 p-10 rounded-[4rem] border border-zinc-100 dark:border-zinc-800 shadow-xl space-y-8 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" onClick={() => setSelectedProvider(p)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-2xl tracking-tighter leading-none mb-3 group-hover:text-emerald-500 transition-colors uppercase">{p.business_name}</h3>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none">scheduly.com/{p.slug}</p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => toggleActive(p.id, p.is_active)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-[1.5rem] text-xl hover:bg-black hover:text-white transition-all shadow-lg">
                        {p.is_active ? '❄️' : '🔥'}
                       </button>
                       <button onClick={() => deleteProvider(p.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 rounded-[1.5rem] text-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">
                        🗑️
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] flex justify-between items-center border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kalan Süre</p>
                        <p className={`text-base font-black ${p.expires_at && new Date(p.expires_at) < new Date() ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {p.expires_at ? new Date(p.expires_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sınırsız'}
                        </p>
                      </div>
                      <span className={`w-3 h-3 rounded-full ${p.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    </div>
                    
                    <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setTrial(p.id)} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">7 GÜN DENEME</button>
                      <button onClick={() => extendSubscription(p.id, 1, p.expires_at)} className="flex-1 border-2 border-zinc-200 dark:border-zinc-700 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-black dark:hover:border-white transition-all">+1 AY EKLE</button>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[10px] font-black uppercase text-zinc-400">Detayları Gör →</span>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`/${p.slug}`, '_blank'); }} className="text-[10px] font-black uppercase text-emerald-500 underline">Siteye Git</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - same as before but ensured to work with fetchProviders */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4" onClick={() => setSelectedProvider(null)}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[5rem] shadow-[0_0_100px_rgba(0,0,0,0.7)] overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-12 md:p-20 relative">
              <button onClick={() => setSelectedProvider(null)} className="absolute top-12 right-12 w-20 h-20 flex items-center justify-center rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 text-4xl font-light hover:bg-red-500 hover:text-white transition-all shadow-2xl">×</button>

              <div className="mb-20">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4 block">İşletme Detay Profili</span>
                <h2 className="text-6xl font-black uppercase tracking-tightest mb-6">{selectedProvider.business_name}</h2>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800 px-8 py-4 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Yönetici Email</p>
                    <p className="text-xl font-bold">{selectedProvider.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div className="space-y-8">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-4">
                    <span className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">👥</span>
                    Mevcut Ekip
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
                    {providerStaff.length === 0 && (
                      <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800 rounded-[3rem] border-4 border-dashed border-zinc-100 dark:border-zinc-800">
                        <p className="text-zinc-400 font-black uppercase text-sm tracking-[0.2em]">Ekip henüz kurulmamış</p>
                      </div>
                    )}
                    {providerStaff.map((staff) => (
                      <div key={staff.id} className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-[3rem] flex justify-between items-center group border-2 border-transparent hover:border-emerald-500/30 transition-all shadow-sm">
                        <div>
                          <p className="font-black tracking-tight text-2xl uppercase mb-1">{staff.name}</p>
                          <p className="text-sm font-bold text-zinc-500 tracking-widest">{staff.phone_number}</p>
                        </div>
                        <button onClick={() => removeStaffFromProvider(staff.id)} className="w-14 h-14 flex items-center justify-center bg-white dark:bg-zinc-900 text-red-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 bg-zinc-50 dark:bg-zinc-800/30 p-12 rounded-[4rem] border border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-2xl font-black text-emerald-600 uppercase">Ekibe Yeni Birini Kat</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 mb-3 tracking-widest">Tam İsim</label>
                      <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full p-5 bg-white dark:bg-zinc-900 rounded-3xl outline-none border-4 border-transparent focus:border-emerald-500 transition-all font-black text-lg" placeholder="Örn: Volkan Demir" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 mb-3 tracking-widest">WhatsApp Hattı</label>
                      <input type="tel" value={newStaffPhone} onChange={(e) => setNewStaffPhone(e.target.value)} className="w-full p-5 bg-white dark:bg-zinc-900 rounded-3xl outline-none border-4 border-transparent focus:border-emerald-500 transition-all font-black text-lg" placeholder="905..." />
                    </div>
                    <button onClick={addStaffToProvider} className="w-full bg-emerald-500 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/40 hover:scale-105 transition-all">EKİBE EKLE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
