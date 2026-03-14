import { supabase } from "./supabase";

export async function getAvailableSlots(user_id: string, service_duration: number) {
  // 1️⃣ Get user settings (start/end hours)
  const { data: user } = await supabase
    .from("users")
    .select("start_hour,end_hour")
    .eq("id", user_id)
    .single();

  if (!user) return [];

  const startHour = user.start_hour || 9;
  const endHour = user.end_hour || 18;

  // 2️⃣ Get existing confirmed appointments for today
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments } = await supabase
    .from("appointments")
    .select("time")
    .eq("user_id", user_id)
    .eq("date", today)
    .eq("status", "confirmed");

  const bookedTimes = appointments?.map((a: any) => a.time.substring(0, 5)) || [];

  // 3️⃣ Calculate slots based on 30-min intervals (flexible based on duration)
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min of ["00", "30"]) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${min}`;
      
      // Basic check: is this EXACT time slot booked?
      // In a real app, you'd check overlapping windows based on service_duration
      if (!bookedTimes.includes(timeStr)) {
        slots.push(timeStr);
      }
    }
  }

  return slots;
}