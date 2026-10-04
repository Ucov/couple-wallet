import fs from 'fs';

let content = fs.readFileSync('src/app/chores/actions.ts', 'utf8');

content = content.replace(
  /export async function addChore\(title: string, points: number = 10\) \{/,
  'export async function addChore(title: string, points: number = 10, is_recurring: boolean = false) {'
);
content = content.replace(
  /await pb\.collection\('chores'\)\.create\(\{ couple_id: coupleId, title, points \}\)/,
  'await pb.collection(\'chores\').create({ couple_id: coupleId, title, points, is_recurring })'
);

const newAction = 
export async function logRecurringChore(id: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No auth' }

    let original;
    try {
      original = await pb.collection('chores').getOne(id)
    } catch (e) { return { error: 'Chore not found' } }

    try {
      await pb.collection('chores').create({
        couple_id: original.couple_id,
        title: original.title,
        points: original.points,
        is_done: true,
        is_recurring: false,
        completed_at: new Date().toISOString(),
        completed_by: user.id
      })
    } catch (error: any) {
      return { error: error.message }
    }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}
;

content = content + newAction;
fs.writeFileSync('src/app/chores/actions.ts', content, 'utf8');
