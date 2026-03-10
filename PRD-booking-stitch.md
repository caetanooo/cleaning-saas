# PRD — Redesign da Página de Booking (Stitch)
**Status:** ✅ Implementado
**Arquivo principal:** `app/[slug]/WizardClient.tsx`
**Testes:** `__tests__/WizardClient.test.tsx`
**Referência visual:** `stitch pagina book.zip` (5 telas PNG)

---

## Objetivo

Reimplementar o wizard de booking para atingir ≥95% de similaridade visual com os mockups Stitch, preservando integralmente toda a lógica de negócio existente (pricing, availability, API, state machine).

---

## Escopo de Mudanças Implementadas

### Step 0 → Step 1 — House Details ✅

**Antes:** label "House Size", botões com número simples, service cards em lista vertical.
**Depois (Stitch):** label "House Details" no step indicator, botões com ícone SVG + número, service cards em grid 3 colunas.

| Elemento | Implementação |
|---|---|
| Label step indicator | `"House Size"` → `"House Details"` |
| Botões de quarto | `SizeBtn` com `<BedIcon />` SVG acima do número |
| Botões de banheiro | `SizeBtn` com `<BathIcon />` SVG acima do número |
| Estado selecionado | `bg-sky-500 text-white` (fundo azul sólido com texto branco) |
| Service cards layout | `grid grid-cols-3 gap-3` (3 colunas) |
| Service cards conteúdo | Ícone SVG (BroomIcon / SparklesIcon / BoxIcon) + nome + descrição + preço grande + badge `+$addon` |
| Ícones de serviço | `BroomIcon` (Regular), `SparklesIcon` (Deep), `BoxIcon` (Move-in) |
| Preço no card | `text-lg font-extrabold text-sky-600` no rodapé do card |
| Badge addon | `+$30` / `+$35` com `border-sky-200 rounded-full` |

**Lógica preservada:** `calcPrice()` sem alteração, `disabled` no Continue enquanto bed/bath não selecionados.

---

### Step 1 → Step 2 — Frequency ✅

**Antes:** lista vertical de 4 cards.
**Depois (Stitch):** grid 2×2 com preço em destaque e badges de desconto.

| Elemento | Implementação |
|---|---|
| Layout | `grid grid-cols-2 gap-3` (2×2 em mobile, flexível) |
| Nome da frequência | `font-bold text-slate-800 text-base` |
| Preço | `text-2xl font-extrabold text-sky-600` (destaque) |
| Label "per session" | `text-[10px] text-slate-400` |
| Badge de desconto | `Save X%` — `text-green-600 bg-green-50 rounded-full` abaixo do preço |
| Card selecionado | `border-sky-500 bg-sky-50` |

**Valores calculados corretamente:**
- One-Time 2b/2ba: `$165.00`
- Weekly (−30%): `$115.50`
- Bi-Weekly (−20%): `$132.00`
- Monthly (−5%): `$156.75`

**Lógica preservada:** `discountLabel()`, `disabled` no Continue sem frequência, botão Back.

---

### Step 2 → Step 3 — Date & Time (Week-View) ✅

**Antes:** scroll horizontal de pills de dias.
**Depois (Stitch):** week-view calendar com navegação prev/next, toggles Morning/Afternoon sempre visíveis após selecionar data, feedback "Selected:".

| Elemento | Implementação |
|---|---|
| Novo estado | `weekOffset: number` (default: `0`) |
| Função | `getWeekStart(weekOffset)` → segunda-feira da semana |
| Função | `computeWeekDays(cleaner, weekOffset)` → 7 `DayCard[]` |
| Função | `getWeekLabel(weekOffset)` → `"Mar 2026"` ou `"Mar – Apr 2026"` |
| Header | `‹ [Mês Ano] ›` com botões de navegação |
| Botão `‹` | `disabled` quando `weekOffset === 0` (não vai antes da semana atual) |
| Botão `›` | `disabled` quando `weekOffset >= 8` (máximo 8 semanas à frente) |
| Grid de dias | `grid grid-cols-7 gap-1` |
| Dias passados | `isPast: true` → `isOff: true` (desabilitado) |
| Dia confirmado | `bg-sky-500 text-white` + checkmark `✓` no canto superior direito |
| Dia ativo (clicado) | `bg-sky-50 border-2 border-sky-500` |
| Loading indicator | `animate-pulse` no número do dia |
| Toggle Morning | Botão com toggle switch SVG `bg-sky-500 translate-x-5` quando disponível |
| Toggle Afternoon | Mesmo padrão; `bg-slate-200 translate-x-0` quando indisponível |
| Feedback "Selected:" | Lista todos os `selectedDates` confirmados em linha |
| Counter | `"Dates selected: X of Y"` acima do calendário |

