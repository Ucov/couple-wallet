-- 1. Añadir columna a expenses (con valor por defecto temporal para los históricos)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS split_percentage INTEGER DEFAULT 50 CHECK (split_percentage >= 0 AND split_percentage <= 100);

-- 2. Asegurarnos de que los gastos antiguos se fijan permanentemente al 50%
UPDATE public.expenses
SET split_percentage = 50
WHERE split_percentage IS NULL;

-- Hacemos que a partir de ahora NO pueda ser nulo
ALTER TABLE public.expenses
ALTER COLUMN split_percentage SET NOT NULL;

-- 3. Crear función de trigger para automatizar el copiado del porcentaje desde el perfil del pagador
CREATE OR REPLACE FUNCTION public.set_expense_split_percentage()
RETURNS TRIGGER AS $$
DECLARE
    payer_percentage INTEGER;
BEGIN
    -- Si el cliente ya nos ha mandado un porcentaje, lo respetamos (útil para pruebas o casos raros)
    -- Si no nos manda nada (que será lo normal), buscamos el porcentaje del que paga.
    IF NEW.split_percentage IS NULL OR NEW.split_percentage = 50 THEN
        SELECT split_percentage INTO payer_percentage
        FROM public.profiles
        WHERE id = NEW.paid_by;

        IF payer_percentage IS NOT NULL THEN
            NEW.split_percentage := payer_percentage;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enganchar el trigger a la tabla de gastos
DROP TRIGGER IF EXISTS trg_set_expense_split ON public.expenses;

CREATE TRIGGER trg_set_expense_split
BEFORE INSERT ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.set_expense_split_percentage();
