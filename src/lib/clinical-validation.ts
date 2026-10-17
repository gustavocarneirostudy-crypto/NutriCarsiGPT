export type ClinicalKind='patient'|'visit';

/** Converts 6 -> 06:00, 630 -> 06:30 and 2230 -> 22:30. Returns null for invalid times. */
export function normalizeClockInput(input:string):string|null{
 const text=input.trim();
 if(!text)return null;
 let h:number,m:number;
 if(/^\d{1,2}:\d{2}$/.test(text)){
  const parts=text.split(':').map(Number);[h,m]=parts;
 }else if(/^\d{1,4}$/.test(text)){
  if(text.length<=2){h=Number(text);m=0}
  else{h=Number(text.slice(0,-2));m=Number(text.slice(-2))}
 }else{return null}
 if(h>23||m>59)return null;
 return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
}
export function clinicalPayload(kind:ClinicalKind,data:FormData):Record<string,unknown>{
 const result:Record<string,unknown>={};
 const text=(key:string)=>String(data.get(key)??'').trim();
 const date=(key:string)=>{const value=text(key);if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value))throw new Error('Confira as datas informadas.');return value||null};
 const number=(key:string,max:number,allowZero=false)=>{const value=text(key);if(!value)return null;const n=Number(value.replace(',','.'));if(!Number.isFinite(n)||(allowZero?n<0:n<=0)||n>max)throw new Error('Confira as medidas: use valores válidos e dentro de uma faixa permitida.');return n};
 const list=(key:string)=>{
  const values=data.getAll(key).map(v=>String(v).trim()).flatMap(v=>v.split(',')).map(v=>v.trim()).filter(Boolean);
  if(values.includes('Nenhum'))return [];
  const extra=text(key+'_outros');
  if(extra)values.push(...extra.split(',').map(v=>v.trim()).filter(Boolean));
  return [...new Set(values)];
 };
 if(kind==='patient'){
  if(!text('nome'))throw new Error('Informe o nome completo do paciente.');
  for(const key of ['nome','email','whatsapp','telefone','sexo','objetivo_texto','medicamentos','observacoes'])result[key]=text(key)||null;
  if(text('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('email')))throw new Error('Informe um email válido.');
  for(const key of ['whatsapp','telefone']){
   const value=text(key);
   if(value&&![10,11].includes(value.replace(/\D/g,'').length))throw new Error('Confira o número de '+(key==='whatsapp'?'WhatsApp':'telefone')+'.');
  }
  result.data_nascimento=date('data_nascimento');
  if(result.data_nascimento&&String(result.data_nascimento)>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))throw new Error('A data de nascimento não pode estar no futuro.');
  result.peso_inicial=number('peso_inicial',700);result.altura=number('altura',300);
  for(const key of ['objetivos','patologias','restricoes_alimentares','alergias'])result[key]=list(key);
  // Fields introduced in Prompt 4: only include fields supplied by the new form,
  // so editing a legacy record from the existing modal never erases habit data.
  for(const key of ['nivel_atividade','suplementos']){
   if(data.has(key))result[key]=text(key)||null;
  }
  if(data.has('refeicoes_dia')){
   const value=number('refeicoes_dia',30,true);
   if(value!==null&&!Number.isInteger(value))throw new Error('O número de refeições deve ser inteiro.');
   result.refeicoes_dia=value;
  }
  if(data.has('agua_litros'))result.agua_litros=number('agua_litros',40,true);
  for(const key of ['hora_acordar','hora_dormir']){
   if(data.has(key)){
    const raw=text(key),time=raw?normalizeClockInput(raw):null;
    if(raw&&!time)throw new Error('Confira o horário informado: use 6, 630, 2230 ou HH:MM.');
    result[key]=time;
   }
  }
  if(data.has('pratica_atividade')){
   const raw=text('pratica_atividade');
   if(raw&&!['true','false'].includes(raw))throw new Error('Confira a opção de atividade física.');
   result.pratica_atividade=raw?raw==='true':null;
   result.atividade_descricao=raw==='true'?text('atividade_descricao')||null:null;
  }
 }else{
  result.data_consulta=date('data_consulta');if(!result.data_consulta)throw new Error('Informe a data da consulta.');
  result.proximo_retorno=date('proximo_retorno');if(result.proximo_retorno&&String(result.proximo_retorno)<=String(result.data_consulta))throw new Error('O retorno precisa ocorrer depois da consulta.');
  for(const key of ['peso','cintura','quadril','percentual_gordura'])result[key]=number(key,key==='percentual_gordura'?100:700);
  result.observacoes=text('observacoes')||null;
 }
 return result;
}
