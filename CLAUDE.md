# ConFin — instruções para o Claude Code

Projeto Integrador II (FATEC · ADS): sistema de controle financeiro familiar colaborativo.
Equipe: Israel Batista de Faria, Gabriel Piva Garcia Coral, Luis Felipe Pereira e Mateus Rogério de Souza.
Documentação oficial: `Projeto Integrador II - Documentação de Software V3.pdf` (raiz do repositório).

## Como trabalhar com o Mateus
- **Antes de cada passo, explique o que vai ser feito, para que serve e por quê**, e só depois execute. Ele está estudando e quer aprender com o processo. Use português, linguagem didática e relacione com conceitos da faculdade (IaaS × PaaS, variáveis de ambiente, CI/CD, etc.).
- Commit e push só quando ele pedir.
- Nunca peça nem registre senhas ou a `DATABASE_URL` de produção no chat ou no código.

## Estado atual
App em produção desde 06/11/2026: **https://confin-qetu.onrender.com** (Render free + Supabase). Banco de produção ainda sem os dados da demo.

## Stack e estrutura
- `api/`: Node.js + Express 5 + `pg` (SQL puro) + Socket.io + bcryptjs + jsonwebtoken. ESM. `src/resumo.js` tem a lógica central do saldo.
- `web/`: React 19 + Vite + Tailwind CSS 4 + Recharts + vite-plugin-pwa.
- Banco local sem Docker: `npm run db:local` (embedded-postgres, porta 5433). Produção: Supabase (projeto `confin`, us-east-1, Session pooler) com RLS ligado e sem políticas.
- Deploy: Render, como serviço único (a API serve `web/dist`). `npm run build` / `npm start` na raiz.
- Rastreabilidade: manter os IDs da documentação (RF001–RF004, RN001–RN004, UC002) nos comentários e no README.

## Comandos
- `npm run setup`: instala as dependências da `api/` e do `web/`
- `npm run db:local` · `npm run db:seed` · `npm run dev:api` · `npm run dev:web`
- `npm run test:smoke` (com a API rodando): teste de ponta a ponta
- `npm run db:seed-sql --prefix api > seed.sql`: seed da demo como SQL (para o SQL Editor do Supabase)

## Cuidados
- Prioridade é a **estabilidade da demo**. Evite mudanças grandes perto do pitch.
- Categorias usam uma paleta validada para daltonismo em `web/src/lib/categorias.js` (ordem fixa; vermelho e âmbar reservados para alertas).
- Em PowerShell 5.1, o Git escreve no stderr e aparece como "erro" mesmo quando dá certo. Confira a saída real.
