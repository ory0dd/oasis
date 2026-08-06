const fs = require('fs');

const url = 'https://mxxasrhqwzpbcuzglzif.supabase.co/rest/v1/oasis_state?id=eq.1';
const key = 'sb_publishable_ol0sZk1O3ClTMECU5yRgPw_YlbDN8Mm';

async function upload() {
  console.log("Leyendo archivo backup...");
  const dataStr = fs.readFileSync('oasis_data_backup_final.json', 'utf8');
  const dataJson = JSON.parse(dataStr);

  console.log("Subiendo datos a Supabase...");
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ data: dataJson })
  });

  if (!response.ok) {
    console.error("Error subiendo datos:", response.status, await response.text());
  } else {
    console.log("¡Datos subidos con éxito!");
  }
}

upload().catch(console.error);
