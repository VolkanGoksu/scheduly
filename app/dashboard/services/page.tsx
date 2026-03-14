"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("services").select("*").eq("user_id", user.id);
    setServices(data || []);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("services").insert({
      user_id: user?.id,
      name,
      duration: parseInt(duration),
      price: parseFloat(price),
    });

    if (error) {
      alert(error.message);
    } else {
      setName("");
      setPrice("");
      fetchServices();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    fetchServices();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Services</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm font-medium hover:underline text-zinc-600">Back to Dashboard</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Service Form */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
            <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-zinc-800 outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Add Service
              </button>
            </form>
          </div>

          {/* Service List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Your Services</h2>
            {services.length === 0 && <p className="text-zinc-500">No services added yet.</p>}
            {services.map((service) => (
              <div key={service.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-zinc-500">{service.duration} mins • ${service.price}</p>
                </div>
                <button onClick={() => handleDelete(service.id)} className="text-red-500 text-sm font-medium hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
