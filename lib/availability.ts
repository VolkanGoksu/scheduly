import { supabase } from "./supabase";

export async function getBookedSlots(user_id: string, date: string, staff_id?: string) {
  let query = supabase
    .from("appointments")
    .select("time")
    .eq("user_id", user_id)
    .eq("date", date)
    .neq("status", "rejected");

  if (staff_id) {
    query = query.eq("staff_id", staff_id);
  }

  const { data: appointments } = await query;
  return appointments?.map((a: any) => a.time.substring(0, 5)) || [];
}