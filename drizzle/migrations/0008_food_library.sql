CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  calories_per_100g numeric(8,2) NOT NULL DEFAULT 0 CHECK (calories_per_100g >= 0),
  protein_per_100g numeric(8,2) NOT NULL DEFAULT 0 CHECK (protein_per_100g >= 0),
  carbs_per_100g numeric(8,2) NOT NULL DEFAULT 0 CHECK (carbs_per_100g >= 0),
  fats_per_100g numeric(8,2) NOT NULL DEFAULT 0 CHECK (fats_per_100g >= 0),
  fiber_per_100g numeric(8,2) NOT NULL DEFAULT 0 CHECK (fiber_per_100g >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_read_own_or_global" ON public.foods FOR SELECT TO authenticated
USING (active = true AND (personal_id IS NULL OR personal_id = auth.uid()));
CREATE POLICY "foods_personal_manage" ON public.foods FOR ALL TO authenticated
USING (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'));
ALTER TABLE public.meal_items ADD COLUMN IF NOT EXISTS food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL;
CREATE INDEX foods_personal_name_idx ON public.foods(personal_id, name);
