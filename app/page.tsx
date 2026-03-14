import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-black tracking-tighter">SCHEDULY</div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">Giriş Yap</Link>
            <Link href="/login" className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">Hemen Başla</Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="px-6 max-w-7xl mx-auto text-center py-20">
          <h1 className="text-6xl md:text-8xl font-black tracking-tightest leading-none mb-8">
            RANDEVU<br />
            <span className="text-zinc-400">YENİDEN TANIMLANDI.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 max-w-2xl mx-auto mb-12 font-medium">
            Modern işletmeler için dünyanın en şık randevu sistemi. 
            Şık, hızlı ve dikkat çekici derecede basit.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-black dark:bg-white text-white dark:text-black px-12 py-5 rounded-full text-lg font-bold uppercase tracking-widest hover:scale-105 transition-transform">
              Ücretsiz Deneme Başlat
            </Link>
            <button className="border-2 border-zinc-200 dark:border-zinc-800 px-12 py-5 rounded-full text-lg font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              Demoyu Gör
            </button>
          </div>
        </section>

        {/* Feature Section */}
        <section className="px-6 max-w-7xl mx-auto py-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-zinc-100 dark:border-zinc-900">
          <div className="group">
            <div className="text-4xl mb-6">✦</div>
            <h3 className="text-2xl font-bold mb-4">Mükemmel Arayüz</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">Markanızın kalitesini yansıtan bir randevu deneyimi. Müşterileriniz farkı hissedecek.</p>
          </div>
          <div className="group">
            <div className="text-4xl mb-6">⚡</div>
            <h3 className="text-2xl font-bold mb-4">Işık Hızında</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">Next.js 15 üzerine kurulu, anında yüklenen sayfalar ve akıcı kullanıcı deneyimi.</p>
          </div>
          <div className="group">
            <div className="text-4xl mb-6">▣</div>
            <h3 className="text-2xl font-bold mb-4">Güçlü Altyapı</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">Gerçek zamanlı uygunluk, güvenli ödemeler ve kapsamlı analizler tek bir panelde.</p>
          </div>
        </section>

        {/* Social Proof / Logo Cloud */}
        <section className="bg-zinc-50 dark:bg-zinc-950 py-24 border-y border-zinc-100 dark:border-zinc-900">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-zinc-400 uppercase tracking-[0.3em] font-bold text-xs mb-12">10,000'den fazla içerik üreticisi tarafından güveniliyor</p>
            <div className="flex flex-wrap justify-center gap-16 grayscale opacity-50 dark:invert">
              {/* Add some placeholder icons or names here */}
              <div className="text-3xl font-black italic tracking-tighter">LOGOIPSUM</div>
              <div className="text-3xl font-black italic tracking-tighter">ACME CO.</div>
              <div className="text-3xl font-black italic tracking-tighter">STUDIO</div>
              <div className="text-3xl font-black italic tracking-tighter">FLOW</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-t border-zinc-100 dark:border-zinc-900">
        <div className="text-xl font-black">SCHEDULY</div>
        <div className="text-zinc-400 text-sm font-medium">© 2026 Scheduly. All rights reserved.</div>
        <div className="flex gap-8 text-sm font-bold uppercase tracking-widest">
          <a href="#" className="hover:opacity-70">Twitter</a>
          <a href="#" className="hover:opacity-70">GitHub</a>
          <a href="#" className="hover:opacity-70">Design</a>
        </div>
      </footer>
    </div>
  );
}
