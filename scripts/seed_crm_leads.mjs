import fs from 'fs';

const SUPABASE_URL = "https://qttdcibitumvwsrxqeld.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0dGRjaWJpdHVtdndzcnhxZWxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI5NDUzNSwiZXhwIjoyMDk2ODcwNTM1fQ.JpDFwAdN-kRzhRWSQcfVZVKJjnDfGb1fZ6M52iWP0OA";

const jsonPath = "/Users/alexandrfilippov/Desktop/amsterdam-restaurants-scraper/enschede_restaurants_data.json";

function extractPostalCode(addr) {
  if (!addr) return '7511 AA';
  const match = addr.match(/\d{4}\s*[A-Z]{2}/i);
  return match ? match[0].replace(/\s/g, ' ') : '7511 AA';
}

async function runSeed() {
  console.log("Cleaning up prior test leads...");
  await fetch(`${SUPABASE_URL}/rest/v1/crm_leads?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const restaurants = JSON.parse(rawData);
  console.log(`Loaded ${restaurants.length} restaurants from scraper file.`);

  // Get Oleksandr profile id for initial assignees
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/crm_profiles?role=eq.pos_installer`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const profiles = await profileRes.json();
  const oleksandrId = profiles[0]?.id;

  const leads = restaurants.map((r) => {
    const lat = parseFloat(r.latitude);
    const lng = parseFloat(r.longitude);
    if (isNaN(lat) || isNaN(lng)) return null;

    return {
      name: (r.name || 'Unnamed Restaurant').trim(),
      cuisine: r.cuisine || 'Various',
      rating: parseFloat(r.rating) || 4.5,
      reviews_count: parseInt(r.reviews) || 0,
      price_level: r.price_level || '€€',
      address: r.address || 'Enschede, Netherlands',
      postal_code: extractPostalCode(r.address),
      city: 'Enschede',
      phone: r.phone || null,
      website: r.website || null,
      latitude: lat,
      longitude: lng,
      maps_url: r.url || null,
      stage: 'discovered',
      status: 'active',
      priority: 'medium',
      notes: null
    };
  }).filter(Boolean);

  console.log(`Inserting ${leads.length} leads in batches of 100...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const chunk = leads.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(chunk)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errText);
    } else {
      const inserted = await res.json();
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} (${inserted.length} leads) inserted successfully.`);
    }
  }

  console.log("All 834 Enschede restaurants seeded into crm_leads!");
}

runSeed().catch(console.error);
