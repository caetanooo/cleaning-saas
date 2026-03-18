# PRD: Setup da Faxineira - Agenda e Gerenciamento

## 1. Visão Geral
Este documento define os requisitos técnicos, arquitetura e diretrizes de desenvolvimento para a evolução da página de setup e agenda da faxineira dentro do SaaS de Limpeza. O objetivo é adicionar flexibilidade ao gerenciamento de horários de folga, introduzir o controle de conclusão de tarefas e permitir que a profissional inclua faxinas manualmente na sua agenda.

## 2. Instruções para o Desenvolvedor (Claude Code)
- **Papel:** Você atuará como o Desenvolvedor Responsável por esta feature. Leia todo este documento para entender as necessidades do produto e do usuário. Ao codificar, atue investigando primeiro como a arquitetura atual do app foi montada.
- **Diretrizes de Ação:**
  1. **Investigação inicial:** Antes de modificar o código, examine os componentes de agenda existentes, formulários e modelos de estado (Context, Redux, Zustand ou estado de BD) relacionados ao *Setup da Faxineira*. 
  2. **Skills e Ferramentas:** Utilize suas skills de navegação de código, entendimento do DOM (se necessário usar o browser subagent) e buscas para encontrar a paleta de cores correta.
  3. **Estética (UI/UX):** É primordial manter o padrão estético premium e moderno. As transições de cores, modais de formulário e feedbacks visuais devem apresentar micro-animações (ex: animação de "check" ao concluir uma faxina). Use bibliotecas de componentes existentes no projeto (se houver, como Tailwind, Radix, Shadcn, etc.).

---

## 3. Funcionalidades Detalhadas

### Feature 1: Folgas Específicas Parciais (Manhã vs Tarde)
**Objetivo:** Permitir o bloqueio de apenas um turno de um dia específico (ex: sábado 14 de março, folga de manhã, mas disponível à tarde).
**Requisitos:**
- **UI de Seleção:** Na área onde o usuário adiciona uma "Folga Específica", incluir uma opção de seleção de período:
  - Dia Inteiro (Padrão)
  - Manhã (ex: 08:00 as 12:00)
  - Tarde (ex: 13:00 as 18:00)
- **Gestão de Indisponibilidade:** A lógica de marcação do calendário para os clientes agora precisa considerar a granularidade de período (Manhã / Tarde), garantindo que no caso de folga matutina, o período vespertino ainda esteja disponível para agendamento.
- **Modelo de Dados:** Atualizar a tipagem/banco de dados para folgas do tipo específica, incluindo o campo `periodo`.

### Feature 2: Marcação de Conclusão ("Check") na Faxina
**Objetivo:** Criar um status visual para mapear de imediato as faxinas concluídas do dia.
**Requisitos:**
- **Ação Rápida:** Na listagem da agenda do dia, cada card de faxina deve possuir um ícone interativo (ex: checkbox circular ou ícone de "check").
- **Mudança de Estado e Cor:** Ao ser acionado, o marcador da faxina (bolinha lateral ou indicador de status), que hoje é roxo ou azul, deve mudar suavemente para a cor **Verde** (sinalizando sucesso).
- **Feedback Visual:** Implementar uma transição suave de cores e, idealmente, uma micro-animação no ícone de confirmação.
- **Persistência de Dados:** O clique precisará disparar a alteração do status (ex: `'agendado' -> 'concluido'`) na camada de dados pertinente.

### Feature 3: Inserção Manual de Faxinas
**Objetivo:** Flexibilidade para que a própria faxineira preencha buracos na agenda com clientes captados fora do app/plataforma.
**Requisitos:**
- **Trigger:** Um botão de fácil acesso (ex: "Adicionar Faxina Manual" ou "Novo Agendamento") posicionado junto à visualização da agenda.
- **Interação:** Abrir um Modal, Dialog ou Side Drawer contendo um formulário limpo e validado.
- **Campos do Formulário:**
  - Nome do(a) cliente
  - Endereço completo
  - Data e Hora
  - Tamanho da casa
  - Tipo de limpeza (Padão, Pesada, etc)
  - Preço
- **Comportamento Pós-Envio:** Ao salvar validamente este form, o card desta faxina entra instantaneamente para a lista do dia correspondente, com o visual de uma faxina agendada (bolinha roxa/azul).
- **Tipagem:** Distinguir na interface e nos dados (ex: uma tag ou ícone sutil) o que é um "Agendamento via Plataforma" do que é "Agendamento Manual".

---

## 4. Arquitetura Sugerida e Modelagem de Estado
Como Arquiteto, sugiro as seguintes intervenções no modelo:
> [!IMPORTANT]
> Verifique a tipagem atual de agendamentos e dias de folga no repositório antes de realizar mudanças nos Schemas (Zod, Prisma, Mongoose, etc.).

**Modelo de Agendamento (`Booking` ou similar)**
```typescript
interface AgendaItem {
  id: string;
  // ... campos existentes
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED'; // Para lidar com o Check (Feature 2)
  source: 'PLATFORM' | 'MANUAL'; // Para suportar a Feature 3
  
  // Dados exigidos na Feature 3 que podem ter sido opcionais ou diferentes hoje
  clientName?: string;
  address?: string;
  houseSize?: string;
  cleaningType?: string;
  price?: number;
}
```

**Modelo de Folga Específica (`TimeOff` ou similar)**
```typescript
interface SpecificTimeOff {
  id: string;
  date: string | Date; // ISO string ou objeto Date
  period: 'ALL_DAY' | 'MORNING' | 'AFTERNOON'; // O novo campo (Feature 1)
}
```

## 5. Plano de Entrega
1. **Fase 1:** Atualização das Modelagens e Types no Front/Back (Preparação do terreno).
2. **Fase 2:** Desenvolvimento do componente visual para o input do período nas *Folgas* e integração da tela.
3. **Fase 3:** Implementação do botão "Check" e animações de estado para o "Completo" na listagem da *Agenda*.
4. **Fase 4:** Criação do Dialog Formutivo de Agendamento Manual, listando o submetido diretamente na timeline da *Agenda*.
