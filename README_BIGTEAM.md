# BIGTEAM — versão de continuidade

Esta cópia foi separada do protótipo do Lovable para continuar o desenvolvimento sem depender dos créditos do builder.

## O que já foi preservado
- TanStack Start + React + TypeScript
- Supabase Auth
- banco e RLS existentes
- módulo real de alunos
- identidade visual BIGTEAM (preto/vermelho, caixa alta)

## O que foi implementado nesta versão
### Treinos
- seleção de aluno
- múltiplos treinos por aluno
- criação e exclusão de treino
- duplicação de treino com exercícios
- criação/edição/exclusão de exercícios
- séries, repetições, carga alvo, RPE, descanso e métodos avançados
- persistência no Supabase

### Dietas
- seleção de aluno
- múltiplas dietas por aluno
- múltiplas refeições por dieta
- alimentos em gramas
- cálculo automático de kcal, proteína, carboidrato e gordura a partir dos valores por 100g
- biblioteca de alimentos pessoal
- persistência no Supabase

### Segurança
- migration 0009 restringe edição de treinos/dietas aos respectivos personal_id
- migration 0008 adiciona biblioteca de alimentos

## Migrations novas
Aplicar na ordem:
- drizzle/migrations/0008_food_library.sql
- drizzle/migrations/0009_harden_content_ownership.sql

## Variáveis de ambiente
Copie `.env.example` para `.env` e use as credenciais do seu projeto Supabase.

## Próximas etapas planejadas
1. Templates de treino e dieta
2. Periodização por semanas/blocos
3. Perfil do aluno conectado a treino/dieta/check-ins
4. Área do aluno autenticada e vinculada ao cadastro
5. Check-in real com fotos e feedback
6. Evolução e avaliações
7. Pagamentos e vencimentos
8. Mensagens em tempo real
9. Notificações
10. Testes e publicação

## BIGTEAM v2 — módulo de treinos
- Biblioteca persistente de exercícios (`exercise_library`) com seed inicial.
- Busca e filtro por grupo muscular.
- Inserção de exercícios da biblioteca no treino.
- Edição de nome, descrição e dia do treino.
- Reordenação de exercícios.
- Duplicação e exclusão de treinos preservadas.
- Configuração por exercício: séries, repetições, carga, RPE, descanso, método avançado e instruções.

### Migração nova
`drizzle/migrations/0010_exercise_library.sql`

A migração precisa ser aplicada ao banco Supabase antes de usar a biblioteca de exercícios.

## V3 — Programas, periodização e modelos de treino

A V3 adiciona:
- Programas de treino por aluno;
- Mesociclos com 1–52 semanas;
- Foco e faixa de RPE por semana;
- Treinos vinculáveis a programa/semana;
- Biblioteca de modelos de treino por personal;
- Salvamento de um treino como modelo;
- Aplicação de modelo ao aluno como cópia independente.

Migration: `drizzle/migrations/0011_workout_programs_templates.sql`

> Antes de usar esses recursos em produção, aplique a migration no banco Supabase.

## BIGTEAM V12 — Student experience hardening
- Student home now calculates plan expiry status from the real student record.
- Student workout supports multiple active workouts assigned to the student and lets the student switch between them.
- Student workout now shows exercise instructions and persists performed sets through `workout_logs`.
- Student diet shows meal-level kcal and macro totals and real food quantities.
- Student evolution surfaces the latest body measurements when available.
- Student chat is scoped to the student's linked personal, marks incoming messages as read, and subscribes to realtime updates.
