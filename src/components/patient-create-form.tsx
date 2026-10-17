import {useRef,useState,type FormEvent,type ReactNode} from 'react';
import {ArrowLeft,ArrowRight,CheckCircle2,ChevronLeft,Droplets,HeartPulse,LoaderCircle,Save,UserRound} from 'lucide-react';
import {clinicalPayload,normalizeClockInput} from '../lib/clinical-validation';
import {Button} from './ui/button';

type Props={initial?:Record<string,unknown>;onCancel:()=>void;onSave:(values:Record<string,unknown>)=>Promise<void>};
type Step='pessoal'|'clinico'|'habitos';
const steps:{key:Step;title:string;description:string}[]=[
 {key:'pessoal',title:'Pessoal',description:'Identificação e contato'},
 {key:'clinico',title:'Clínico',description:'Objetivos e saúde'},
 {key:'habitos',title:'Hábitos',description:'Rotina e estilo de vida'}
];
const objectives=['Emagrecer','Ganhar massa','Controlar diabetes','Saúde geral','Performance esportiva','Reeducação alimentar'];
const conditions=['Diabetes','Hipertensão','Hipotireoidismo','Hipertireoidismo','Síndrome do ovário policístico','Doença celíaca','Colesterol alto'];
const restrictions=['Lactose','Glúten','Açúcar','Carne vermelha','Frutos do mar'];
const allergies=['Amendoim','Leite','Ovo','Soja','Trigo','Frutos do mar'];

