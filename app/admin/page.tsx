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

  const fetchStaffForProvider = async (providerId: string) => {
    const { data } = await supabase.from("staff").select("*").eq("user_id", providerId).order("created_at", { ascending: true });
    setProviderStaff(data || []);
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
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
      email: email.trim(),
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
      alert("Başarıyla oluşturuldu!");
      setEmail(""); setPassword(""); setBusinessName(""); setPhoneNumber(""); setSlug(""); setStaffMembers([{ name: "", phone: "" }]);
      fetchProviders();
    }
    setLoading(false);
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Bu işletmeyi tamamen silmek istediğine emin misin?")) return;
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
    await supabase.from("users").update({ expires_at: expiresAt.toISOString(), is_active: true }).eq("id", id);
    fetchProviders();
  };

  const extendSubscription = async (id: string, months: number, currentExpiry: string | null) => {
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);
    await supabase.from("users").update({ expires_at: newExpiry.toISOString(), is_active: true }).eq("id", id);
    fetchProviders();
  };

  // Staff Management In Modal
  const addStaffToProvider = async () => {
    if (!newStaffName.trim()) return;
    const { error } = await supabase.from("staff").insert({
      user_id: selectedProvider.id,
      name: newStaffName,
      phone_number: newStaffPhone
    });
    if (error) alert(error.message);
    else {
      setNewStaffName(""); setNewStaffPhone("");
      fetchStaffForProvider(selectedProvider.id);
    }
  };

  const removeStaffFromProvider = async (staffId: string) => {
    const { error } = await supabase.from("staff").delete().eq("id", staffId);
    if (error) alert(error.message);
    else fetchStaffForProvider(selectedProvider.id);
  };

  const openProviderDetails = (provider: any) => {
    setSelectedProvider(provider);
    fetchStaffForProvider(provider.id);
  };

  if (!isAdmin) return <div className="p-20 text-center font-bold">Checking Admin Access...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tightest">SCHEDULY ADMIN</h1>
            <span className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">MASTER</span>
          </div>
          <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-bold text-xs">
            {lang.toUpperCase()}
          </button>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Create Provider Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-zinc-200 dark:border-zinc-800 h-fit sticky top-8">
              <h2 className="text-xl font-black uppercase mb-8 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs">+</span>
                {t.addProvider}
              </h2>
              <form onSubmit={handleCreateProvider} className="space-y-6">
                <div className="space-y-4">
                  <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border-2 border-transparent focus:border-black transition-all" required />
                  <input type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border-2 border-transparent focus:border-black transition-all" required />
                  <input type="text" placeholder={t.businessName} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border-2 border-transparent focus:border-black transition-all" required />
                  <input type="text" placeholder={t.urlSlug} value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border-2 border-transparent focus:border-black transition-all" required />
                </div>

                <div className="space-y-4 p-6 bg-emerald-50 dark:bg-emerald-500/5 rounded-[2.5rem] border-2 border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">İLK ÇALIŞANLAR</p>
                    <button type="button" onClick={() => setStaffMembers([...staffMembers, { name: "", phone: "" }])} className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black hover:scale-105 transition-all">+</button>
                  </div>
                  {staffMembers.map((s, i) => (
                    <div key={i} className="space-y-2 relative p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-emerald-50">
                      <input type="text" placeholder="İsim" value={s.name} onChange={(e) => { const n = [...staffMembers]; n[i].name = e.target.value; setStaffMembers(n); }} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-bold" />
                      <input type="tel" placeholder="WP (90...)" value={s.phone} onChange={(e) => { const n = [...staffMembers]; n[i].phone = e.target.value; setStaffMembers(n); }} className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl outline-none text-sm font-bold" />
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
            <h2 className="text-xl font-black uppercase italic mb-8">{t.existingProviders}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map(p => (
                <div key={p.id} className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer" onClick={() => openProviderDetails(p)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-xl tracking-tight leading-none mb-1 group-hover:text-emerald-500 transition-colors">{p.business_name}</h3>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">/{p.slug}</p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => toggleActive(p.id, p.is_active)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-xl text-sm hover:bg-black hover:text-white transition-all">
                        {p.is_active ? '❄️' : '🔥'}
                       </button>
                       <button onClick={() => deleteProvider(p.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl text-sm hover:bg-red-500 hover:text-white transition-all">
                        🗑️
                       </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Abonelik Bitiş</p>
                    <p className={`text-sm font-bold ${p.expires_at && new Date(p.expires_at) < new Date() ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {p.expires_at ? new Date(p.expires_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Süre Belirlenmedi'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setTrial(p.id)} className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all">7 GÜN DENEME</button>
                    <button onClick={() => extendSubscription(p.id, 1, p.expires_at)} className="flex-1 border-2 border-zinc-100 dark:border-zinc-800 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-black transition-all">+1 AY EKLE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Details & Staff Management Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tightest mb-2">{selectedProvider.business_name}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-emerald-500 font-bold tracking-tight">{selectedProvider.email}</p>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                    <p className="text-zinc-400 font-medium">/{selectedProvider.slug}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProvider(null)} className="w-14 h-14 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-3xl font-light hover:bg-black hover:text-white transition-all">×</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Staff List */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-widest text-zinc-400">Çalışan Yönetimi</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {providerStaff.length === 0 && (
                      <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border-2 border-dashed border-zinc-200">
                        <p className="text-zinc-400 font-bold">Henry henüz çalışan eklenmemiş.</p>
                      </div>
                    )}
                    {providerStaff.map((staff) => (
                      <div key={staff.id} className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex justify-between items-center group">
                        <div>
                          <p className="font-black tracking-tight text-lg">{staff.name}</p>
                          <p className="text-xs font-bold text-zinc-500">{staff.phone_number}</p>
                        </div>
                        <button onClick={() => removeStaffFromProvider(staff.id)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-900 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Staff Feature */}
                <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 h-fit">
                  <h3 className="text-xl font-black uppercase tracking-widest text-emerald-600">Yeni Çalışan Ekle</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">Çalışan İsmi</label>
                      <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold" placeholder="Örn: Ahmet Yılmaz" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 mb-2">WP Numarası (90...)</label>
                      <input type="tel" value={newStaffPhone} onChange={(e) => setNewStaffPhone(e.target.value)} className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl outline-none border-2 border-transparent focus:border-emerald-500 transition-all font-bold" placeholder="905..." />
                    </div>
                    <button onClick={addStaffToProvider} className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all">EKLE</button>
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
