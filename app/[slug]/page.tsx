"use client";
export const dynamic = "force-dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Calendar from "@/components/Calendar";
import { getAvailableSlots } from "@/lib/availability";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";

export default function BookingPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang as Language];
  const params = useParams();
  const slug = params?.slug;
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // 1️⃣ Load user & services
  useEffect(() => {
    if (!slug) return;

    async function fetchData() {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!userData) return;

      if (!userData.is_active || (userData.expires_at && new Date(userData.expires_at) < new Date())) {
        setUser({
          ...userData,
          is_frozen: true,
          reason: userData.is_active ? "Subscription Expired" : "Account Frozen"
        });
        return;
      }

      setUser(userData);

      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", userData.id);
      setServices(servicesData || []);

      const { data: staffData } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", userData.id)
        .eq("is_active", true);
      setStaff(staffData || []);
    }

    fetchData();
  }, [slug]);

  // 2️⃣ Load booked slots (to show them as busy) - FILTERED BY SELECTED STAFF
  useEffect(() => {
    if (!user) return;

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

        const { data: appointments } = await query;

        if (appointments) {
          appointments.forEach(app => {
            // Background subtle red
            allBusyEvents.push({
              start: `${dateStr}T${app.time}`,
              display: 'background',
              color: 'rgba(239, 68, 68, 0.1)',
              extendedProps: { isBooked: true }
            });
            // Foreground CLEAR BOLD RED TEXT
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
      const baseUrl = window.location.origin;
      const approvalUrl = `${baseUrl}/approve/${newApp.id}`;
      
      const message = lang === 'tr' 
        ? `Merhaba ${selectedStaff.name}, ${targetDate} tarihinde saat ${targetTime} için ${selectedService.name} randevusu oluşturuldu. Onaylamak veya reddetmek için tıklayın: ${approvalUrl}`
        : `Hello ${selectedStaff.name}, a new appointment for ${selectedService.name} has been booked on ${targetDate} at ${targetTime}. Click to approve or reject: ${approvalUrl}`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${staffPhone}&text=${encodeURIComponent(message)}`;
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
    const approveUrl = `${window.location.origin}/approve/${appointmentId}`;
    const waMessage = `Merhaba ${user.business_name}, ${new Date(selectedSlot!).toLocaleString('tr-TR')} tarihindeki ${selectedService.name} hizmeti için randevu oluşturdum. İsmim: ${customerName}.

✅ Randevuyu Onaylamak İçin Tıklayın: ${approveUrl}

Onayınızı bekliyorum.`;

    // Profesyonel Numara Temizleme: Sadece rakamlar kalsın
    let cleanPhone = user.phone_number?.replace(/\D/g, '');

    // Eğer 0 ile başlıyorsa (05xx...), 0'ı atıp 90 ekle
    if (cleanPhone?.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.substring(1);
    }
    // Eğer ülke kodu yoksa (5xx...) ve 10 haneliyse, 90 ekle
    else if (cleanPhone?.length === 10) {
      cleanPhone = '90' + cleanPhone;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMessage)}`;

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">✓</div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tightest uppercase">{t.booked}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
            {selectedService.name} için randevu talebiniz alındı.
          </p>

          <div className="space-y-4">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 hover:shadow-xl transition-all"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412.001 12.049c0 2.123.554 4.197 1.604 6.046L0 24l6.101-1.6c1.794.978 3.827 1.494 5.897 1.495h.005c6.635 0 12.045-5.413 12.048-12.05a11.782 11.782 0 00-3.522-8.524z" /></svg>
              {t.notifyWhatsApp}
            </a>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] hover:text-black dark:hover:text-white transition-colors pt-4"
            >
              {t.bookAnother}
            </button>
          </div>
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
            <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 font-medium">{lang === 'tr' ? 'Hizmet seçerek başlayın' : 'Select a service to get started'}</p>
            <button
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg font-bold text-[10px] md:text-xs uppercase"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Services Section */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-500 text-sm mb-6">{t.services}</h2>
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelectedService(service); setSelectedSlot(null); }}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all group ${selectedService?.id === service.id
                    ? "bg-black border-black dark:bg-white dark:border-white"
                    : "bg-white border-zinc-200 hover:border-black dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-600"
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-lg ${selectedService?.id === service.id ? "text-white dark:text-black" : "text-zinc-900 dark:text-zinc-100"}`}>
                    {service.name}
                  </h3>
                  <span className={`font-mono text-sm ${selectedService?.id === service.id ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500"}`}>
                    ${service.price}
                  </span>
                </div>
                <p className={`text-sm ${selectedService?.id === service.id ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-500"}`}>
                  {service.duration} dk
                </p>
              </button>
            ))}
          </div>

          {/* Staff Selection Section */}
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 px-2">{lang === 'tr' ? 'Profesyonel Seçin' : 'Select Professional'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 px-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(s)}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left flex flex-col items-center justify-center gap-2 group ${
                    selectedStaff?.id === s.id
                      ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10"
                      : "border-zinc-200 hover:border-zinc-400 bg-white dark:bg-zinc-900 dark:border-zinc-800"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    selectedStaff?.id === s.id ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  }`}>
                    {s.name[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-sm text-center">{s.name}</span>
                  {selectedStaff?.id === s.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2 md:px-0">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              {!selectedService || !selectedStaff ? (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[40px] p-8 text-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4 flex items-center justify-center text-2xl">
                    {!selectedService ? '✨' : '👤'}
                  </div>
                  <p className="text-zinc-500 font-bold max-w-xs">
                    {!selectedService 
                      ? (lang === 'tr' ? 'Önce randevu almak istediğiniz hizmeti seçmelisiniz' : 'Select a service first to continue')
                      : (lang === 'tr' ? 'Lütfen hizmet verecek profesionali seçin' : 'Please select a professional to continue')}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-[40px] shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-2 md:p-6 overflow-hidden">
                  <Calendar 
                    events={events} 
                    onSelect={handleSelectSlot} 
                  />
                </div>
              )}
            </div>
             </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 p-6 md:p-10 rounded-[3rem] shadow-2xl border border-zinc-100 dark:border-zinc-900 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tightest">{t.selectTime}</h2>
                    <p className="text-sm font-medium text-zinc-400 mt-1">{t.allTimesLocal}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-2xl">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.confirm}</span>
                  </div>
                </div>
                <div className="calendar-container overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-900">
                  <Calendar events={events} onSelect={handleSelectSlot} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{lang === 'tr' ? 'Randevuyu Onayla' : 'Confirm Booking'}</h2>
                  <p className="text-zinc-500">{selectedService.name} @ {new Date(selectedSlot).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="text-zinc-400 hover:text-black dark:hover:text-white text-2xl">×</button>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">{lang === 'tr' ? 'Adınız Soyadınız' : 'Your Name'}</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    placeholder={lang === 'tr' ? 'Tam adınızı girin' : 'Enter your full name'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-zinc-500 mb-2">{t.yourEmail}</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 shadow-xl"
                  >
                    {bookingLoading ? (t.loading) : (`${t.bookFor} ${selectedService.price}₺`)}
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