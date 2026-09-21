DROP POLICY "students_owner_update" ON public.students;

DROP POLICY "food_substitutions_read" ON public.food_substitutions;
CREATE POLICY "food_substitutions_access"
ON public.food_substitutions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.meal_items mi
    JOIN public.meals m ON m.id = mi.meal_id
    JOIN public.diets d ON d.id = m.diet_id
    LEFT JOIN public.students s ON s.id = d.student_id
    WHERE mi.id = meal_item_id
      AND (d.personal_id = auth.uid() OR s.user_id = auth.uid())
  )
);