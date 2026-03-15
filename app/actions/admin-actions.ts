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
  const { email, password, businessName, phoneNumber, slug, staffMembers } = formData;

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
      console.error("Auth Admin Error:", authError);
      return { success: false, error: `Auth Hatası: ${authError.message}` };
    }

    const userId = authData.user.id;

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
      console.error("Profile Insert Error:", profileError);
      // Optional: Cleanup auth user if profile fail?
      return { success: false, error: `Profil Hatası: ${profileError.message}` };
    }

    // 3. Create staff members
    for (const s of staffMembers) {
      if (s.name.trim()) {
        await supabaseAdmin.from("staff").insert({
          user_id: userId,
          name: s.name,
          phone_number: s.phone
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected Action Error:", err);
    return { success: false, error: err.message };
  }
}
