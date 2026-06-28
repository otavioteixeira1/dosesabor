# Doce Sabor Doceria Gourmet

Sistema web completo para cardápio mobile, checkout por WhatsApp e painel administrativo com Supabase.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase Auth, Postgres e Storage
- Deploy recomendado em Vercel ou Cloudflare Pages

## Funcionalidades entregues

- Página pública mobile-first com status da loja, categorias e produtos
- Carrinho persistente em `localStorage`
- Observação por item e observações gerais do pedido
- Escolha entre retirada e entrega com cálculo automático da taxa
- Finalização por WhatsApp com mensagem formatada
- Registro do pedido no Supabase antes do redirecionamento
- Painel administrativo com login protegido
- Dashboard com vendas do dia, pedidos, caixa e produtos mais vendidos
- CRUD de categorias e produtos
- Upload de imagem em bucket público do Supabase Storage
- Gestão de pedidos com status operacional
- Baixa automática de estoque ao confirmar pedido
- Reversão automática de estoque ao cancelar pedido confirmado
- Controle de estoque manual
- Controle de caixa com entradas, despesas e fechamento diário
- Configurações da loja editáveis no painel

## Como rodar localmente

Modo mais simples no Windows:

- Dê duplo clique em `Iniciar Doce Sabor.bat`
- Ele instala dependências se faltar alguma, cria `.env` a partir do exemplo se necessário, sobe o Vite e abre o navegador
- Loja: `http://127.0.0.1:4173`
- Admin: `http://127.0.0.1:4173/admin/login`

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Preencha no `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Aplique as migrations no Supabase.

Opção A: Supabase CLI

```bash
supabase db push
```

Opção B: SQL Editor

- Execute `supabase/migrations/202606280001_initial_schema.sql`
- Depois execute `supabase/migrations/202606280002_seed_data.sql`

5. Crie pelo menos um usuário admin em `Authentication > Users` no dashboard do Supabase.

6. Rode a aplicação:

```bash
npm run dev
```

## Estrutura relevante

- `src/pages/storefront-page.tsx`: vitrine pública e checkout
- `src/components/cart-sheet.tsx`: carrinho, dados do cliente e finalização
- `src/pages/admin-page.tsx`: dashboard, CRUDs, pedidos, estoque, caixa e configurações
- `src/services/store-service.ts`: integração única com Supabase
- `src/context/cart-context.tsx`: persistência e manipulação do carrinho
- `src/context/auth-context.tsx`: sessão do admin
- `supabase/migrations/*.sql`: schema, RLS, automações e dados iniciais

## Banco e segurança

- O schema usa RLS em todas as tabelas públicas.
- Leitura pública fica restrita a categorias e produtos ativos/disponíveis e às configurações da loja.
- Inserção pública é limitada a `orders` e `order_items` para viabilizar o fluxo do WhatsApp.
- O painel administrativo depende apenas de usuários autenticados no Supabase Auth.
- O frontend usa somente a `anon key`.

## Deploy

### Vercel

1. Importe o projeto.
2. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Use o comando de build padrão:

```bash
npm run build
```

4. Diretório de saída: `dist`

### Cloudflare Pages

1. Conecte o repositório.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Configure as mesmas variáveis de ambiente do `.env`

## Observações operacionais

- O bucket esperado para upload é `product-images`; a migration já cria bucket e policies.
- O WhatsApp configurado em `settings.whatsapp_number` deve estar em formato internacional.
- Se o Supabase estiver indisponível, o app ainda abre o WhatsApp, mas avisa que o painel não sincronizou o pedido.

## Verificação rápida

```bash
npm run build
```
