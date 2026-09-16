-- Add unique constraint to recurring_applications to prevent race conditions
ALTER TABLE public.recurring_applications
ADD CONSTRAINT recurring_applications_couple_id_month_year_key UNIQUE (couple_id, month, year);
