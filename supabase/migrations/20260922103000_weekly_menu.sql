-- Create weekly_menu table
CREATE TABLE IF NOT EXISTS public.weekly_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    lunch TEXT,
    dinner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(couple_id, date)
);

-- Enable RLS
ALTER TABLE public.weekly_menu ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Menús visibles por pareja" ON public.weekly_menu
FOR SELECT USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Insertar menús de la propia pareja" ON public.weekly_menu
FOR INSERT WITH CHECK (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Actualizar menús de la propia pareja" ON public.weekly_menu
FOR UPDATE USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Borrar menús de la propia pareja" ON public.weekly_menu
FOR DELETE USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);