**Lógica preservada:** `handleDateClick()`, `handleBlockSelect()`, fetch `/api/availability`, `goStep3()` com validação `selectedDates.length >= required`, mensagem de erro 409.

---

### Step 3 → Step 4 — Your Details (2 Colunas) ✅

**Antes:** formulário single-column com um campo de endereço único.
**Depois (Stitch):** layout 2 colunas (form + sidebar), endereço dividido em 4 campos, campo Special Instructions, Booking Summary lateral com "Confirm & Pay →".

| Elemento | Implementação |
|---|---|
| Container da página | `max-w-4xl` quando `state.step === 3` (vs `max-w-xl` nos outros) |
| Layout | `flex flex-col lg:flex-row gap-6 items-start` |
| **Coluna esquerda** | `flex-1 space-y-5` |
| Card "Contact Information" | Full Name + Phone Number em `grid grid-cols-2` |
| Card "Address Details" | Home Address (full width) + City/State/ZIP em `grid grid-cols-3` |
| Campo City | `required`, placeholder "Austin" |
| Campo State | `required`, `maxLength={2}`, placeholder "TX" |
| Campo ZIP Code | `required`, placeholder "78701" |
| Campo Special Instructions | `textarea` opcional, 3 linhas, `resize-none` |
| Card "Household Profile" | Pets / Children / Carpets em `grid grid-cols-3` |
| Label atualizado | `"Carpet"` → `"Carpets"` (plural, como no Stitch) |
| **Coluna direita** | `lg:w-72 lg:sticky lg:top-6` |
| Booking Summary | Service / Date / Frequency / Total Price |
| Exibição de data | 1 data: `"Thu Mar 20, Morning"` · múltiplas: `"X dates selected"` |
| Preço | `text-2xl font-extrabold text-sky-600` |
| Botão "Confirm & Pay →" | Dentro do sidebar, `type="submit"` |
| Botão "← Back" | Dentro do sidebar, `type="button"` |

**Novos campos no estado (`WizardState`):**
```typescript
customerCity:         string  // default: ""
customerState:        string  // default: ""
customerZip:          string  // default: ""
specialInstructions:  string  // default: ""
```

**Endereço concatenado para a API:**
```typescript
const fullAddress = [
  state.customerAddress,
  state.customerCity,
  [state.customerState, state.customerZip].filter(Boolean).join(" "),
].filter(Boolean).join(", ");
// → "123 Main St, Austin, TX 78701"
```

Enviado como `customerAddress` no POST `/api/bookings` — compatível com schema existente.

**Lógica preservada:** `handleSubmit()`, `hasPets/hasChildren/hasCarpet`, `PhoneField`, `price !== null` guard, estado `submitting`, tratamento 409.

---

### Step 4 → Confirmação ✅

**Antes:** SMS primeiro, Messenger segundo, sem "Return to Home", botão "Book Another" separado.
**Depois (Stitch):** 3 botões em `flex-col sm:flex-row gap-3`.

| Elemento | Implementação |
|---|---|
| Ícone de sucesso | `w-14 h-14` com `border-2 border-green-300` (estilo outline) |
| Ordem dos botões | Messenger → SMS → Return to Home |
| Botão Messenger | `bg-[#1877F2] hover:bg-[#1464d8]` — `flex-1` |
| Botão SMS | `bg-sky-500 hover:bg-sky-600` — `flex-1` |
| Botão Return to Home | `<Link href="/">` com `border-2 border-slate-200` — `flex-1` |
| Feedback Messenger | Badge verde "Details copied!" abaixo do botão (5s timeout) |
| Botão "Book Another Cleaning" | Abaixo dos 3 botões, `setState(INITIAL)` |

