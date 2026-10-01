const fs = require('fs');

function migratePage() {
  let content = fs.readFileSync('src/app/page.tsx', 'utf8');

  const startStr = "export default async function Dashboard({";
  const endStr = "const savingsGoals = savingsRes?.data || []";
  
  const startIdx = content.indexOf(startStr);
  const endIdx = content.indexOf(endStr) + endStr.length;

  const replacement = `
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const { getServerPB } = await import('@/lib/pocketbase-server');
  const pb = await getServerPB();

  const { month, year } = await searchParams

  const user = pb.authStore.model;
  if (!user) {
    redirect('/login')
  }

  let userProfile;
  try {
    userProfile = await pb.collection('users').getFirstListItem(\`id="\${user.id}"\`);
  } catch(e) {}

  if (!userProfile?.couple_id) {
    redirect('/setup-couple')
  }

  const myName = userProfile?.name || user.email?.split('@')[0] || 'Usuario'
  let partnerName = 'Pareja'

  const now = new Date()
  const currentMonth = month ? parseInt(month) : now.getMonth()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1)
  const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  let partnerData;
  if (userProfile?.couple_id) {
    try {
      partnerData = await pb.collection('users').getFirstListItem(\`couple_id="\${userProfile.couple_id}" && id!="\${user.id}"\`);
    } catch(e) {}
  }

  if (userProfile?.couple_id) {
    applyRecurringExpenses(userProfile.couple_id, now.getMonth(), now.getFullYear(), false).catch(e => console.error(e));
  }

  let allExpenses: any = [];
  try {
    allExpenses = await pb.collection('expenses').getFullList({
      filter: userProfile?.couple_id ? \`couple_id="\${userProfile.couple_id}"\` : \`paid_by="\${user.id}"\`,
      sort: '-date,-created',
      expand: 'category_id'
    });
    allExpenses = allExpenses.map((exp: any) => ({
      ...exp,
      categories: exp.expand?.category_id || null
    }));
  } catch(e) {}

  let prevExpenses: any = [];
  try {
    const pFilter = (userProfile?.couple_id ? \`couple_id="\${userProfile.couple_id}"\` : \`paid_by="\${user.id}"\`) + \` && date>="\${prevMonthStart.toISOString()}" && date<="\${prevMonthEnd.toISOString()}" && is_transfer=false\`;
    prevExpenses = await pb.collection('expenses').getFullList({
      filter: pFilter
    });
  } catch(e) {}

  const savingsRes = await getSavingsGoals();
  const savingsGoals = savingsRes?.data || [];
`;

  const before = content.substring(0, startIdx).replace("import { createClient } from '@/utils/supabase/server'", "");
  const after = content.substring(endIdx);
  fs.writeFileSync('src/app/page.tsx', before + replacement + after, 'utf8');
}

function migrateRecurring() {
  let content = fs.readFileSync('src/app/recurring/page.tsx', 'utf8');
  
  const replacement = `import { getServerPB } from '@/lib/pocketbase-server'

export default async function RecurringExpensesPage() {
  const pb = await getServerPB();
  const user = pb.authStore.model;
  if (!user) { redirect('/login'); }
  
  let userProfile; 
  try { userProfile = await pb.collection('users').getFirstListItem(\`id="\${user.id}"\`); } catch(e) {}
  
  if (!userProfile?.couple_id) {
    return (
      <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen justify-center items-center text-center">
        <h1 className="text-xl font-bold mb-4">Suscripciones</h1>
        <p className="text-zinc-400 mb-6">Necesitas configurar una pareja para añadir suscripciones.</p>
        <Link href="/" className="bg-emerald-600 px-6 py-3 rounded-xl font-semibold">Volver al inicio</Link>
      </main>
    )
  }
  
  let categories: any = [];
  try { categories = await pb.collection('categories').getFullList({ sort: 'name' }); } catch(e) {}
  
  let expenses: any = [];
  try {
    expenses = await pb.collection('recurring_expenses').getFullList({
      filter: \`couple_id="\${userProfile.couple_id}"\`,
      expand: 'category_id',
      sort: 'day_of_month'
    });
    expenses = expenses.map((exp: any) => ({ ...exp, categories: exp.expand?.category_id || null }));
  } catch(e) {}

  `;

  const startIdx = content.indexOf('export default async function RecurringExpensesPage() {');
  let endIdx = content.indexOf('// Cálculos del Dashboard');
  if (endIdx === -1) endIdx = content.indexOf('// C'); // fallback
  
  const before = content.substring(0, startIdx).replace("import { createClient } from '@/utils/supabase/server'", "");
  const after = content.substring(endIdx);
  fs.writeFileSync('src/app/recurring/page.tsx', before + replacement + after, 'utf8');
}

migratePage();
migrateRecurring();
console.log('Done');
