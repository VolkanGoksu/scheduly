"use client";
export const dynamic = "force-dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Calendar from "@/components/Calendar";
import { getBookedSlots } from "@/lib/availability";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";

export default function BookingPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang as Language];
  const params = useParams();
  const slug = params?.slug;
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // 1️⃣ Load user & services & staff
  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      console.log("Fetching data for slug:", slug);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (userError) {
        console.error("User fetch error:", userError);
        alert("İşletme bilgisi alınamadı (RLS veya bağlantı hatası)");
        return;
      }

      if (!userData) {
        console.log("User not found for slug:", slug);
        setUser({ notFound: true });
        return;
      }

      console.log("User found:", userData.business_name, "ID:", userData.id);

      if (!userData.is_active || (userData.expires_at && new Date(userData.expires_at) < new Date())) {
        setUser({
          ...userData,
          is_frozen: true,
          reason: userData.is_active ? "Subscription Expired" : "Account Frozen"
        });
        return;
      }

      setUser(userData);

      // Fetch Services
      const { data: servicesData, error: sError } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", userData.id);
      
      if (sError) {
        console.error("Services fetch error:", sError);
        alert("Hizmetler yüklenirken hata oluştu (RLS kontrol edin)");
      }
      console.log("Services loaded:", servicesData?.length || 0);
      setServices(servicesData || []);

      // Fetch Staff
      const { data: staffData, error: stError } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", userData.id)
        .eq("is_active", true);
      
      if (stError) console.error("Staff fetch error:", stError);
      setStaff(staffData || []);
    }

    fetchData();
  }, [slug]);

  // 2️⃣ Load booked slots (to show them as busy) - FILTERED BY SELECTED STAFF
  useEffect(() => {
    if (!user || user.notFound || user.is_frozen) return;

    async function fetchBookedData() {
      const allBusyEvents: any[] = [];
      const now = new Date();
      
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        let query = supabase
          .from("appointments")
          .select("time, status")
          .eq("user_id", user.id)
          .eq("date", dateStr)
          .neq("status", "rejected");

        if (selectedStaff) {
          query = query.eq("staff_id", selectedStaff.id);
        }

        const { data: appointments, error: appError } = await query;

        if (appError) console.error("Appointments fetch error:", appError);

        if (appointments) {
          appointments.forEach(app => {
            allBusyEvents.push({
              start: `${dateStr}T${app.time}`,
              display: 'background',
              color: 'rgba(239, 68, 68, 0.1)',
              extendedProps: { isBooked: true }
            });
            allBusyEvents.push({
              title: lang === 'tr' ? 'REZERVE' : 'BOOKED',
              start: `${dateStr}T${app.time}`,
              className: 'premium-event',
              extendedProps: { isBooked: true }
            });
          });
        }
      }
      setEvents(allBusyEvents);
    }

    fetchBookedData();
  }, [user, selectedStaff, lang]);

  const handleSelectSlot = (start: string) => {
    // Check if slot is in the past
    if (new Date(start) < new Date()) {
      return;
    }
    // Check if slot is already booked
    const isBooked = events.some(e => e.start === start && e.extendedProps?.isBooked);
    if (isBooked) return;

    setSelectedSlot(start);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedService || !user || !selectedStaff) return;
    setBookingLoading(true);

    const [targetDate, targetTime] = selectedSlot.split('T');

    try {
      const { data: newApp, error: appError } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          service_id: selectedService.id,
          staff_id: selectedStaff.id,
          customer_name: customerName,
          customer_email: customerEmail,
          date: targetDate,
          time: targetTime,
          status: 'pending'
        })
        .select('id')
        .single();

      if (appError) throw appError;

      // 4️⃣ Generate WhatsApp Link for the selected staff
      const staffPhone = selectedStaff.phone_number || user.phone_number;
      let cleanPhone = staffPhone?.replace(/\D/g, '');
      if (cleanPhone?.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);
      else if (cleanPhone?.length === 10) cleanPhone = '90' + cleanPhone;

      const baseUrl = window.location.origin;
      const approvalUrl = `${baseUrl}/approve/${newApp.id}`;
      
      const message = lang === 'tr' 
        ? `Merhaba ${selectedStaff.name}, ${targetDate} tarihinde saat ${targetTime} için ${selectedService.name} randevusu oluşturuldu. Onaylamak veya reddetmek için tıklayın: ${approvalUrl}`
        : `Hello ${selectedStaff.name}, a new appointment for ${selectedService.name} has been booked on ${targetDate} at ${targetTime}. Click to approve or reject: ${approvalUrl}`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      setAppointmentId(newApp.id);
      setSuccess(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!user) return <div className="flex h-screen items-center justify-center font-medium">{t.loading}</div>;

  if (user.notFound) return <div className="flex h-screen items-center justify-center font-medium">Business not found.</div>;

  if (user.is_frozen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
            {user.reason === "Subscription Expired" ? "⏳" : "❄"}
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tightest uppercase">
            {user.reason === "Subscription Expired" ? t.accountExpired : t.accountFrozen}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
            {user.reason === "Subscription Expired"
              ? `${user.business_name} için abonelik süresi doldu. Lütfen yönetici ile iletişime geçin.`
              : `Bu sayfa yönetici tarafından geçici olarak durdurulmuştur.`}
          </p>
          <Link
            href="/"
            className="inline-block w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">✓</div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tightest uppercase">{t.booked}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
            {selectedService.name} için randevu talebiniz alındı. Bildirim gönderildi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-80 transition-all"
          >
            {t.bookAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-6 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2 px-2">
            {user.business_name}
          </h1>
          <div className="flex flex-row justify-between items-center gap-4 px-2">
            <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 font-medium">{lang === 'tr' ? 'Hizmet ve çalışan seçerek başlayın' : 'Select a service and professional'}</p>
            <button
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg font-bold text-[10px] md:text-xs uppercase"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </header>

        <div className="space-y-12">
          {/* 1. Professionals */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">{lang === 'tr' ? '1. Profesyonel Seçin' : '1. Select Professional'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); setSelectedSlot(null); }}
                  className={`relative p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col items-center justify-center gap-3 group ${
                    selectedStaff?.id === s.id
                      ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/10 shadow-xl shadow-emerald-500/10"
                      : "border-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-300"
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl ${
                    selectedStaff?.id === s.id ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Services */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">{lang === 'tr' ? '2. Hizmet Seçin' : '2. Select Service'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setSelectedSlot(null); }}
                  className={`w-full text-left p-8 rounded-[2rem] border-2 transition-all group ${selectedService?.id === service.id
                      ? "bg-black border-black dark:bg-white dark:border-white text-white dark:text-black"
                      : "bg-white border-zinc-100 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black text-lg uppercase tracking-tight">{service.name}</h3>
                    <span className="font-mono text-sm opacity-60">${service.price}</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">{service.duration} dk</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Calendar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">{lang === 'tr' ? '3. Zaman Seçin' : '3. Select Time'}</h2>
            {!selectedService || !selectedStaff ? (
              <div className="h-64 flex flex-col items-center justify-center border-4 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[3rem] p-8 text-center bg-white/50 dark:bg-zinc-900/50">
                <p className="text-zinc-500 font-bold max-w-xs uppercase text-xs tracking-widest">
                  {!selectedStaff ? (lang === 'tr' ? 'Profesyonel seçin' : 'Select professional') : (lang === 'tr' ? 'Hizmet seçin' : 'Select service')}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 p-4 md:p-8">
                <Calendar events={events} onSelect={handleSelectSlot} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-zinc-100 dark:border-zinc-800">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tightest mb-2">{lang === 'tr' ? 'Onayla' : 'Confirm'}</h2>
                  <p className="text-zinc-500 text-sm font-medium">{selectedService.name} @ {new Date(selectedSlot).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-2xl hover:bg-red-500 hover:text-white transition-all">×</button>
              </div>

              <form onSubmit={handleBooking} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{lang === 'tr' ? 'İsminiz' : 'Your Name'}</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-6 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{t.yourEmail}</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-6 py-5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-medium"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-3xl font-black text-xs uppercase tracking-[0.25em] hover:scale-105 transition-all disabled:opacity-50 shadow-2xl"
                  >
                    {bookingLoading ? '...' : (`${t.bookFor} ${selectedService.price}₺`)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}