"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Calendar from "@/components/Calendar";
import { useRouter } from "next/navigation";
import { translations, Language } from "@/lib/i18n";

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang as Language];
  const [appointments, setAppointments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: appts } = await supabase
        .from("appointments")
        .select(`
          *,
          services (name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      
      setAppointments(appts || []);
    }
    fetchData();
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    
    if (error) alert(error.message);
    else {
      setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tighter">SCHEDULY</h1>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-bold text-[10px] uppercase"
            >
              {lang.toUpperCase()}
            </button>
            <button onClick={() => router.push("/dashboard/services")} className="text-sm font-bold uppercase tracking-widest hover:opacity-70">{t.services}</button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="text-sm font-bold uppercase tracking-widest text-red-500 hover:opacity-70">{t.logout}</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold italic">{t.schedule}</h2>
                <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {t.requests}
                  </button>
                  <button 
                    onClick={() => setActiveTab('confirmed')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'confirmed' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {t.confirmed}
                  </button>
                </div>
              </div>
              <Calendar events={appointments.map(a => ({
                title: `${a.customer_name} - ${a.services?.name}`,
                start: `${a.date}T${a.time}`,
                backgroundColor: a.status === 'confirmed' ? '#10b981' : a.status === 'rejected' ? '#ef4444' : '#f59e0b',
                borderColor: 'transparent'
              }))} onSelect={() => {}} />
            </div>
          </div>

          {/* List View / Management */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 min-h-[400px]">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${activeTab === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                {activeTab === 'pending' ? t.requests : t.confirmed}
              </h2>
              
              <div className="space-y-4">
                {appointments.filter(a => a.status === activeTab).length === 0 && (
                  <div className="py-12 text-center">
                    <div className="text-4xl mb-4">☕</div>
                    <p className="text-zinc-500 text-sm font-medium">{activeTab === 'pending' ? t.noPending : (lang === 'tr' ? 'Henüz onaylı randevu yok.' : 'No confirmed appointments.')}</p>
                  </div>
                )}
                
                {appointments.filter(a => a.status === activeTab).map((apt) => (
                  <div key={apt.id} className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-lg tracking-tight">{apt.customer_name}</h3>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{apt.services?.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black bg-zinc-200 dark:bg-zinc-700 px-3 py-1 rounded-full uppercase tracking-widest inline-block">{apt.time.substring(0, 5)}</div>
                        <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">{new Date(apt.date).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>

                    {activeTab === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => updateStatus(apt.id, 'confirmed')}
                          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                        >
                          {t.confirm}
                        </button>
                        <button 
                          onClick={() => updateStatus(apt.id, 'rejected')}
                          className="px-4 border-2 border-zinc-200 dark:border-zinc-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all"
                        >
                          {t.reject}
                        </button>
                      </div>
                    )}

                    {activeTab === 'confirmed' && (
                      <div className="flex gap-2 pt-2">
                         <button 
                          onClick={() => updateStatus(apt.id, 'rejected')}
                          className="w-full border-2 border-zinc-200 dark:border-zinc-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-all opacity-50 hover:opacity-100"
                        >
                          {t.reject}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
