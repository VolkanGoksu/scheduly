import { supabase } from "./supabase";

export async function getBookedSlots(user_id: string, date: string) {
  const { data: appointments } = await supabase
    .from("appointments")
    .select("time")
    .eq("user_id", user_id)
    .eq("date", date)
    .neq("status", "rejected");

  return appointments?.map((a: any) => a.time.substring(0, 5)) || [];
}