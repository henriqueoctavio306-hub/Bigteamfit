CREATE TABLE IF NOT EXISTS public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  category text NOT NULL DEFAULT 'Musculação',
  equipment text,
  instructions text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(name, muscle_group)
);
GRANT SELECT ON public.exercise_library TO authenticated;
GRANT ALL ON public.exercise_library TO service_role;
ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercise_library_authenticated_read" ON public.exercise_library;
CREATE POLICY "exercise_library_authenticated_read" ON public.exercise_library FOR SELECT TO authenticated USING (active = true);

INSERT INTO public.exercise_library (name, muscle_group, category, equipment) VALUES
('Agachamento livre','Quadríceps','Musculação','Barra'),
('Agachamento frontal','Quadríceps','Musculação','Barra'),
('Hack squat','Quadríceps','Musculação','Máquina'),
('Leg press 45°','Quadríceps','Musculação','Máquina'),
('Cadeira extensora','Quadríceps','Musculação','Máquina'),
('Agachamento búlgaro','Quadríceps','Musculação','Halteres'),
('Passada','Quadríceps','Musculação','Halteres'),
('Afundo no smith','Quadríceps','Musculação','Smith'),
('Stiff com barra','Posterior de coxa','Musculação','Barra'),
('Stiff com halteres','Posterior de coxa','Musculação','Halteres'),
('Mesa flexora','Posterior de coxa','Musculação','Máquina'),
('Flexora sentada','Posterior de coxa','Musculação','Máquina'),
('Flexora em pé','Posterior de coxa','Musculação','Máquina'),
('Levantamento terra romeno','Posterior de coxa','Musculação','Barra'),
('Hip thrust','Glúteos','Musculação','Barra'),
('Glúteo no cabo','Glúteos','Musculação','Cabo'),
('Abdução de quadril','Glúteos','Musculação','Máquina'),
('Coice no cabo','Glúteos','Musculação','Cabo'),
('Elevação pélvica unilateral','Glúteos','Musculação','Peso corporal'),
('Panturrilha em pé','Panturrilhas','Musculação','Máquina'),
('Panturrilha sentada','Panturrilhas','Musculação','Máquina'),
('Supino reto','Peito','Musculação','Barra'),
('Supino inclinado','Peito','Musculação','Halteres'),
('Supino inclinado na máquina','Peito','Musculação','Máquina'),
('Crucifixo inclinado','Peito','Musculação','Halteres'),
('Crossover','Peito','Musculação','Cabo'),
('Peck deck','Peito','Musculação','Máquina'),
('Flexão de braços','Peito','Calistenia','Peso corporal'),
('Puxada frontal','Costas','Musculação','Cabo'),
('Puxada neutra','Costas','Musculação','Cabo'),
('Barra fixa','Costas','Calistenia','Barra'),
('Remada curvada','Costas','Musculação','Barra'),
('Remada unilateral','Costas','Musculação','Halter'),
('Remada baixa','Costas','Musculação','Cabo'),
('Remada cavalinho','Costas','Musculação','Máquina'),
('Pullover no cabo','Costas','Musculação','Cabo'),
('Desenvolvimento militar','Ombros','Musculação','Barra'),
('Desenvolvimento com halteres','Ombros','Musculação','Halteres'),
('Elevação lateral','Ombros','Musculação','Halteres'),
('Elevação lateral no cabo','Ombros','Musculação','Cabo'),
('Crucifixo inverso','Ombros','Musculação','Máquina'),
('Face pull','Ombros','Musculação','Cabo'),
('Rosca direta','Bíceps','Musculação','Barra'),
('Rosca alternada','Bíceps','Musculação','Halteres'),
('Rosca martelo','Bíceps','Musculação','Halteres'),
('Rosca Scott','Bíceps','Musculação','Máquina'),
('Tríceps pulley','Tríceps','Musculação','Cabo'),
('Tríceps francês','Tríceps','Musculação','Halter'),
('Tríceps testa','Tríceps','Musculação','Barra'),
('Tríceps corda','Tríceps','Musculação','Cabo'),
('Abdominal na polia','Abdômen','Musculação','Cabo'),
('Elevação de pernas','Abdômen','Calistenia','Peso corporal'),
('Prancha','Abdômen','Calistenia','Peso corporal')
ON CONFLICT (name, muscle_group) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle ON public.exercise_library(muscle_group, name);
