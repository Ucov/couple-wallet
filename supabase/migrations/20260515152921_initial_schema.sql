-- 1. Tablas de estructura
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    join_code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    avatar_url TEXT,
    couple_id UUID REFERENCES public.couples(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(12,2) NOT NULL,
    concept TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    paid_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (RLS)

-- Categorías: Todo el mundo puede leerlas
CREATE POLICY "Categorías son públicas" ON public.categories FOR SELECT USING (true);

-- Perfiles: Puedes ver tu perfil y el de tu pareja (mismo couple_id)
CREATE POLICY "Perfiles compartidos por pareja" ON public.profiles
FOR SELECT USING (
    auth.uid() = id OR 
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Gastos: Solo visibles para miembros de la misma pareja
CREATE POLICY "Gastos visibles por pareja" ON public.expenses
FOR SELECT USING (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Insertar gastos de la propia pareja" ON public.expenses
FOR INSERT WITH CHECK (
    couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid()) AND
    paid_by = auth.uid()
);

-- 4. Trigger para crear el perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Datos iniciales (Categorías)
INSERT INTO public.categories (name, icon, color) VALUES
('Comida', 'Utensils', '#fbbf24'),
('Vivienda', 'Home', '#3b82f6'),
('Transporte', 'Car', '#ef4444'),
('Ocio', 'Music', '#a855f7'),
('Salud', 'HeartPulse', '#10b981'),
('Otros', 'MoreHorizontal', '#6b7280')
ON CONFLICT DO NOTHING;
