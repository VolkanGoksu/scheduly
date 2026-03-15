"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "@/lib/i18n";

export default function QuickApprovePage() {
  const params = useParams();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<any>(null);
  const [actionStatus, setActionStatus] = useState<"pending" | "confirmed" | "rejected" | "error">("pending");
  const [lang, setLang] = useState<Language>("tr");
  const t = translations[lang];

  useEffect(() => {
    if (!id) return;

    async function fetchAppointment() {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name)")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setActionStatus("error");
      } else {
        setAppointment(data);
        if (data.status !== "pending") {
          setActionStatus(data.status as any);
        }
      }
      setLoading(false);
    }

    fetchAppointment();
  }, [id]);

  const handleAction = async (status: "confirmed" | "rejected") => {
    setLoading(true);
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      setActionStatus("error");
    } else {
      setActionStatus(status);
    }
    setLoading(false);
  };

  if (loading && !appointment) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl text-center">
          <div className="w-16 h-16 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-xl font-black uppercase tracking-widest">{t.loading}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[3rem] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800">
        
        {actionStatus === "pending" && appointment && (
          <div className="animate-in fade-in zoom-in duration-300">
            <h1 className="text-2xl font-black uppercase tracking-tightest mb-2">{t.approveTitle}</h1>
            <p className="text-zinc-500 mb-8 font-medium">{t.approveSubtitle}</p>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-6 text-left space-y-4 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{t.customer}</label>
                <div className="font-bold text-lg">{appointment.customer_name}</div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{t.service}</label>
                <div className="font-bold text-lg">{appointment.services?.name}</div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{t.dateTime}</label>
                <div className="font-bold text-lg">
                  {new Date(`${appointment.date}T${appointment.time}`).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction("confirmed")}
                disabled={loading}
                className="bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition-all shadow-lg"
              >
                {t.confirm}
              </button>
              <button
                onClick={() => handleAction("rejected")}
                disabled={loading}
                className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                {t.reject}
              </button>
            </div>
          </div>
        )}

        {actionStatus === "confirmed" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
            <h1 className="text-3xl font-black uppercase tracking-tightest">{t.appointmentApproved}</h1>
            <p className="text-zinc-500 font-medium">Takviminiz güncellendi.</p>
            <button onClick={() => window.close()} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest">{t.close}</button>
          </div>
        )}

        {actionStatus === "rejected" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl">✕</div>
            <h1 className="text-3xl font-black uppercase tracking-tightest text-red-500">{t.appointmentRejected}</h1>
            <p className="text-zinc-500 font-medium">Randevu reddedildi ve zaman dilimi tekrar boşa çıktı.</p>
            <button onClick={() => window.close()} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest">{t.close}</button>
          </div>
        )}

        {actionStatus === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-4xl">✕</div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-red-500">HATA OLUŞTU!</h1>
            <p className="text-zinc-500 font-medium">Bağlantı geçersiz olabilir veya bir sistem hatası yaşandı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