function phoneMask(value:string){
 const digits=value.replace(/\D/g,'').slice(0,11);
 if(digits.length<=2)return digits?'('+digits:'';
 if(digits.length<=6)return '('+digits.slice(0,2)+') '+digits.slice(2);
 if(digits.length<=10)return '('+digits.slice(0,2)+') '+digits.slice(2,6)+'-'+digits.slice(6);
 return '('+digits.slice(0,2)+') '+digits.slice(2,7)+'-'+digits.slice(7);
}
function ageFromDate(value:string){
 if(!value)return null;
 const [year,month,day]=value.split('-').map(Number);
 const now=new Date(),age=now.getFullYear()-year-(now.getMonth()+1<month||(now.getMonth()+1===month&&now.getDate()<day)?1:0);
 return Number.isFinite(age)&&age>=0&&age<130?age:null;
}
function Choices({label,name,options,allowNone=false,initial}: {label:string;name:string;options:string[];allowNone?:boolean;initial?:unknown}){
 const existing=Array.isArray(initial)?initial.map(String):[];
 const [selected,setSelected]=useState<string[]>(existing.filter(v=>options.includes(v)));
 const [extra,setExtra]=useState(existing.filter(v=>!options.includes(v)&&v!=='Nenhum').join(', '));
 const none=selected.includes('Nenhum');
 function toggle(value:string){
  setSelected(previous=>value==='Nenhum'?(previous.includes('Nenhum')?[]:['Nenhum']):previous.includes(value)?previous.filter(v=>v!==value):[...previous.filter(v=>v!=='Nenhum'),value]);
 }
 return <fieldset className="patient-choice-group"><legend>{label}</legend><div className="patient-chips">{[...options,...(allowNone?['Nenhum']:[])].map(option=><label key={option} className={'patient-chip '+(selected.includes(option)?'selected':'')}><input type="checkbox" name={name} value={option} checked={selected.includes(option)} onChange={()=>toggle(option)}/><span>{option}</span></label>)}</div><label className="patient-field other-field" htmlFor={'extra-'+name}><span>Outros / observações sobre {label.toLowerCase()}</span><input id={'extra-'+name} name={name+'_outros'} type="text" placeholder="Adicione outras informações" maxLength={1500} value={extra} onChange={e=>setExtra(e.target.value)} disabled={none}/></label></fieldset>;
}
function Field({label,children,hint}: {label:string;children:ReactNode;hint?:string}){
 return <div className="patient-field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</div>;
}
export function PatientCreateForm({initial,onCancel,onSave}:Props){
 const editing=Boolean(initial?.id);
 const field=(key:string)=>String(initial?.[key]??'');
 const formRef=useRef<HTMLFormElement>(null);
 const pending=useRef(false);
 const nameRef=useRef<HTMLInputElement>(null);
 const [active,setActive]=useState<Step>('pessoal'),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [birth,setBirth]=useState(field('data_nascimento')),[weight,setWeight]=useState(field('peso_inicial')),[height,setHeight]=useState(field('altura'));
 const [phone,setPhone]=useState(phoneMask(field('telefone'))),[whatsapp,setWhatsapp]=useState(phoneMask(field('whatsapp'))),[practice,setPractice]=useState(initial?.atividade_fisica===true?'true':initial?.atividade_fisica===false?'false':'');
 const age=ageFromDate(birth);
 const bmi=Number(weight.replace(',','.'))>0&&Number(height.replace(',','.'))>0
  ?Number(weight.replace(',','.'))/Math.pow(Number(height.replace(',','.'))/100,2):null;
 const idx=steps.findIndex(s=>s.key===active);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(pending.current)return;
  pending.current=true;setError('');
  try{
   const values=clinicalPayload('patient',new FormData(e.currentTarget));
   setSaving(true);await onSave(values);
  }catch(e){
   const message=e instanceof Error?e.message:'Não foi possível salvar o paciente.';
   setError(message);
   if(/nome|email|telefone|whatsapp|nascimento/i.test(message)){
     setActive('pessoal');
     if(/nome/i.test(message))requestAnimationFrame(()=>nameRef.current?.focus());
    }else if(/medida|peso|altura/i.test(message))setActive('clinico');
    else if(/horário|refeições|água/i.test(message))setActive('habitos');
  }finally{setSaving(false);pending.current=false}
 }
 return <section className="patient-create-view">
  <div className="patient-form-heading">
   <button type="button" className="patient-form-back" onClick={onCancel}><ChevronLeft size={18}/>{editing?'Voltar para o perfil':'Voltar para pacientes'}</button>
   <div className="patient-form-title"><div><p className="workspace-kicker">{editing?'DADOS DO PACIENTE':'NOVO CADASTRO'}</p><h2>{editing?'Editar paciente':'Novo paciente'}<span>.</span></h2><p>{editing?'Atualize os dados em qualquer aba. As informações anteriores estão preenchidas.':'Registre os dados no seu ritmo. Apenas o nome completo é obrigatório.'}</p></div><div className="patient-form-badge"><UserRound size={24}/></div></div>
  </div>
  <form ref={formRef} className="patient-registration" onSubmit={submit} noValidate>
   <nav className="patient-form-tabs" aria-label="Etapas do cadastro">{steps.map((step,i)=><button type="button" key={step.key} className={'patient-form-tab '+(active===step.key?'active':'')} onClick={()=>{setActive(step.key);setError('')}} aria-current={active===step.key?'step':undefined}><span className="patient-tab-number">{i+1}</span><span><strong>{step.title}</strong><small>{step.description}</small></span></button>)}</nav>
   <div className="patient-form-content">
    <section hidden={active!=='pessoal'} aria-label="Dados pessoais">
     <div className="patient-section-heading"><UserRound size={20}/><div><h3>Informações pessoais</h3><p>Identificação e formas de contato</p></div></div>
     <div className="patient-form-grid">
      <label className="patient-field patient-span-full" htmlFor="patient-name"><span>Nome completo <b>*</b></span><input ref={nameRef} autoComplete="name" id="patient-name" name="nome" type="text" placeholder="Nome e sobrenome" maxLength={150} required defaultValue={field('nome')}/></label>
      <label className="patient-field" htmlFor="patient-birth"><span>Data de nascimento</span><input id="patient-birth" name="data_nascimento" type="date" value={birth} max={new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})} onChange={e=>setBirth(e.target.value)}/></label>
      <Field label="Idade calculada"><output className="patient-output">{age===null?'—':age+' anos'}</output></Field>
      <label className="patient-field" htmlFor="patient-sex"><span>Sexo</span><select id="patient-sex" name="sexo" defaultValue=""><option value="">Selecione (opcional)</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></label>
      <label className="patient-field" htmlFor="patient-phone"><span>Telefone</span><input id="patient-phone" name="telefone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="(11) 99999-9999" value={phone} onChange={e=>setPhone(phoneMask(e.target.value))}/></label>
      <label className="patient-field" htmlFor="patient-whatsapp"><span>WhatsApp</span><input id="patient-whatsapp" name="whatsapp" type="tel" inputMode="numeric" placeholder="(11) 99999-9999" value={whatsapp} onChange={e=>setWhatsapp(phoneMask(e.target.value))}/></label>
      <label className="patient-field" htmlFor="patient-email"><span>Email</span><input id="patient-email" name="email" type="email" autoComplete="email" maxLength={250} placeholder="paciente@exemplo.com"/></label>
     </div>
    </section>
    <section hidden={active!=='clinico'} aria-label="Dados clínicos">
     <div className="patient-section-heading"><HeartPulse size={20}/><div><h3>Informações clínicas</h3><p>Dados para acompanhamento nutricional</p></div></div>
     <div className="patient-form-grid">
      <label className="patient-field" htmlFor="patient-weight"><span>Peso atual</span><div className="patient-unit"><input id="patient-weight" name="peso_inicial" type="number" min="0.01" max="700" step="0.01" placeholder="65,5" value={weight} onChange={e=>setWeight(e.target.value)}/><span>kg</span></div></label>
      <label className="patient-field" htmlFor="patient-height"><span>Altura</span><div className="patient-unit"><input id="patient-height" name="altura" type="number" min="0.01" max="300" step="0.1" placeholder="165" value={height} onChange={e=>setHeight(e.target.value)}/><span>cm</span></div></label>
      <Field label="IMC (calculado automaticamente)"><output className="patient-output">{bmi!==null&&Number.isFinite(bmi)?bmi.toFixed(1)+' kg/m²':'—'}</output></Field>
      <label className="patient-field" htmlFor="patient-activity-level"><span>Nível de atividade física</span><select id="patient-activity-level" name="nivel_atividade" defaultValue=""><option value="">Selecione (opcional)</option>{['Sedentário','Levemente ativo','Moderadamente ativo','Muito ativo','Extremamente ativo'].map(x=><option key={x}>{x}</option>)}</select></label>
     </div>
     <Choices label="Objetivo" name="objetivos" options={objectives}/>
     <label className="patient-field patient-standalone" htmlFor="patient-goal-extra"><span>Objetivo adicional / descrição</span><textarea id="patient-goal-extra" name="objetivo_texto" rows={2} placeholder="Descreva outros objetivos ou detalhes" maxLength={2000}/></label>
     <Choices label="Patologias e condições de saúde" name="patologias" options={conditions} allowNone/>
     <Choices label="Restrições alimentares" name="restricoes_alimentares" options={restrictions} allowNone/>
     <Choices label="Alergias alimentares" name="alergias" options={allergies} allowNone/>
     <div className="patient-form-grid">
      <label className="patient-field" htmlFor="patient-meds"><span>Medicamentos contínuos</span><textarea id="patient-meds" name="medicamentos" rows={3} placeholder="Medicamentos em uso" maxLength={2000}/></label>
      <label className="patient-field" htmlFor="patient-supplements"><span>Suplementos em uso</span><textarea id="patient-supplements" name="suplementos" rows={3} placeholder="Suplementos, se houver" maxLength={2000}/></label>
     </div>
    </section>
    <section hidden={active!=='habitos'} aria-label="Hábitos e rotina">
     <div className="patient-section-heading"><Droplets size={20}/><div><h3>Hábitos e rotina</h3><p>O dia a dia do paciente</p></div></div>
     <div className="patient-form-grid">
      <label className="patient-field" htmlFor="patient-meals"><span>Refeições por dia</span><input id="patient-meals" name="refeicoes_dia" type="number" min="0" max="30" step="1" placeholder="Ex.: 5"/></label>
      <label className="patient-field" htmlFor="patient-water"><span>Água por dia</span><div className="patient-unit"><input id="patient-water" name="agua_litros" type="number" min="0" max="40" step="0.1" placeholder="Ex.: 2"/><span>litros</span></div></label>
      <label className="patient-field" htmlFor="patient-wake"><span>Horário que acorda</span><input id="patient-wake" name="hora_acordar" type="text" inputMode="numeric" maxLength={5} placeholder="Ex.: 630 → 06:30" onBlur={e=>{const normalized=normalizeClockInput(e.currentTarget.value);if(normalized)e.currentTarget.value=normalized}}/></label>
      <label className="patient-field" htmlFor="patient-sleep"><span>Horário que dorme</span><input id="patient-sleep" name="hora_dormir" type="text" inputMode="numeric" maxLength={5} placeholder="Ex.: 2230 → 22:30" onBlur={e=>{const normalized=normalizeClockInput(e.currentTarget.value);if(normalized)e.currentTarget.value=normalized}}/></label>
      <label className="patient-field" htmlFor="patient-practice"><span>Pratica atividade física?</span><select id="patient-practice" name="pratica_atividade" value={practice} onChange={e=>setPractice(e.target.value)}><option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option></select></label>
      {practice==='true'&&<label className="patient-field" htmlFor="patient-practice-info"><span>Qual atividade e frequência semanal?</span><input id="patient-practice-info" name="atividade_descricao" placeholder="Ex.: caminhada, 3 vezes por semana" maxLength={2000}/></label>}
      <label className="patient-field patient-span-full" htmlFor="patient-notes"><span>Observações gerais</span><textarea id="patient-notes" name="observacoes" rows={4} placeholder="Outras informações relevantes para o atendimento" maxLength={10000}/></label>
     </div>
    </section>
   </div>
   {error&&<div className="error patient-form-error" role="alert">{error}</div>}
   <footer className="patient-form-footer"><div className="patient-form-progress"><CheckCircle2 size={16}/>Campos opcionais podem ser preenchidos depois</div><div className="patient-form-actions"><Button type="button" variant="outline" onClick={idx===0?onCancel:()=>{setActive(steps[idx-1].key);setError('')}} disabled={saving}>{idx===0?<><ArrowLeft size={15}/>Cancelar</>:<><ArrowLeft size={15}/>Anterior</>}</Button>{idx<2&&<Button type="button" className="primary-action" onClick={()=>{setActive(steps[idx+1].key);setError('')}} disabled={saving}>Próxima aba<ArrowRight size={16}/></Button>}<Button className="primary-action" type="submit" disabled={saving}>{saving?<><LoaderCircle size={16} className="spin"/>Salvando…</>:<><Save size={16}/>{editing?'Salvar alterações':'Salvar paciente'}</>}</Button></div></footer>
  </form>
 </section>;
}
