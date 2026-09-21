DROP POLICY IF EXISTS "workouts_personal_manage" ON public.workouts;
CREATE POLICY "workouts_personal_manage_own" ON public.workouts FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

DROP POLICY IF EXISTS "workout_exercises_personal_manage" ON public.workout_exercises;
CREATE POLICY "workout_exercises_personal_manage_own" ON public.workout_exercises FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

DROP POLICY IF EXISTS "diets_personal_manage" ON public.diets;
CREATE POLICY "diets_personal_manage_own" ON public.diets FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

DROP POLICY IF EXISTS "meals_personal_manage" ON public.meals;
CREATE POLICY "meals_personal_manage_own" ON public.meals FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.diets d WHERE d.id = diet_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.diets d WHERE d.id = diet_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

DROP POLICY IF EXISTS "meal_items_personal_manage" ON public.meal_items;
CREATE POLICY "meal_items_personal_manage_own" ON public.meal_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.meals m JOIN public.diets d ON d.id = m.diet_id WHERE m.id = meal_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.meals m JOIN public.diets d ON d.id = m.diet_id WHERE m.id = meal_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

DROP POLICY IF EXISTS "food_substitutions_personal_manage" ON public.food_substitutions;
CREATE POLICY "food_substitutions_personal_manage_own" ON public.food_substitutions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.meal_items mi JOIN public.meals m ON m.id = mi.meal_id JOIN public.diets d ON d.id = m.diet_id WHERE mi.id = meal_item_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.meal_items mi JOIN public.meals m ON m.id = mi.meal_id JOIN public.diets d ON d.id = m.diet_id WHERE mi.id = meal_item_id AND d.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));
