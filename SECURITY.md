# Segurança e recuperação — NutriCarsi

Este documento descreve verificações de segurança para o projeto. **Não é uma certificação de conformidade com a LGPD.** Não usar dados clínicos reais antes de validar segurança, privacidade, recuperação de dados e responsabilidades legais.

## Controles existentes

- Frontend React/Vite publica somente endpoints HTTPS do Neon Auth e Neon Data API.
- Nenhuma senha, token de administrador ou string de conexão do Postgres deve ter prefixo `VITE_`.
- `.env.local`, chaves e certificados não devem entrar no Git ou no build público.
- O acesso aos pacientes, consultas e planos alimentares depende de autenticação e das políticas de Row Level Security (RLS) do Postgres.
- O GitHub é público: considerar o código, os scripts, os endpoints públicos e o histórico de commits como informação visível a terceiros.

## Verificação local e no pull request

```sh
npm ci
npm run test:security
# Use endpoints HTTPS públicos de teste para compilar; nunca use segredos:
VITE_NEON_AUTH_URL=https://auth.example.com VITE_NEON_DATA_API_URL=https://data.example.com npm run build
```

O workflow `.github/workflows/security-checks.yml` executa essas verificações em pull requests. Os endpoints de exemplo são apenas valores sintaticamente válidos: o build não comprova que o login funciona.

No Neon, rode somente as consultas de leitura em `database/audit/read-only-security-checks.sql` se tiver acesso autorizado. Elas não criam, atualizam nem removem dados.

## Ações que exigem autorização expressa

**Não executar automaticamente na produção:**

1. Ativar proteção da branch principal do Neon ou modificar configurações de acesso à instância.
2. Criar/alterar agendamento de snapshots, executar restauração, excluir branches ou fazer migrações.
3. Alterar RLS, grants, funções, usuários, domínios confiáveis do Neon Auth ou os schemas da Data API.
4. Alterar variáveis de ambiente, permissões ou domínio de produção no Vercel.
5. Mesclar PR em `main` ou publicar uma alteração em produção.

### Plano para backup e teste de restauração

1. Confirmar com o responsável o ambiente Neon, a branch de produção e os custos/limites do plano.
2. Com aprovação, configurar uma política de backups/snapshots compatível com o plano; conferir agendamentos e retenção.
3. Fazer ensaio de restauração **em branch separada**, sem substituir o banco de produção.
4. Validar a estrutura e contagens agregadas, o isolamento RLS e a conectividade com um ambiente de teste.
5. Registrar responsáveis, periodicidade e procedimento de recuperação.

O histórico de recuperação do Neon não substitui uma política de backup com retenção e testes de restauração.

## Validação de isolamento com duas contas

Fazer em ambiente **isolado**, com duas nutricionistas de teste e pacientes fictícios:

- A conta A deve ver somente os pacientes, consultas e planos associados a A.
- A conta B não deve conseguir consultar nem alterar dados associados a A, inclusive usando IDs conhecidos.
- Acesso anônimo deve ser negado às tabelas clínicas.
- O logout deve revogar a sessão no cliente e impedir novos acessos sem autenticação.
- Login, cadastro, recuperação de sessão e sincronização de perfil precisam de testes ponta a ponta.

Não criar pacientes fictícios ou contas adicionais na branch de produção sem aprovação.

## Pendências identificadas em 10/10/2026

- A branch de produção do Neon foi encontrada sem proteção.
- Não havia snapshots listados nem agendamento de snapshots na configuração consultada.
- A base registrou 11 usuários de autenticação e 8 perfis de nutricionistas; três usuários não tinham perfil vinculado. Investigar antes de qualquer correção.
- A configuração efetiva da Data API possui `db_schemas: ['public']`, embora `available_schemas` liste outros schemas; confirmar periodicamente a configuração efetiva.
- Revisar as regras de proteção do GitHub e o histórico do repositório para eventuais segredos antigos.
- Revisar se a política de privacidade, consentimentos, retenção e exclusão de dados atende às necessidades legais do produto.

**Importante:** este PR adiciona controles de código e documentação. Não altera banco, RLS, configuração do Neon, Vercel nem dados de pacientes.
