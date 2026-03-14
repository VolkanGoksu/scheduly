"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        // Check if already onboarded (fetch profile)
        const { data, error } = await supabase.from("users").select("slug").eq("id", user.id).maybeSingle();
        if (data?.slug) {
          router.push("/dashboard");
        }
      }
    }
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      business_name: businessName,
      phone_number: phoneNumber,
      slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-zinc-900 dark:text-white">Scheduly'e Hoş Geldiniz</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8">İşletmeniz hakkında bilgi verin</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">İşletme Adı</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. My Awesome Salon"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">WhatsApp Numarası</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 905XXXXXXXXX"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:bg-zinc-800 dark:text-white"
              required
            />
            <p className="text-xs text-zinc-400 mt-1">Ülke kodu ile birlikte (Örn: Türkiye için 90)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sayfa Uzantısı (URL Slug)</label>
            <div className="flex items-center">
              <span className="text-zinc-400 mr-2 text-sm">scheduly.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-salon"
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
          >
            {loading ? "Tamamlanıyor..." : "Kurulumu Tamamla"}
          </button>
        </form>
      </div>
    </div>
  );
}
