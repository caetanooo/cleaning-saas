# PRD: Agendamento Dinâmico com Controle de Equipe (CleanClick)

**Versão:** 1.0
**Data:** 2026-03-16
**Status:** Em Desenvolvimento

---

## 1. Objetivo

Substituir o modelo de agendamento por turnos fixos (Manhã / Tarde) por um sistema de **slots dinâmicos baseados em duração estimada de serviço e tamanho da equipe (densidade)**. O novo modelo permite que a faxineira configure o tempo de cada serviço, e o sistema calcula automaticamente quais horários de início estão disponíveis em cada dia, respeitando agendamentos existentes e o tempo de deslocamento entre clientes.

---

## 2. Contexto e Motivação

### Problema Atual
- O sistema atual oferece apenas dois turnos fixos: **Manhã (09h–13h)** e **Tarde (13h30–18h)**.
- Uma faxina em uma casa maior pode durar mais de 4 horas, tornando impossível encaixar dois serviços no mesmo dia, mas o sistema não impede esse conflito.
- A faxineira não consegue indicar se vai sozinha, em dupla ou em trio, e o sistema não recalcula o tempo nem o horário de término.

### Solução Proposta
- Cada faxineira configura o **tempo base** de cada tipo de limpeza e o **tempo adicional por cômodo**.
- O sistema calcula a duração estimada total com base no tamanho da casa escolhida pelo cliente.
- O calendário exibe **horários de início disponíveis** (em vez de turnos) baseados nos gaps reais da agenda.
- Após o agendamento, a faxineira informa a densidade da equipe via **WhatsApp**, e o sistema recalcula o `end_time` e confirma o slot.

---

## 3. Funcionalidades

### 3.1 Configuração de Tempos (Dashboard Faxineira)

**Nova aba "Tempos" no painel de configurações (`/cleaner/setup`).**

| Campo | Tipo | Descrição |
|---|---|---|
| `service_type` | select | Tipo: `regular`, `deep`, `move` |
| `base_duration` | integer (min) | Tempo base do serviço (ex: 120 min) |
| `room_type` | select | Cômodo: `bedroom`, `bathroom`, `kitchen`, `living_room` |
| `time_per_room` | integer (min) | Minutos adicionais por unidade (ex: 30 min/quarto) |

**Comportamento:**
- Uma faxineira pode ter múltiplos registros (um por tipo de serviço × cômodo).
- Se não houver configuração, o sistema usa o comportamento legado (turnos Manhã/Tarde).
- Salvamento via `PUT /api/cleaners/[id]/time-configs`.

---

### 3.2 Equação de Tempo

```
T_total = (T_base + Σ (count_room × T_room)) / N_staff
```

Onde:
- `T_base` = `base_duration` do tipo de serviço selecionado
- `Σ T_rooms` = soma de `(quantidade_comodo × time_per_room)` para cada tipo de cômodo
- `N_staff` = número de funcionários na equipe (1, 2 ou 3)
- `travel_time` = 45 minutos (constante global, adicionado ao slot para buffers)

**Exemplo:**
- Regular Cleaning, 3 quartos, 2 banheiros, 1 funcionário:
  - `T_base = 120 min`
  - `Σ T_rooms = (3 × 30) + (2 × 20) = 130 min`
  - `T_total = (120 + 130) / 1 = 250 min` (~4h10)

---

### 3.3 Detecção de Overlap (Conflict Detection)

Ao buscar slots disponíveis para uma data `D`:

1. Calcular `T_total` com base no carrinho do cliente.
2. Buscar todos agendamentos ativos do dia `D` para a faxineira.
3. Para cada horário candidato `H` (de 30 em 30 minutos, dentro do horário de trabalho):
   - O slot `[H, H + T_total + 45min]` é **válido** se não houver interseção com nenhum bloco existente `[start_booking - 45min, end_booking + 45min]`.

**Endpoint:** `GET /api/bookings/slots?cleanerId=&date=&duration=`

---

### 3.4 Fluxo WhatsApp Business

**Endpoint:** `POST /api/webhooks/whatsapp`

1. Cliente finaliza agendamento → status inicial = `pending`.
2. Backend envia mensagem WhatsApp para a faxineira:
   > "Nova faxina! Você vai sozinha (1), em dupla (2) ou em trio (3)?"
