-- Prompt 4: campos complementares do cadastro de pacientes.
-- Aplicar no projeto Neon do SistemaNutri, após validação da prévia.
-- Não altera nem remove registros existentes; todos os novos campos são opcionais.
-- O campo nutricionista_id e as políticas RLS existentes permanecem intactos.
BEGIN;

ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS nivel_atividade text,
  ADD COLUMN IF NOT EXISTS suplementos text,
  ADD COLUMN IF NOT EXISTS refeicoes_dia smallint,
  ADD COLUMN IF NOT EXISTS hora_acordar time without time zone,
  ADD COLUMN IF NOT EXISTS hora_dormir time without time zone,
  ADD COLUMN IF NOT EXISTS agua_litros numeric(5,2),
  ADD COLUMN IF NOT EXISTS pratica_atividade boolean,
  ADD COLUMN IF NOT EXISTS atividade_descricao text;

CREATE INDEX IF NOT EXISTS consultas_paciente_data_desc_idx
  ON public.consultas (paciente_id, data_consulta DESC);

COMMIT;

-- Verificações recomendadas após aplicação (sem ler dados clínicos):
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pacientes'
--   AND column_name IN ('nivel_atividade','suplementos','refeicoes_dia',
--   'hora_acordar','hora_dormir','agua_litros','pratica_atividade','atividade_descricao');
-- Confirmar RLS em pacientes e consultas e as policies por nutricionista_id.
