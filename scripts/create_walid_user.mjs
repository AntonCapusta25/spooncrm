const SUPABASE_URL = "https://qttdcibitumvwsrxqeld.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dGRjaWJpdHVtdndzcnhxZWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI5NDUzNSwiZXhwIjoyMDk2ODcwNTM1fQ.JpDFwAdN-kRzhRWSQcfVZVKJjnDfGb1fZ6M52iWP0OA";

async function createWalid() {
  const email = "walid_sabihi@outlook.com";
  const password = "walid_sabihi@outlook.com";
  const name = "Walid Sabihi";

  console.log(`1. Creating or fetching user in Supabase Auth: ${email}...`);
  // First check if user exists
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });

  const listData = await listRes.json();
  let user = listData.users?.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (user) {
    console.log(`User already exists with ID: ${user.id}. Updating password...`);
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        password: password,
        email_confirm: true,
        user_metadata: { name: name, display_name: name, role: 'salesperson' }
      })
    });
    user = await updateRes.json();
    console.log("Updated user in Auth:", user.id);
  } else {
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: name, display_name: name, role: 'salesperson' }
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Auth creation failed:", err);
      return;
    }
    user = await createRes.json();
    console.log("Created user in Auth:", user.id);
  }

  const userId = user.id;

  console.log("2. Upserting into public.crm_profiles...");
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      user_id: userId,
      name: name,
      email: email,
      role: 'salesperson'
    })
  });

  if (!profileRes.ok) {
    const err = await profileRes.text();
    console.error("Profile upsert failed:", err);
  } else {
    const profile = await profileRes.json();
    console.log("Successfully linked crm_profiles:", profile);
  }

  console.log("3. Testing signInWithPassword verification...");
  const testLogin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  if (testLogin.ok) {
    const loginData = await testLogin.json();
    console.log("Login verified! Access token issued for:", loginData.user.email);
  } else {
    const err = await testLogin.text();
    console.error("Test login failed:", err);
  }
}

createWalid().catch(console.error);
