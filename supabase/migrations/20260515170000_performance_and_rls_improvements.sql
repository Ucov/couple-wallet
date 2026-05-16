-- Performance & Database Improvements & Solo Expense Support

-- 1. Create indexes for foreign keys and common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON public.expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_date ON public.expenses(couple_id, date DESC);

-- 2. Add validation (CHECK constraint)
ALTER TABLE public.expenses 
DROP CONSTRAINT IF EXISTS expenses_amount_positive;

ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);

-- 3. Optimization: Function to get couple_id faster in RLS
CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Recreate RLS Policies to use the new function and allow solo expenses

-- Profile policies
DROP POLICY IF EXISTS "Perfiles compartidos por pareja" ON public.profiles;
CREATE POLICY "Perfiles compartidos por pareja" ON public.profiles
FOR SELECT USING (
    auth.uid() = id OR 
    (couple_id IS NOT NULL AND couple_id = public.get_user_couple_id())
);

-- Expenses policies (Support for couple_id IS NULL)
DROP POLICY IF EXISTS "Gastos visibles por pareja" ON public.expenses;
DROP POLICY IF EXISTS "Insertar gastos de la propia pareja" ON public.expenses;
DROP POLICY IF EXISTS "Actualizar gastos propios o de la pareja" ON public.expenses;
DROP POLICY IF EXISTS "Borrar gastos propios o de la pareja" ON public.expenses;
DROP POLICY IF EXISTS "Gastos visibles" ON public.expenses;
DROP POLICY IF EXISTS "Insertar gasto propio o de pareja" ON public.expenses;
DROP POLICY IF EXISTS "Actualizar gasto propio o de pareja" ON public.expenses;
DROP POLICY IF EXISTS "Borrar gasto propio o de pareja" ON public.expenses;

CREATE POLICY "Gastos visibles" ON public.expenses
FOR SELECT USING (
  (couple_id IS NOT NULL AND couple_id = public.get_user_couple_id())
  OR
  (couple_id IS NULL AND paid_by = auth.uid())
);

CREATE POLICY "Insertar gasto propio o de pareja" ON public.expenses
FOR INSERT WITH CHECK (
  paid_by = auth.uid()
  AND (
    couple_id IS NULL
    OR couple_id = public.get_user_couple_id()
  )
);

CREATE POLICY "Actualizar gasto propio o de pareja" ON public.expenses
FOR UPDATE USING (
  (couple_id IS NOT NULL AND couple_id = public.get_user_couple_id())
  OR
  (couple_id IS NULL AND paid_by = auth.uid())
) WITH CHECK (
  (couple_id IS NOT NULL AND couple_id = public.get_user_couple_id())
  OR
  (couple_id IS NULL AND paid_by = auth.uid())
);

CREATE POLICY "Borrar gasto propio o de pareja" ON public.expenses
FOR DELETE USING (
  (couple_id IS NOT NULL AND couple_id = public.get_user_couple_id())
  OR
  (couple_id IS NULL AND paid_by = auth.uid())
);
