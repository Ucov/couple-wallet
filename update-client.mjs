import fs from 'fs';

let content = fs.readFileSync('src/app/chores/ChoresClient.tsx', 'utf8');

// Imports
content = content.replace('addChore, toggleChoreStatus, deleteChore', 'addChore, toggleChoreStatus, deleteChore, logRecurringChore');
content = content.replace('import { PlusCircle, Trash2, X, Star, Trophy } from \'lucide-react\'', 'import { PlusCircle, Trash2, X, Star, Trophy, Repeat, Briefcase } from \'lucide-react\'');

// Interface
content = content.replace('completed_at: string | null', 'completed_at: string | null\n  is_recurring?: boolean');

// State
content = content.replace('const [selectedPoints, setSelectedPoints] = useState<number>(1)', 'const [selectedPoints, setSelectedPoints] = useState<number>(1)\n  const [isRecurring, setIsRecurring] = useState<boolean>(false)');

// handleAdd
content = content.replace(
  'const tempPoints = selectedPoints',
  'const tempPoints = selectedPoints\n    const tempRecurring = isRecurring'
);
content = content.replace(
  'completed_by: null, completed_at: null }, ...prev])',
  'completed_by: null, completed_at: null, is_recurring: tempRecurring }, ...prev])'
);
content = content.replace(
  'setSelectedPoints(1)',
  'setSelectedPoints(1)\n    setIsRecurring(false)'
);
content = content.replace(
  'await addChore(tempTitle, tempPoints)',
  'await addChore(tempTitle, tempPoints, tempRecurring)'
);

// handleToggle
const newHandleToggle = 
  const handleToggle = (id: string, currentStatus: boolean, chorePoints: number = 0, isRecurringChore: boolean = false) => {
    if (isRecurringChore && !currentStatus) {
      // It's a recurring chore being completed
      const chore = chores.find(c => c.id === id)
      if (!chore) return
      
      const tempId = crypto.randomUUID()
      setChores(prev => [
        { ...chore, id: tempId, is_done: true, is_recurring: false, completed_by: currentUserId, completed_at: new Date().toISOString() },
        ...prev
      ])
      
      confetti({
        particleCount: chorePoints,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#f59e0b', '#fbbf24']
      })

      startTransition(async () => {
        const res = await logRecurringChore(id)
        if (res?.error) alert('Error: ' + res.error)
        else {
          broadcastSync()
          router.refresh()
        }
      })
      return;
    }

    // Normal toggle
    setChores(prev => prev.map(c => c.id === id ? { 
      ...c, 
      is_done: !currentStatus,
      completed_by: !currentStatus ? currentUserId : null,
      completed_at: !currentStatus ? new Date().toISOString() : null
    } : c))
    
    if (!currentStatus) {
      confetti({
        particleCount: chorePoints,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#f59e0b', '#fbbf24']
      })
    }

    startTransition(async () => { 
      const res = await toggleChoreStatus(id, !currentStatus)
      if (res?.error) alert('Error: ' + res.error)
      else {
        broadcastSync()
        router.refresh()
      }
    })
  }
;
content = content.replace(/const handleToggle = \([\s\S]*?\}\n  \}/, newHandleToggle.trim());

// Form UI
const formUI = 
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={\lex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 \\}
            >
              <Briefcase size={14} /> Puntual
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={\lex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 \\}
            >
              <Repeat size={14} /> Fija
            </button>
          </div>
          <div className="flex gap-2">
;
content = content.replace('<div className="flex gap-2">', formUI.trim());

// Pending list render
content = content.replace(
  /onClick=\{\(\) => handleToggle\(chore\.id, chore\.is_done, chore\.points\)\}/g,
  'onClick={() => handleToggle(chore.id, chore.is_done, chore.points, chore.is_recurring)}'
);

// Add recurring icon to pending chores
content = content.replace(
  '{chore.points || 1} <Star size={8} className="fill-emerald-200" />\\n                  </div>',
  '{chore.points || 1} <Star size={8} className="fill-emerald-200" />\n                  </div>\n                  {chore.is_recurring && <div className="absolute top-1.5 right-1.5 bg-indigo-950/80 text-indigo-300 p-1 rounded-full"><Repeat size={10} /></div>}'
);

// Completed list render name
content = content.replace(
  '+{chore.points || 1}\\n                    </div>',
  '+{chore.points || 1} • {isMine ? \'Yo\' : partnerName.substring(0, 3)}\n                    </div>'
);

fs.writeFileSync('src/app/chores/ChoresClient.tsx', content, 'utf8');