**Lógica preservada:** `handleMessenger()`, `buildSmsBody()`, `navigator.clipboard.writeText()`, `window.open()`, guard `!cleaner.phone && !cleaner.messengerUsername`.

---

## Lógica NÃO Alterada (preservada integralmente)

- `calcPrice()` — fórmula de preço
- `discountLabel()` — badge de desconto
- `formatDate()` / `formatDateShort()` — formatação de datas
- `buildSmsBody()` — corpo do SMS
- `REQUIRED_DATES` — número de datas por frequência
- `FREQ_OPTIONS` / `SERVICE_OPTIONS` / `SERVICE_LABELS` / `BLOCK_INFO` — constantes
- `JS_TO_DAY` — mapeamento JS Date → DayOfWeek
- `handleDateClick()` — fetch availability + toggle activeDate
- `handleBlockSelect()` — adiciona à lista selectedDates
- `goStep1()` / `goStep2()` / `goStep3()` — validação e navegação
- `handleSubmit()` — POST /api/bookings com guard 409
- `handleMessenger()` — clipboard + window.open
- Todas as validações de campos `required` e `disabled`
- State machine completa (`WizardState`, `INITIAL`, `update()`)

---

## Arquivos Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `app/[slug]/WizardClient.tsx` | Modificado | Redesign completo dos 5 steps |
| `__tests__/WizardClient.test.tsx` | Criado | 80+ testes de similaridade e funcionalidade |
| `package.json` | Modificado | Scripts de teste + devDependencies de Jest |

---

## Testes (`__tests__/WizardClient.test.tsx`)

### Instalação
```bash
npm install
npm test
```

### Cobertura por grupo

| Grupo | Testes | O que verifica |
|---|---|---|
| Step 0 — House Details | 14 | Ícones bed/bath, seleção, preços, badges +$addon, service cards, step indicator, Continue/Back |
| Step 1 — Frequency | 13 | Grid layout, preços com desconto, badges Save X%, seleção exclusiva, Continue/Back, checkmark no indicador |
| Step 2 — Week-View | 12 | Header mês/ano, botões ‹ ›, grid 7 dias, fetch API, toggles, feedback "Selected:", checkmark, erro vermelho |
| Step 3 — Contact + Summary | 16 | Todos os campos, City/State/ZIP, Special Instructions, Booking Summary, preço, "Confirm & Pay", Back, `max-w-4xl` |
| Submit → Step 4 | 2 | Flow end-to-end completo, ID do booking na confirmação |
| Step 4 — Confirmação | 3 | Presença de phone/messengerUsername, reset do wizard |
| Pricing | 8 | Cálculos exatos: base, addons deep/move, descontos weekly/biweekly/monthly |
| Navegação — Indicador | 5 | 4 labels corretos, checkmarks por step, `max-w-4xl` no step 3 |

### Mocks utilizados
- `global.fetch` — simula `/api/availability` e `/api/bookings`
- `next/link` — componente anchor simples
- `@/components/PhoneField` — input simples com `aria-label`
- `navigator.clipboard.writeText` — `jest.fn()`
- `window.open` — `jest.fn()`

---

## Critérios de Aceitação — Status Final

| Critério | Status |
|---|---|
| Step 1: ícones bed/bath visíveis nos botões | ✅ |
| Step 1: service cards horizontais com preço e ícone | ✅ |
| Step 2: frequências em grid 2×2 com preço grande | ✅ |
| Step 2: badges "Save X%" | ✅ |
| Step 3: week-view com Prev/Next e label mês/ano | ✅ |
| Step 3: toggles Morning/Afternoon com switch visual | ✅ |
| Step 3: feedback "Selected: [data], [bloco]" | ✅ |
| Step 4: layout 2 colunas | ✅ |
| Step 4: endereço em Address + City + State + ZIP | ✅ |
| Step 4: campo Special Instructions | ✅ |
| Step 4: Booking Summary lateral com Confirm & Pay | ✅ |
| Step 5: 3 botões em row (Messenger / SMS / Home) | ✅ |
| Todos os botões navegam corretamente entre steps | ✅ |
| Continue/Back com disabled states funcionando | ✅ |
| Submit cria booking via API | ✅ |
| Messenger e SMS funcionam na confirmação | ✅ |
| Lógica de preço preservada | ✅ |
| Zero erros de lint (`npm run lint`) | ✅ |
