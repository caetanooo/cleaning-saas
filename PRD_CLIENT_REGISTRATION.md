# PRD: Cadastro de Clientes das Faxineiras (End-Customers)

## 1. Visão Geral
A necessidade do negócio é permitir que os clientes finais das faxineiras não precisem repetir todo o preenchimento de seus dados e características da casa nas próximas vezes que forem agendar uma limpeza.

Para isso, foi adicionada uma etapa de **Login/Cadastro obrigatório antes da página de agendamento (Booking)**. 
- O cliente clica no link da faxineira.
- É redirecionado para criar uma conta (Nome, Email e Senha) ou fazer login.
- Após logar, ele acessa a página de Booking normal, onde detalha a casa (tamanho, endereço, pets, etc.).
- O sistema salva essas informações vinculadas à conta recém-(ou já)criada durante o próprio fluxo de agendamento.
- Nos agendamentos subsequentes, como o cliente já estará logado (sessão mantida por cookies no dispositivo), os dados já estarão preenchidos na página de Booking, restando apenas a confirmação.

## 2. Requisitos Funcionais

### 2.1. Autenticação (Login e Cadastro)
- **Bloqueio de Rota**: A página de agendamento de uma faxineira específica só pode ser acessada por usuários autenticados.
- Se não autenticado, redirecionar para uma página de Login / Cadastro.
- O cliente deve criar a conta fornecendo: Nome, Email e Senha (ou apenas fazer o Login).
- **Persistência de Sessão**: O sistema deve lembrar do dispositivo do cliente usando Cookies locais (comportamento padrão do Supabase Auth no navegador). Assim, ele não precisa relogar a menos que faça logout ativamente ou limpe os dados do navegador.

### 2.2. Perfil do Cliente e Informações do Local
Os seguintes dados fornecidos ou confirmados pela página de Booking (agendamento) existente devem ser vinculados ao usuário autenticado e salvos no banco:
- **Nome e Telefone**
- **Endereço Completo**
- **Tamanho da Casa**: Quantidade de Quartos e de Banheiros
- **Família e Local**:
  - Presença de Pets (Sim/Não)
  - Presença de Crianças (Sim/Não)
  - Piso de Carpete (Sim/Não)

### 2.3. Fluxos de Uso no Agendamento (Booking)
- **Primeiro Agendamento**: 
  1. Cliente acessa o link da faxineira.
  2. Cria a conta (Nome, Email, Senha).
  3. Vai para a página de Booking.
  4. Preenche os detalhes da casa, pets e endereço e finaliza o agendamento.
  5. O sistema salva tanto o agendamento quanto atualiza o "perfil" (com os dados recorrentes).
- **Agendamento Recorrente**: 
  1. Cliente acessa o link da faxineira (já está logado pelos cookies do celular/PC).
  2. O formulário de Booking carrega automaticamente as preferências do banco (Quartos, Banheiros, Endereço, Pets, etc.). 
  3. O cliente apenas valida os dados, altera o que for necessário, escolhe a data e prossegue.

---

## 3. Instruções Técnicas para o Desenvolvedor (Claude)

Claude, atue como o desenvolvedor principal desta aplicação em Next.js + Supabase. Siga estas instruções para implementar o PRD acima. Evite modificar a estrutura visual e os fluxos de forma disruptiva, a ideia é injetar o login antes do Booking e aproveitar o form de Booking para salvar o perfil.

### 3.1. Banco de Dados e Schema (Supabase)
- O projeto atualmente utiliza `@supabase/supabase-js` e `@supabase/ssr`.
- Você deve criar uma migration ou executar *queries* SQL para criar uma tabela (ex: `customer_profiles`) para armazenar os detalhes adicionais dos clientes vinculados ao Auth.
- A tabela DEVE referenciar `auth.users(id)` com `ON DELETE CASCADE`.
- Colunas necessárias no `customer_profiles`:
  - `id` (uuid, chave primária referenciando `auth.users(id)`)
  - `name` (text)
  - `phone` (text)
  - `address` (text / jsonb dependendo de como o endereço é salvo atualmente no app)
  - `bedrooms` (integer)
  - `bathrooms` (numeric)
  - `has_pets` (boolean)
  - `has_children` (boolean)
  - `has_carpet` (boolean)
- Configure as políticas de *Row Level Security (RLS)* para que apenas o próprio cliente (usuário logado) possa dar `SELECT` e `UPDATE` em seu perfil.

### 3.2. Fluxo de Autenticação e Sessão
- Crie ou utilize as páginas de `signup` (Cadastro) e `login` (Entrar) usando Email e Senha via Supabase Auth.
- Implemente uma barreira (pode ser via `middleware.ts` ou checagem no Server Component da página de Booking) que exija que o usuário esteja logado antes de visualizar o formulário de Agendamento.
- Retenha a URL de destino (ex: `?redirectTo=/book/faxineira-id`) para que, após o login/cadastro, o usuário caia diretamente onde queria ir.
- **Sessão Longa**: O Supabase `@supabase/ssr` gerencia a sessão por cookies. Configure ou certifique-se de que os cookies tenham um tempo de vida longo (ex: meses), para que o cliente não precise fazer login novamente no mesmo celular, atingindo um dos principais requisitos.

### 3.3. Integração na Página de Booking (Auto-preenchimento e Salvamento)
- Na página de Booking existente (geralmente um Server Component renderizando um form Client Component com `react-hook-form`), busque os dados do perfil do cliente autenticado (`customer_profiles`).
- Passe esses dados como valores iniciais (`defaultValues`) para o formulário no frontend. 
- Quando o usuário finalizar/submeter o Booking com sucesso, além de criar o "Agendamento" em si,  você deve fazer um **UPSERT** na tabela `customer_profiles` atualizando `address`, tamanho da casa, pets, etc., garantindo que essas informações estarão salvas para a próxima vez.

### 3.4. Critérios de Aceite e Estilo
- Não modifique drasticamente o visual: mantenha a coerência com as classes do Tailwind CSS do projeto.
- [ ] O cliente é obrigado a fazer login/cadastro antes de ver a página de Booking.
- [ ] O sistema salva os dados de endereço/perfil passados no Booking.
- [ ] Se houver dados no banco para o cliente, a página de Booking os carrega automaticamente.
- [ ] O cliente permanece logado no dispositivo nas próximas visitas (cookies persistentes).
