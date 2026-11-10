const SUPABASE_URL = "https://qttdcibitumvwsrxqeld.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dGRjaWJpdHVtdndzcnhxZWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI5NDUzNSwiZXhwIjoyMDk2ODcwNTM1fQ.JpDFwAdN-kRzhRWSQcfVZVKJjnDfGb1fZ6M52iWP0OA";

async function resetCleanState() {
  console.log("1. Clearing crm_pos_proofs...");
  await fetch(`${SUPABASE_URL}/rest/v1/crm_pos_proofs?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });

  console.log("2. Clearing crm_itinerary...");
  await fetch(`${SUPABASE_URL}/rest/v1/crm_itinerary?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });

  console.log("3. Clearing crm_visits...");
  await fetch(`${SUPABASE_URL}/rest/v1/crm_visits?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });

  console.log("4. Clearing crm_lead_assignees...");
  await fetch(`${SUPABASE_URL}/rest/v1/crm_lead_assignees?lead_id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });

  console.log("5. Resetting all crm_leads to 'discovered', medium priority, no notes, no fake prospects...");
  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_leads?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      stage: 'discovered',
      status: 'active',
      priority: 'medium',
      notes: null,
      contact_person: null,
      hyperzod_merchant_id: null
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    console.error("Failed to reset crm_leads:", err);
  } else {
    const updated = await updateRes.json();
    console.log(`Successfully reset ${updated.length} leads to clean 'discovered' stage!`);
  }

  // Verify counts by stage
  console.log("6. Verifying stage counts...");
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_leads?select=stage`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const data = await checkRes.json();
  const stageCounts = {};
  for (const row of data) {
    stageCounts[row.stage] = (stageCounts[row.stage] || 0) + 1;
  }
  console.log("Stage distribution across DB:", stageCounts);
}

resetCleanState().catch(console.error);