3. Webhook recebe resposta (1, 2 ou 3).
4. Backend:
   - Recalcula `T_total` com o novo `N_staff`.
   - Atualiza `staff_count`, `scheduled_end_time`, `status = 'confirmed'`.
5. Cliente recebe confirmação.

> **⚠️ Dependência Externa:** Requer conta WhatsApp Business API e configuração de webhook no Meta Developer Portal.

---

### 3.5 Atualização do Wizard de Agendamento

- Se a faxineira tem `time_configs` configurados:
  - Exibe **horários de início disponíveis** (lista de slots como "9:00", "9:30", "10:00"…).
  - Remove a seleção de Manhã/Tarde.
- Se não tem configurações:
  - Mantém o comportamento legado (Manhã / Tarde).

---

## 4. Modelo de Dados

### Nova Tabela: `provider_time_configs`

```sql
CREATE TABLE provider_time_configs (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type    text NOT NULL CHECK (service_type IN ('regular', 'deep', 'move')),
  base_duration   integer NOT NULL DEFAULT 120,   -- minutos
  room_type       text NOT NULL CHECK (room_type IN ('bedroom', 'bathroom', 'kitchen', 'living_room')),
  time_per_room   integer NOT NULL DEFAULT 30,    -- minutos
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (provider_id, service_type, room_type)
);
```

### Modificações na Tabela `bookings`

```sql
ALTER TABLE bookings
  ADD COLUMN estimated_duration  integer,          -- duração estimada em minutos
  ADD COLUMN staff_count         integer DEFAULT 1, -- 1, 2 ou 3
  ADD COLUMN scheduled_start_at  timestamptz,      -- timestamp exato de início
  ADD COLUMN scheduled_end_at    timestamptz;      -- timestamp exato de término
```

### Modificação em `BookingStatus`

```typescript
type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
```

---

## 5. Arquitetura de APIs

| Rota | Método | Auth | Descrição |
|---|---|---|---|
| `/api/bookings/calculate` | POST | None | Calcula `T_total` dado o carrinho do cliente |
| `/api/bookings/slots` | GET | None | Retorna horários disponíveis para uma data e duração |
| `/api/cleaners/[id]/time-configs` | GET, PUT | Bearer | Lê/salva configurações de tempo da faxineira |
| `/api/webhooks/whatsapp` | POST | HMAC | Recebe resposta da faxineira via WhatsApp |

---

## 6. Plano de Entrega

| Fase | Entregas | Prioridade |
|---|---|---|
| 1 | Migration SQL + Types + `lib/timeCalculator.ts` | Alta |
| 2 | APIs: `calculate`, `slots`, `time-configs` | Alta |
| 3 | Dashboard: aba "Tempos" no setup da faxineira | Alta |
| 4 | Wizard: slots dinâmicos (com fallback legado) | Média |
| 5 | WhatsApp webhook + integração `pending` status | Baixa (dep. externa) |

---

## 7. Critérios de Aceitação e Testes

### Testes Automatizados (Jest)

1. **`calculateDuration()`** — dado serviço, cômodos e N_staff, retorna minutos corretos.
2. **`hasOverlap()`** — dado um slot candidato e lista de bookings existentes, detecta corretamente sobreposição (com buffer 45 min).
3. **`getAvailableSlots()`** — dado horário de trabalho e bookings do dia, retorna array de slots livres corretos.

### Testes Manuais

1. Login como faxineira → aba "Tempos" → preencher base_duration 120 min para Regular, 30 min/quarto, 20 min/banheiro → salvar → verificar persistência.
2. Como cliente: selecionar 3 quartos, 2 banheiros, Regular Cleaning → na tela de datas verificar que slots de 4h10 estão disponíveis com gaps corretos.
3. Confirmar agendamento → verificar `status = 'pending'` no Supabase.
4. Simular webhook WhatsApp via Postman com `{ "staff_count": 2 }` → verificar que `scheduled_end_at` foi reduzido pela metade e `status = 'confirmed'`.

---

## 8. Riscos e Dependências Externas

| Risco | Mitigação |
|---|---|
| WhatsApp API requer aprovação Meta | Implementar stub + fallback para confirmação manual no dashboard |
| Faxineira sem time_configs configurados | Fallback automático para turnos Manhã/Tarde legados |
| Migração de dados históricos | Novos campos são nullable; dados antigos não são afetados |
| Overlap em bookings legados (sem scheduled_start_at) | Usar `time_block` para inferir start/end dos bookings sem timestamp |
