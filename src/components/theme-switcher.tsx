import {useEffect,useRef,useState} from 'react';
import {Check,Monitor, Moon, Sun} from 'lucide-react';
import {parseThemeMode,resolveTheme,THEME_STORAGE_KEY,type ThemeMode} from '../lib/theme';

function readPreference():ThemeMode{
 try{return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY))}
 catch{return 'system'}
}
const choices:{value:ThemeMode;label:string;description:string;icon:typeof Sun}[]=[
 {value:'light',label:'Claro',description:'Visual iluminado',icon:Sun},
 {value:'dark',label:'Escuro',description:'Conforto à noite',icon:Moon},
 {value:'system',label:'Automático',description:'Acompanha o dispositivo',icon:Monitor}
];

/** Reusable selector for auth and authenticated workspaces. */
export function ThemeSwitcher(){
 const [mode,setMode]=useState<ThemeMode>(readPreference);
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const Icon=mode==='light'?Sun:mode==='dark'?Moon:Monitor;

 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const apply=()=>{
   const selected=resolveTheme(mode,media.matches);
   document.documentElement.dataset.theme=selected;
   document.documentElement.style.colorScheme=selected;
   document.querySelector('meta[name="theme-color"]')?.setAttribute('content',selected==='dark'?'#111b16':'#ffffff');
  };
  apply();
  media.addEventListener?.('change',apply);
  return()=>media.removeEventListener?.('change',apply);
 },[mode]);

 useEffect(()=>{
  const onStorage=(event:StorageEvent)=>{
   if(event.key===THEME_STORAGE_KEY||event.key===null)setMode(readPreference());
  };
  window.addEventListener('storage',onStorage);
  return()=>window.removeEventListener('storage',onStorage);
 },[]);

 useEffect(()=>{
  if(!open)return;
  const onPointer=(event:PointerEvent)=>{
   if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);
  };
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){setOpen(false);root.current?.querySelector('button')?.focus()}
  };
  document.addEventListener('pointerdown',onPointer);
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)};
 },[open]);

 function select(next:ThemeMode){
  setMode(next);setOpen(false);
  try{window.localStorage.setItem(THEME_STORAGE_KEY,next)}catch{/* theme still works in this tab */}
 }
 return <div className="theme-switcher" ref={root}>
  <button type="button" className="theme-trigger" title="Escolher aparência" aria-label={'Aparência: '+(choices.find(c=>c.value===mode)?.label??'Automático')+'. Alterar tema'} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Icon size={17} aria-hidden="true"/><span className="theme-trigger-label">Tema</span></button>
  {open&&<div className="theme-popover" role="group" aria-label="Modo de aparência">
   <p className="theme-popover-title">Aparência</p>
   {choices.map(({value,label,description,icon:OptionIcon})=><button key={value} type="button" aria-pressed={mode===value} className={'theme-option'+(mode===value?' selected':'')} onClick={()=>select(value)}>
    <span className="theme-option-icon"><OptionIcon size={18}/></span><span className="theme-option-text"><strong>{label}</strong><small>{description}</small></span>{mode===value&&<Check size={17} className="theme-check"/>}
   </button>)}
  </div>}
 </div>;
}
