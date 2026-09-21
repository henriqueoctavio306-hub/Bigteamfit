-- BIGTEAM V5: student-facing experience uses the existing secure tables.
-- Add indexes used by the student app and enforce one active prescription per student per module.
CREATE INDEX IF NOT EXISTS idx_diets_student_status_created ON public.diets(student_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_diet_position ON public.meals(diet_id, position);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_position ON public.meal_items(meal_id, position);
CREATE INDEX IF NOT EXISTS idx_workouts_student_status_created ON public.workouts(student_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_position ON public.workout_exercises(workout_id, position);
CREATE INDEX IF NOT EXISTS idx_checkins_student_submitted ON public.check_ins(student_id, submitted_at DESC);
