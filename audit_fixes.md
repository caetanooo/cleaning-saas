# Correções Aplicadas — Audit Report (Gemini)

## 1. PII em `POST /api/bookings`

**Arquivo:** `app/api/bookings/route.ts`

O endpoint agora retorna apenas os campos gerados pelo servidor:

```json
{ "id", "date", "timeBlock", "startTime", "endTime", "totalPrice", "status" }
```

Dados do cliente (nome, telefone, endereço, etc.) nunca saem do servidor na resposta.

**Arquivo:** `app/[slug]/WizardClient.tsx`

- O tipo `Booking[]` em `confirmedBookings` foi substituído por `ConfirmedSlot[]` (tipo local mínimo).
- A tela de confirmação (Step 4) agora usa `state.*` diretamente para exibir bedrooms, bathrooms, frequency, address, phone, pets, children e carpet — em vez de depender do objeto retornado pela API.
- `buildSmsBody` atualizado para receber `state` em vez de `Booking[]`.

---

## 2. Código morto removido

**Arquivo deletado:** `app/StripePricingTable.tsx`

Componente definido mas não importado em nenhum lugar do projeto.

---

## 3. Middleware — env vars sem asserções `!`

**Arquivo:** `middleware.ts`

As asserções `!` foram substituídas por verificações explícitas:

```ts
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const loginUrl = new URL("/cleaner/login", request.url);
  return NextResponse.redirect(loginUrl);
}
```

Se as variáveis de ambiente estiverem ausentes, o middleware redireciona para login (rota protegida) em vez de travar com erro 500.

---

## 4. Backdoor `dev/activate` bloqueado em produção

**Arquivo:** `app/api/dev/activate/route.ts`

A rota retorna `404` imediatamente em `NODE_ENV === "production"`, tornando-a invisível mesmo que alguém descubra a URL:

```ts
if (process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

---

## Itens do audit não alterados (arquiteturais)

- **"Uso excessivo da service role key"** — Requer reescrever todas as rotas para usar a anon key com RLS no Supabase. Mudança de escopo muito grande e sem garantia de que as políticas RLS existentes suportam os casos de uso atuais.

- **"Spam em bookings sem auth"** — Requer rate limiting com infraestrutura externa (Redis, Upstash, etc.). As proteções existentes já limitam o dano naturalmente: limite de 10 KB no payload, conflict check por slot (morning/afternoon), e o fato de que cada faxineira tem no máximo 2 slots por dia.
