-- Performance & Database Improvements

-- 1. Create indexes for foreign keys and common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON public.expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_couple_date ON public.expenses(couple_id, date DESC);

-- 2. Add validation (CHECK constraint)
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);

-- 3. Optimization: Function to get couple_id faster in RLS
CREATE OR REPLACE FUNCTION public.get_user_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Recreate RLS Policies to use the new function

-- Drop old profile policies
DROP POLICY IF EXISTS "Perfiles compartidos por pareja" ON public.profiles;

-- Create new profile policies
CREATE POLICY "Perfiles compartidos por pareja" ON public.profiles
FOR SELECT USING (
    auth.uid() = id OR 
    couple_id = public.get_user_couple_id()
);

-- Drop old expenses policies
DROP POLICY IF EXISTS "Gastos visibles por pareja" ON public.expenses;
DROP POLICY IF EXISTS "Insertar gastos de la propia pareja" ON public.expenses;
DROP POLICY IF EXISTS "Actualizar gastos propios o de la pareja" ON public.expenses;
DROP POLICY IF EXISTS "Borrar gastos propios o de la pareja" ON public.expenses;

-- Create new expenses policies
CREATE POLICY "Gastos visibles por pareja" ON public.expenses
FOR SELECT USING (
    couple_id = public.get_user_couple_id()
);

CREATE POLICY "Insertar gastos de la propia pareja" ON public.expenses
FOR INSERT WITH CHECK (
    couple_id = public.get_user_couple_id()
);

CREATE POLICY "Actualizar gastos propios o de la pareja" ON public.expenses
FOR UPDATE USING (
    couple_id = public.get_user_couple_id()
);

CREATE POLICY "Borrar gastos propios o de la pareja" ON public.expenses
FOR DELETE USING (
    couple_id = public.get_user_couple_id()
);
