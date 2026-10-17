import test from 'node:test';
import assert from 'node:assert/strict';
import {clinicalPayload,normalizeClockInput} from '../src/lib/clinical-validation.ts';
const data=values=>{const d=new FormData();for(const [k,v] of Object.entries(values))d.set(k,v);return d};
test('patient trims data, handles decimal comma and preserves optional nulls',()=>{const p=clinicalPayload('patient',data({nome:' Ana Silva ',peso_inicial:'65,5',altura:'165',alergias:'leite, amendoim'}));assert.equal(p.nome,'Ana Silva');assert.equal(p.peso_inicial,65.5);assert.equal(p.email,null);assert.deepEqual(p.alergias,['leite','amendoim']);assert.equal(p.data_nascimento,null)});
test('blank names, future birthdays and invalid measures cannot be saved',()=>{for(const value of [{nome:'  '},{nome:'Ana',data_nascimento:'2999-01-01'},{nome:'Ana',altura:'NaN'},{nome:'Ana',peso_inicial:'-1'},{nome:'Ana',email:'bad@'}])assert.throws(()=>clinicalPayload('patient',data(value)))});
test('consultation rejects impossible dates and returns before or on the visit',()=>{for(const value of [{data_consulta:'2026-02-30'},{data_consulta:'2026-10-10',proximo_retorno:'2026-10-09'},{data_consulta:'2026-10-10',proximo_retorno:'2026-10-10'},{data_consulta:''},{data_consulta:'2026-10-10',percentual_gordura:'101'}])assert.throws(()=>clinicalPayload('visit',data(value)))});
test('visit supports follow-up scheduling and clearing the return on edit',()=>{const p=clinicalPayload('visit',data({data_consulta:'2026-10-10',proximo_retorno:'2026-11-10',peso:'70'}));assert.equal(p.proximo_retorno,'2026-11-10');assert.equal(p.peso,70);assert.equal(clinicalPayload('visit',data({data_consulta:'2026-10-10',proximo_retorno:''})).proximo_retorno,null)});

test('clock values from numeric entry normalize correctly',()=>{
 assert.equal(normalizeClockInput('6'),'06:00');
 assert.equal(normalizeClockInput('630'),'06:30');
 assert.equal(normalizeClockInput('23'),'23:00');
 assert.equal(normalizeClockInput('2230'),'22:30');
 assert.equal(normalizeClockInput('06:30'),'06:30');
 for(const value of ['24','2360','abc','22:91','-6'])assert.equal(normalizeClockInput(value),null);
});
test('new patient form preserves selections, free fields and optional habits',()=>{
 const d=data({nome:' Maria ',nivel_atividade:'Moderadamente ativo',refeicoes_dia:'5',hora_acordar:'630',hora_dormir:'2230',agua_litros:'2.5',pratica_atividade:'true',atividade_descricao:'Corrida, 3 vezes por semana',suplementos:'Vitamina D'});
 d.append('objetivos','Emagrecer');d.append('objetivos','Saúde geral');
 d.set('patologias','Hipertensão');d.set('patologias_outros','Enxaqueca');
 d.set('restricoes_alimentares','Nenhum');
 const p=clinicalPayload('patient',d);
 assert.deepEqual(p.objetivos,['Emagrecer','Saúde geral']);
 assert.deepEqual(p.patologias,['Hipertensão','Enxaqueca']);
 assert.deepEqual(p.restricoes_alimentares,[]);
 assert.equal(p.nivel_atividade,'Moderadamente ativo');
 assert.equal(p.horario_acorda,'06:30');
 assert.equal(p.horario_dorme,'22:30');
 assert.equal(p.litros_agua,2.5);
 assert.equal(p.refeicoes_por_dia,5);
 assert.equal(p.atividade_fisica,true);
 assert.equal(p.atividade_fisica_descricao,'Corrida, 3 vezes por semana');
 assert.equal(p.suplementos,'Vitamina D');
});
test('no physical activity clears activity details and rejects impossible optional habits',()=>{
 const p=clinicalPayload('patient',data({nome:'Patrícia',pratica_atividade:'false',atividade_descricao:'Alguma atividade'}));
 assert.equal(p.atividade_fisica,false);
 assert.equal(p.atividade_fisica_descricao,null);
 for(const invalid of [{hora_acordar:'25'},{hora_dormir:'2460'},{refeicoes_dia:'2.5'},{agua_litros:'-2'},{telefone:'123'}])
  assert.throws(()=>clinicalPayload('patient',data({nome:'Pessoa',...invalid})));
});

test('patient payload uses existing Neon column names without schema changes',()=>{
 const p=clinicalPayload('patient',data({nome:'Pessoa',refeicoes_dia:'4',hora_acordar:'730',hora_dormir:'2200',agua_litros:'1.8',pratica_atividade:'true',atividade_descricao:'Ciclismo'}));
 for(const column of ['refeicoes_por_dia','horario_acorda','horario_dorme','litros_agua','atividade_fisica','atividade_fisica_descricao'])assert.ok(Object.hasOwn(p,column),column);
 for(const legacy of ['refeicoes_dia','hora_acordar','hora_dormir','agua_litros','pratica_atividade','atividade_descricao'])assert.ok(!Object.hasOwn(p,legacy),legacy);
});
