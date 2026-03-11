# Relatório de Auditoria do Projeto: Segurança, Código Morto e Vazamento de Dados

Este relatório resume as descobertas de uma auditoria abrangente realizada no projeto `cleaning-saas`.

## 1. Vulnerabilidades de Segurança

### 🚨 Crítico: Falta de Autenticação no POST de Agendamentos
O endpoint `POST /api/bookings` não exige nenhuma autenticação.
- **Risco**: Qualquer pessoa pode criar agendamentos para qualquer faxineiro(a) fornecendo o `cleanerId`. Isso pode levar a agendamentos de "spam" ou um ataque de Negação de Serviço (DoS) para os profissionais.
- **Exposição de Dados**: Ao ser finalizado, o endpoint retorna o objeto completo do agendamento, que contém dados sensíveis do cliente (`customer_phone`, `customer_address`). Embora seja necessário criar um agendamento para ver isso, a falha pode ser usada para sondar a disponibilidade ou confirmar IDs de faxineiros.

### ⚠️ Aviso: Uso Excessivo da Chave de Service Role
O projeto utiliza a `SUPABASE_SERVICE_ROLE_KEY` em todas as rotas de API através da função [createServiceClient()](file:///c:/Users/pedro/Downloads/cleaning-saas/lib/supabase.ts#18-32).
- **Risco**: Esta chave ignora a Segurança de Nível de Linha (RLS) no banco de dados. Cada rota de API deve implementar manualmente suas próprias verificações de autorização. Qualquer falha na lógica de autorização em TypeScript pode levar à exposição total do banco de dados.
- **Recomendação**: Use um cliente com a `ANON_KEY` sempre que possível e dependa das políticas de RLS do Supabase como uma segunda camada de defesa.

### ⚠️ Nota: "Backdoor" de Desenvolvimento
A rota `POST /api/dev/activate` permite a ativação manual do status de assinatura de um faxineiro.
- **Risco**: Embora verifique uma lista de e-mails de proprietários, manter esse tipo de lógica de "ativação" no código é um alvo potencial caso a lista de proprietários ou a verificação de e-mail seja burlada.

---

## 2. Potenciais Vazamentos de Dados

### Exposição de Dados do Cliente
Embora `GET /api/cleaners/[id]` legalize corretamente os dados públicos (removendo e-mail e telefone via [rowToPublicCleaner](file:///c:/Users/pedro/Downloads/cleaning-saas/app/api/cleaners/_shared.ts#32-37)), o vazamento no `POST /api/bookings` mencionado acima é a maior preocupação.
- **Logs**: Certifique-se sempre de que o `console.error` (encontrado em vários blocos `catch`) não registre o corpo completo das requisições, que podem conter PII (Informações de Identificação Pessoal).

---

## 3. Auditoria de Código Morto

### Componentes Não Utilizados
- **[app/StripePricingTable.tsx](file:///c:/Users/pedro/Downloads/cleaning-saas/app/StripePricingTable.tsx)**: Este componente está definido, mas não é importado ou usado em nenhum lugar da base de código.
- **Ativos em `public/stitch/`**: Existem várias imagens em `public/stitch/` (provenientes do arquivo `.zip` na raiz). Muitas delas podem ser redundantes se o design atual não utiliza mais o conteúdo original do zip.

### Dependências Redundantes
- **`babel-jest`**: O projeto está em uma versão muito moderna do Next.js. Embora possua uma configuração de Jest, o Babel pode ser redundante se o SWC puder lidar com os testes, embora a remoção exija uma migração de configuração.

---

## 4. Observações sobre Confiabilidade

### Asserções Não-Nulas
O middleware e várias rotas de API usam `!` para variáveis de ambiente (ex: `process.env.STRIPE_WEBHOOK_SECRET!`).
- **Risco**: Se uma única variável de ambiente estiver faltando, toda a API ou o middleware irá travar ou retornar um erro 500.

---

**Resumo**: O item mais urgente a ser resolvido é a falta de autenticação no endpoint de criação de agendamentos para evitar abusos e sondagem de dados.

