# BIGTEAM V22

## Packaging correction
The application is now packaged with its real `package.json`, `src`, `public`,
`supabase`, and configuration files at the repository root. This removes the
previous nested `BIGTEAM-v14/` deployment layout.

## Before deployment
- Run `npm install`
- Run `npm run build`
- Apply Supabase migrations
- Configure production environment variables
- Configure the public webhook route
- Test authentication, Personal/Aluno isolation, and payments

No production secrets are included.
