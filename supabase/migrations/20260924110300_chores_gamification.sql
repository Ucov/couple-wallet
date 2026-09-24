-- Add points and completed_by to chores
ALTER TABLE public.chores 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- If a chore is already completed, retroactively assign it to the assigned_to person or leave it null
UPDATE public.chores 
SET completed_by = assigned_to 
WHERE is_done = true AND completed_by IS NULL;
