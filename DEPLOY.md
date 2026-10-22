# Publicação segura

## 1. Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/202610220001_finance_schema.sql` no SQL Editor.
3. Publique a função `sync-pluggy` em `supabase/functions/sync-pluggy`.
4. Em **Edge Functions > Secrets**, cadastre:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`
   - `PLUGGY_ITEM_ID`
   - `ALLOWED_ORIGIN` com apenas a origem, por exemplo `https://usuario.github.io`
5. Em **Authentication > URL Configuration**, adicione a URL completa do GitHub Pages às Redirect URLs.

O `client secret` e o Item ID ficam somente na Edge Function. Não use esses valores em variáveis `NEXT_PUBLIC_*`.

## 2. GitHub

1. Envie este diretório para um repositório com branch `main`.
2. Em **Settings > Secrets and variables > Actions > Variables**, crie:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Em **Settings > Pages**, selecione **GitHub Actions** como fonte.
4. Execute o workflow **Publicar no GitHub Pages**.

O workflow gera uma exportação estática em `out/`. A chave publicável do Supabase pode estar no navegador porque todas as tabelas usam autenticação e RLS; chaves secretas nunca entram no build.
