# Plano de Implementação: Agendamento Dinâmico (CleanClick)

Este documento detalha a arquitetura e o passo a passo para a transição do sistema de agendamento de turnos fixos (Morning/Afternoon) para um modelo dinâmico baseado em estimativa de tempo real e tamanho da equipe (densidade). 

## User Review Required
> [!IMPORTANT]  
> A integração com o WhatsApp exigirá configuração de webhooks e credenciais da API do WhatsApp Business.

---

## Proposed Changes

### 1. Banco de Dados (Supabase/PostgreSQL)

#### [NEW] `supabase/migrations/xxxx_dynamic_agenda.sql`
Criaremos uma nova migration para evoluir o schema atual do banco.

**Tabela `provider_time_configs` (Nova)**
Estrutura para a faxineira definir a duração (em minutos) de cada serviço:
- `id` (uuid, PK)
- `provider_id` (uuid, FK para users/providers)
- `service_type` (text) - Ex: 'regular', 'deep'
- `base_duration` (integer) - Tempo base do serviço em minutos
- `room_type` (text) - Ex: 'bedroom', 'bathroom', 'kitchen'
- `time_per_room` (integer) - Minutos adicionais por unidade desse cômodo
- `created_at`, `updated_at` (timestamp)

**Tabela `bookings` (Modificação)**
Evoluir a tabela para suportar tempo e densidade de equipe:
- Adicionar `start_time` (timestamp with time zone)
- Adicionar `end_time` (timestamp with time zone)
- Adicionar `estimated_duration` (integer) - Duração total estimada em minutos
- Adicionar `staff_count` (integer) - Default 1, pode ser 2 ou 3
- Constante Global a considerar no backend: `travel_time = 45` minutos.

---

### 2. Lógica de Cálculo e Disponibilidade (Backend)

#### [NEW] `app/api/bookings/calculate/route.ts` ou Supabase RPC
Implementar a Equação de Tempo:
$$T_{total} = (T_{limpeza} + \sum T_{comodos}) / N_{staff}$$

**Validação de Slot (Overlap Detection)**
- Ao buscar horários disponíveis para uma data `D`, o sistema precisa:
  1. Calcular o $T_{total}$ com base no carrinho do cliente.
  2. Adicionar o `travel_time` (45 min) à duração.
  3. Buscar na tabela `bookings` todos os agendamentos do dia `D`.
  4. Um horário de início `H` só é válido se o intervalo `[H, H + T_{total} + 45min]` **não tiver interseção (overlap)** com os blocos de `[start_time - 45min, end_time + 45min]` dos agendamentos existentes.

---

### 3. Integração WhatsApp Business

#### [NEW] `app/api/webhooks/whatsapp/route.ts`
Fluxo de confirmação de densidade de equipe:
1. O cliente finaliza o agendamento. O status inicial no banco é `PENDING`.
2. O backend dispara uma mensagem via API do WhatsApp Business para o número da faxineira: "Você tem uma nova faxina! Vai sozinha, em dupla ou em trio?"
3. O webhook do WhatsApp recebe a resposta (1, 2 ou 3).
4. O backend recalcula o $T_{total}$. Exemplo: se $T_{total}$ base for 8h (480 min):
   - Sozinha (1) = 8h
   - Dupla (2) = 4h
   - Trio (3) = ~2.6h
5. O sistema atualiza o `staff_count` e `end_time` no banco, muda o status para `CONFIRMED` e libera o restante da agenda.

---

### 4. Tarefas  (Frontend)

#### [NEW] Setup da Faxineira (Dashboard)
- Criar nova aba de configuração de tempos no painel da faxineira.
- Formulários para input de `base_duration` por tipo de limpeza e `time_per_room` para quartos, banheiros, etc.
- Salvar dados na tabela `provider_time_configs`.

#### [MODIFY] Fluxo de Agendamento (Booking Calendar)
- Substituir a seleção estática (Manhã/Tarde) por uma lista de slots gerados dinamicamente baseados no Overlap Detection.
- Omitir a duração estrita para o cliente (exibir apenas "Horário de Chegada" ou slots de início permitidos).
- Ao confirmar o carrinho, o frontend chama a rota de `calculate` para obter a estimativa de tempo (invisível pro cliente) e envia para a checagem final antes de confirmar os dados do agendamento.

---

## Verification Plan

### Automated Tests
1. **Overlap Detection Logic:** Escrever testes unitários em Jest/Vitest para a função de cálculo de interseção de horários (garantir que `start_time` + duração + 45min de viagem não sobrescreva slots existentes).
2. **Equação de Tempo:** Teste unitário passando uma array de cômodos e staff variando entre 1, 2 e 3 para validar a redução proporcional.

### Manual Verification
1. Fazer o login como Faxineira no Dashboard e preencher os tempos base e por cômodo.
2. Como Cliente final, selecionar serviços que totalizem 4h. No calendário, verificar se os slots de horários se ajustam corretamente aos buracos da agenda do dia, respeitando os 45min de deslocamento.
3. Testar o fluxo de checkout garantindo que o status caia como `PENDING`.
4. Simular o envio para o webhook do WhatsApp via Postman enviando um payload de resposta "2" (Dupla) e confirmar via Supabase se o banco reajustou o `end_time` pela metade do tempo e alterou para `CONFIRMED`.
