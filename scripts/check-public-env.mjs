import { loadEnv } from 'vite';
import { validatePublicEnv } from './public-env-policy.mjs';

const values = {
  ...loadEnv('production', process.cwd(), 'VITE_'),
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))),
};

validatePublicEnv(values);
console.log('Variáveis do frontend verificadas: somente os dois endpoints públicos permitidos.');
