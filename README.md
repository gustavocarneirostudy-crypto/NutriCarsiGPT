# SistemaNutri CarsiGPT — NutriCarsi

React + Vite + TypeScript, Tailwind CSS e componentes shadcn/ui (Button e Input).

## Executar

```sh
npm ci
npm run dev
```

`npm run build` verifica TypeScript e gera `dist`.

## Rotas

- `/login`: email, senha e sessão persistente.
- `/cadastro`: nome, email, senha e confirmação.
- `/dashboard`: perfil e contagens reais dos registros visíveis por RLS.

Os endpoints HTTPS públicos de Neon Auth e Data API são carregados de `.env.local` pelas variáveis `VITE_NEON_AUTH_URL` e `VITE_NEON_DATA_API_URL`. Copie `.env.example` para `.env.local` e informe os endpoints do projeto antes de executar ou compilar. O Vite incorpora esses endpoints públicos no build; `.env.local` não é enviado ao repositório. Nenhuma senha de banco ou chave administrativa é enviada ao navegador. O SDK gerencia a sessão; o login usa `rememberMe: true`. O isolamento dos registros é aplicado no banco através de RLS.

O servidor Neon Auth exige no mínimo **8 caracteres**, apesar do requisito inicial de 6. A interface informa e valida o limite do servidor.

Após autenticar, o perfil é salvo por `upsert` com conflito em `auth_user_id`. Se essa etapa falhar, a sessão permanece válida e o dashboard mostra uma mensagem com opção de tentar novamente. Atualizar a página também tenta sincronizar o perfil novamente.

A função `public.request_user_id()` permite avaliar a identificação da requisição nas policies sem conceder acesso amplo ao schema gerenciado `auth`. É uma função SQL estável com `SECURITY DEFINER`, caminho de busca fixo e execução restrita ao papel `authenticated`; não consulta tabelas nem aceita parâmetros.

Os componentes não armazenam senha nem tokens manualmente. A proteção visual das rotas complementa, mas não substitui, as policies do banco.

## Validação

- Compilação TypeScript e build Vite.
- Cadastro real em Neon Auth com contas temporárias de teste.
- Sessão e token JWT reais.
- Gravação e leitura do perfil pela Data API.
- Isolamento entre duas contas e recusa de acesso sem autenticação.
- Verificação do limite de senha do servidor.

A publicação inicial é privada. Para receber outras nutricionistas, altere o compartilhamento do site de acordo com a audiência desejada.

## Dashboard principal

- `/dashboard`: total de pacientes cadastrados; consultas com data de segunda a domingo da semana corrente em America/Sao_Paulo; pacientes cuja última consulta realizada ocorreu há mais de 30 dias, sem `proximo_retorno` a partir de hoje e sem consulta futura. Pacientes sem consulta anterior não entram nessa lista.
- `/pacientes`: listagem paginada, com 20 pacientes por página.
- `/pacientes/:id`: perfil e histórico, somente quando o cadastro é visível por RLS.
- A função `nutricarsi_dashboard()` é SECURITY INVOKER, executável por authenticated, com filtros explícitos da nutricionista e RLS como segunda camada. Não recebe um ID de usuário do navegador.
- Os dados são consultados ao abrir a tela, ao voltar à aba, ao atualizar manualmente e a cada 15 segundos enquanto a aba estiver visível. Isso é atualização periódica, sem canal de push/WebSocket.
- A base atual não tem campo de status ativo/inativo; o total segue o requisito de contar todos os pacientes cadastrados pela nutricionista.

Validação das datas: 31 dias entra; exatamente 30 dias não entra; retorno vencido entra; retorno futuro ou consulta futura exclui; segunda e domingo pertencem à semana.

## GitHub e Vercel

Arquivos `.env`, `.env.*` (exceto `.env.example`), certificados e `.vercel` estão excluídos do Git. Não versionar segredos nem enviar credenciais no chat. `.vercelignore` também impede o upload de ambientes locais pelo CLI.

Importe o repositório `gustavocarneirostudy-crypto/NutriCarsiGPT` na Vercel, preset Vite, build `npm run build`, saída `dist`. Configure `VITE_NEON_AUTH_URL` e `VITE_NEON_DATA_API_URL` nas Environment Variables da Vercel antes do build. São endpoints públicos, visíveis no navegador; não são chaves administrativas. O prebuild rejeita outras variáveis VITE_ e endpoints com credenciais. Nunca configure DATABASE_URL, NEON_API_KEY ou tokens de administração como VITE_.

Adicione a origem HTTPS exata do domínio Vercel aos trusted origins do Neon Auth antes de testar cadastro/login. Não liberar wildcard de todos os domínios Vercel. Para previews, use um ambiente Neon isolado e suas origens explícitas. Preserve as policies RLS do banco.

Rotas de login, dashboard e pacientes têm fallback para index.html na Vercel. Após publicar, validar acesso direto e atualização dessas rotas, cadastro/login e isolamento de dados.
