CREATE TABLE IF NOT EXISTS public.diet_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  goal text,
  daily_calories integer,
  protein_g numeric(8,1),
  carbs_g numeric(8,1),
  fats_g numeric(8,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_templates TO authenticated;
ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_templates_personal" ON public.diet_templates;
CREATE POLICY "diet_templates_personal" ON public.diet_templates FOR ALL TO authenticated
USING (personal_id = auth.uid() OR public.has_role(auth.uid(),'personal'))
WITH CHECK (personal_id = auth.uid() OR public.has_role(auth.uid(),'personal'));

CREATE TABLE IF NOT EXISTS public.diet_template_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.diet_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  scheduled_time time,
  position integer NOT NULL DEFAULT 0,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_template_meals TO authenticated;
ALTER TABLE public.diet_template_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_template_meals_personal" ON public.diet_template_meals;
CREATE POLICY "diet_template_meals_personal" ON public.diet_template_meals FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.diet_templates t WHERE t.id = template_id AND (t.personal_id = auth.uid() OR public.has_role(auth.uid(),'personal'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.diet_templates t WHERE t.id = template_id AND (t.personal_id = auth.uid() OR public.has_role(auth.uid(),'personal'))));

CREATE TABLE IF NOT EXISTS public.diet_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_meal_id uuid NOT NULL REFERENCES public.diet_template_meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  quantity numeric(8,2) NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  calories integer,
  protein_g numeric(8,1),
  carbs_g numeric(8,1),
  fats_g numeric(8,1),
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_template_items TO authenticated;
ALTER TABLE public.diet_template_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diet_template_items_personal" ON public.diet_template_items;
CREATE POLICY "diet_template_items_personal" ON public.diet_template_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.diet_template_meals m JOIN public.diet_templates t ON t.id=m.template_id WHERE m.id=template_meal_id AND (t.personal_id=auth.uid() OR public.has_role(auth.uid(),'personal'))))
WITH CHECK (EXISTS (SELECT 1 FROM public.diet_template_meals m JOIN public.diet_templates t ON t.id=m.template_id WHERE m.id=template_meal_id AND (t.personal_id=auth.uid() OR public.has_role(auth.uid(),'personal'))));

ALTER TABLE public.food_substitutions ADD COLUMN IF NOT EXISTS food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS diet_templates_personal_name_idx ON public.diet_templates(personal_id, name);
CREATE INDEX IF NOT EXISTS diet_template_meals_template_position_idx ON public.diet_template_meals(template_id, position);
CREATE INDEX IF NOT EXISTS diet_template_items_meal_position_idx ON public.diet_template_items(template_meal_id, position);

-- Common global foods. Personal-created foods can still be added through the UI.
INSERT INTO public.foods (personal_id,name,calories_per_100g,protein_per_100g,carbs_per_100g,fats_per_100g,fiber_per_100g)
VALUES
(NULL,'Arroz branco cozido',128,2.5,28.1,0.2,1.6),
(NULL,'Feijão carioca cozido',76,4.8,13.6,0.5,8.5),
(NULL,'Peito de frango grelhado',159,32.0,0,2.5,0),
(NULL,'Patinho moído cozido',219,35.9,0,7.3,0),
(NULL,'Ovo inteiro',143,12.6,0.7,9.5,0),
(NULL,'Banana prata',98,1.3,26.0,0.1,2.0),
(NULL,'Aveia em flocos',394,13.9,66.6,8.5,9.1),
(NULL,'Batata inglesa cozida',52,1.2,11.9,0.1,1.3),
(NULL,'Batata doce cozida',77,0.6,18.4,0.1,2.2),
(NULL,'Iogurte natural',61,3.5,4.7,3.3,0),
(NULL,'Azeite de oliva',884,0,0,100,0)
ON CONFLICT DO NOTHING;
