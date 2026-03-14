"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { translations, Language } from "@/lib/i18n";

export default function QuickApprovePage() {
  const params = useParams();
  const id = params?.id;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [lang, setLang] = useState<Language>("tr");
  const t = translations[lang];

  useEffect(() => {
    if (!id) return;

    async function approveAppointment() {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", id);

      if (error) {
        console.error(error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    }

    approveAppointment();
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800">
        {status === "loading" && (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h1 className="text-2xl font-black uppercase tracking-widest">{t.loading}</h1>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">RANDEVU ONAYLANDI!</h1>
            <p className="text-zinc-500 font-medium">Takviminiz güncellendi ve müşteriye onay bilgisi gitti (varsayalım).</p>
            <button 
              onClick={() => window.close()} 
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              KAPAT
            </button>
          </div>
        )}

        {status === "error" && (
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
