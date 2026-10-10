CREATE FUNCTION public.nutricarsi_dashboard() RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog, public AS $body$
WITH dates AS (
 SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS today,
 date_trunc('week',now() AT TIME ZONE 'America/Sao_Paulo')::date AS week_start
), owned_patients AS (
 SELECT p.id,p.nome FROM public.pacientes p JOIN public.nutricionistas n ON n.id=p.nutricionista_id WHERE n.auth_user_id=(SELECT public.request_user_id())
), owned_consultations AS (
 SELECT c.* FROM public.consultas c JOIN owned_patients p ON p.id=c.paciente_id
), last_visits AS (
 SELECT paciente_id,max(data_consulta) AS last_visit FROM owned_consultations,dates WHERE data_consulta<=dates.today GROUP BY paciente_id
), overdue AS (
 SELECT p.id,p.nome,l.last_visit FROM owned_patients p JOIN last_visits l ON l.paciente_id=p.id CROSS JOIN dates d
 WHERE l.last_visit<d.today-30
 AND NOT EXISTS (SELECT 1 FROM owned_consultations c WHERE c.paciente_id=p.id AND (c.proximo_retorno>=d.today OR c.data_consulta>d.today))
)
SELECT jsonb_build_object(
 'total_patients',(SELECT count(*) FROM owned_patients),
 'week_consultations',(SELECT count(*) FROM owned_consultations c CROSS JOIN dates d WHERE c.data_consulta>=d.week_start AND c.data_consulta<d.week_start+7),
 'week_start',(SELECT week_start FROM dates),
 'week_end',(SELECT week_start+6 FROM dates),
 'overdue_patients',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome,'last_visit',last_visit) ORDER BY last_visit,nome) FROM overdue),'[]'::jsonb)
)
$body$;
REVOKE ALL ON FUNCTION public.nutricarsi_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nutricarsi_dashboard() TO authenticated;

