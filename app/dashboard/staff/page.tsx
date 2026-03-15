"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { translations, Language } from "@/lib/i18n";

export default function StaffManagementPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang as Language];
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchStaff() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", user.id);
      setStaff(data || []);
    }
    fetchStaff();
  }, [router]);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from("staff")
      .insert({
        user_id: user.id,
        name,
        phone_number: phone
      })
      .select()
      .single();

    if (error) alert(error.message);
    else {
      setStaff([...staff, data]);
      setName("");
      setPhone("");
    }
    setLoading(false);
  };

  const deleteStaff = async (id: string) => {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) alert(error.message);
    else setStaff(staff.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="text-xl font-bold tracking-tighter hover:opacity-70 transition-all">← SCHEDULY</button>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-sm font-bold uppercase tracking-widest">{lang === 'tr' ? 'Çalışanlar' : 'Staff'}</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-[10px] uppercase"
          >
            {lang.toUpperCase()}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Add Form */}
          <div className="md:col-span-1">
            <h2 className="text-3xl font-black uppercase tracking-tightest mb-8">{lang === 'tr' ? 'Çalışan Ekle' : 'Add Staff'}</h2>
            <form onSubmit={addStaff} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">{lang === 'tr' ? 'İsim' : 'Name'}</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-black dark:focus:border-white transition-all outline-none font-medium"
                  placeholder="e.g. Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-5 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-black dark:focus:border-white transition-all outline-none font-medium"
                  placeholder="+905..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? '...' : (lang === 'tr' ? 'Ekle' : 'Add')}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-black uppercase tracking-tightest mb-8">{lang === 'tr' ? 'Mevcut Çalışanlar' : 'Current Staff'}</h2>
            <div className="grid grid-cols-1 gap-4">
              {staff.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-[3rem] border-4 border-dashed border-zinc-100 dark:border-zinc-800">
                  <p className="text-zinc-500 font-bold">{lang === 'tr' ? 'Henüz çalışan eklenmemiş.' : 'No staff members added yet.'}</p>
                </div>
              )}
              {staff.map((s) => (
                <div key={s.id} className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center group hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold text-zinc-400">
                      {s.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black tracking-tight">{s.name}</h3>
                      <p className="text-xs font-bold text-zinc-500">{s.phone_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    className="p-3 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
