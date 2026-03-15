"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with Service Role (Bypasses RLS and provides Admin API)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function createProviderAction(formData: any) {
  console.log("--- Server Action: createProviderAction Start ---");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL: Supabase environment variables are MISSING!");
    return {
      success: false,
      error: "Sunucu yapılandırması eksik (SUPABASE_SERVICE_ROLE_KEY bulunamadı)."
    };
  }

  const { email, password, businessName, phoneNumber, slug, staffMembers } = formData;
  console.log("Creating provider for email:", email);

  try {
    // 1. Create user in auth.users (Admin API)
    // This doesn't log the admin out and doesn't require email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: { business_name: businessName }
    });

    if (authError) {
      console.error("Supabase Auth Admin Error:", authError);
      return { success: false, error: `Supabase Auth Hatası: ${authError.message}` };
    }

    if (!authData?.user) {
      console.error("Auth creation succeeded but no user returned.");
      return { success: false, error: "Auth kaydı yapıldı ama kullanıcı verisi dönmedi." };
    }

    const userId = authData.user.id;
    console.log("Auth user created. ID:", userId);

    // 2. Create profile in public.users
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email.trim(),
      business_name: businessName,
      phone_number: phoneNumber,
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      role: 'provider',
      is_active: true,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    });

    if (profileError) {
      console.error("Supabase Profile Insert Error:", profileError);
      // Cleanup auth user on profile failure to allow retry
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: `Profil Kayıt Hatası: ${profileError.message}` };
    }

    console.log("Profile created successfully.");

    // 3. Create staff members
    if (staffMembers && Array.isArray(staffMembers)) {
      for (const s of staffMembers) {
        if (s.name?.trim()) {
          const { error: staffError } = await supabaseAdmin.from("staff").insert({
            user_id: userId,
            name: s.name,
            phone_number: s.phone
          });
          if (staffError) console.error("Staff Insert Error:", staffError);
        }
      }
    }

    console.log("--- Server Action: createProviderAction Success ---");
    return { success: true };
  } catch (err: any) {
    console.error("FATAL: Unexpected Server Action Error:", err);
    return { success: false, error: `Beklenmedik Sunucu Hatası: ${err.message}` };
  }
}
