import {loadEnv} from 'vite';
const allowed=new Set(['VITE_NEON_AUTH_URL','VITE_NEON_DATA_API_URL']);
const values={...loadEnv('production',process.cwd(),'VITE_'),...Object.fromEntries(Object.entries(process.env).filter(([key])=>key.startsWith('VITE_')))};
for(const [key,value] of Object.entries(values)){
 // Vercel system metadata is excluded by the explicit Vite envPrefix.
 if(key.startsWith('VITE_VERCEL_'))continue;
 if(!allowed.has(key))throw new Error(`Variável pública não permitida: ${key}. Segredos devem ficar no servidor.`);
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error(`Endpoint público inválido: ${key}`);
}
for(const key of allowed)if(!values[key])throw new Error(`Configure ${key} no ambiente de build.`);
console.log('Variáveis do frontend verificadas: somente os dois endpoints públicos permitidos.');
