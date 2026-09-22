-- Create savings_goals table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(10, 2) NOT NULL,
    current_amount NUMERIC(10, 2) DEFAULT 0,
    emoji TEXT DEFAULT '💰',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create savings_contributions table
CREATE TABLE IF NOT EXISTS public.savings_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

-- Policies for savings_goals
CREATE POLICY "Huchas visibles por pareja" ON public.savings_goals
FOR SELECT USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Insertar huchas de la propia pareja" ON public.savings_goals
FOR INSERT WITH CHECK (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Actualizar huchas de la propia pareja" ON public.savings_goals
FOR UPDATE USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Borrar huchas de la propia pareja" ON public.savings_goals
FOR DELETE USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

-- Policies for savings_contributions
CREATE POLICY "Contribuciones visibles por pareja" ON public.savings_contributions
FOR SELECT USING (
    goal_id IN (
        SELECT id FROM public.savings_goals 
        WHERE couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Insertar contribuciones de la propia pareja" ON public.savings_contributions
FOR INSERT WITH CHECK (
    goal_id IN (
        SELECT id FROM public.savings_goals 
        WHERE couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    )
);
