# BIGTEAM V13

## O que mudou
- A aplicação deixou de exibir o modo demo na rota principal.
- A rota `/` agora exige sessão autenticada.
- O perfil é carregado a partir de `profiles` + `user_roles`.
- PERSONAL vê apenas o painel de Personal.
- ALUNO vê apenas a área do aluno.
- Botão de sair encerra a sessão do Supabase.
- O primeiro usuário continua sendo promovido a PERSONAL pela função `ensure_my_profile`; contas seguintes entram como ALUNO, conforme as migrations existentes.
- Corrigido o JSX do componente de execução de treino que impedia a checagem TypeScript de avançar.

## Importante
As migrations do diretório `drizzle/migrations` precisam estar aplicadas no banco Supabase usado pelo projeto.

## Validação
Não foi possível executar `npm install` até o fim neste ambiente; portanto o build final não foi declarado como validado.
