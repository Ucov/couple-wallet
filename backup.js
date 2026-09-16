const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
env.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backup() {
  console.log('Iniciando backup de la base de datos...');
  const tables = ['couples', 'profiles', 'expenses', 'chores', 'shopping_items', 'categories', 'settlements'];
  const backupData = {};

  for (const table of tables) {
    console.log(`Exportando ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error exportando ${table}:`, error);
      continue;
    }
    backupData[table] = data;
    console.log(`  -> ${data.length} registros exportados.`);
  }

  fs.writeFileSync('supabase_backup.json', JSON.stringify(backupData, null, 2));
  console.log('Backup completado exitosamente y guardado en supabase_backup.json');
}

backup();
