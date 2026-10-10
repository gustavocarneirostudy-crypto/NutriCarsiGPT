export type ClinicalKind='patient'|'visit';
export function clinicalPayload(kind:ClinicalKind,data:FormData):Record<string,unknown>{
 const result:Record<string,unknown>={};
 const text=(key:string)=>String(data.get(key)??'').trim();
 const date=(key:string)=>{const value=text(key);if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value))throw new Error('Confira as datas informadas.');return value||null};
 const number=(key:string,max:number)=>{const value=text(key);if(!value)return null;const n=Number(value.replace(',','.'));if(!Number.isFinite(n)||n<=0||n>max)throw new Error('Confira as medidas: use valores positivos e dentro de uma faixa válida.');return n};
 if(kind==='patient'){
  if(!text('nome'))throw new Error('Informe o nome do paciente.');
  for(const key of ['nome','email','whatsapp','telefone','sexo','objetivo_texto','medicamentos','observacoes'])result[key]=text(key)||null;
  if(text('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('email')))throw new Error('Informe um email válido.');
  result.data_nascimento=date('data_nascimento');
  if(result.data_nascimento&&String(result.data_nascimento)>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}))throw new Error('A data de nascimento não pode estar no futuro.');
  result.peso_inicial=number('peso_inicial',700);result.altura=number('altura',300);
  for(const key of ['objetivos','patologias','restricoes_alimentares','alergias'])result[key]=text(key)?text(key).split(',').map(v=>v.trim()).filter(Boolean):[];
 }else{
  result.data_consulta=date('data_consulta');if(!result.data_consulta)throw new Error('Informe a data da consulta.');
  result.proximo_retorno=date('proximo_retorno');if(result.proximo_retorno&&String(result.proximo_retorno)<=String(result.data_consulta))throw new Error('O retorno precisa ocorrer depois da consulta.');
  for(const key of ['peso','cintura','quadril','percentual_gordura'])result[key]=number(key,key==='percentual_gordura'?100:700);
  result.observacoes=text('observacoes')||null;
 }
 return result;
}
