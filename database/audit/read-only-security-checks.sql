-- Auditoria SOMENTE DE LEITURA: executar com permissões de inspeção.
-- Não modifica dados, usuários, políticas ou configuração do Neon.
-- Execute no banco alvo após confirmar branch e ambiente.

-- 1. Todas as tabelas da aplicação devem estar com RLS ativo e forçado.
SELECT c.relname AS tabela,
       c.relrowsecurity AS rls_ativo,
       c.relforcerowsecurity AS rls_forcado
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. Leitura e escrita não devem ser concedidas ao papel anônimo.
SELECT c.relname AS tabela,
       has_table_privilege('anonymous', c.oid, 'SELECT') AS anon_select,
       has_table_privilege('anonymous', c.oid, 'INSERT') AS anon_insert,
       has_table_privilege('anonymous', c.oid, 'UPDATE') AS anon_update,
       has_table_privilege('anonymous', c.oid, 'DELETE') AS anon_delete
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 3. Verificar concessões de execução das funções da aplicação.
SELECT p.proname AS funcao,
       has_function_privilege('anonymous', p.oid, 'EXECUTE') AS anon_executa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_executa
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('request_user_id', 'nutricarsi_dashboard', 'sync_nutricionista_from_auth')
ORDER BY p.proname;

-- 4. Contagens agregadas: ajudam a identificar perfis ausentes sem mostrar pessoas.
SELECT (SELECT count(*) FROM neon_auth."user") AS total_usuarios_auth,
       (SELECT count(*) FROM public.nutricionistas) AS total_perfis,
       (SELECT count(*) FROM neon_auth."user" u
        WHERE NOT EXISTS (
          SELECT 1 FROM public.nutricionistas n
          WHERE n.auth_user_id = u.id::text
        )) AS usuarios_sem_perfil;

-- A presença de RLS não substitui testes com duas contas reais em ambiente ISOLADO.
