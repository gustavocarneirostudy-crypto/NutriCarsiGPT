import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicEnv } from './public-env-policy.mjs';

const valid = {
  VITE_NEON_AUTH_URL: 'https://auth.example.com',
  VITE_NEON_DATA_API_URL: 'https://data.example.com',
};

test('aceita somente os dois endpoints HTTPS públicos', () => {
  assert.doesNotThrow(() => validatePublicEnv(valid));
});

test('não bloqueia metadados VITE_VERCEL_ que não entram no frontend', () => {
  assert.doesNotThrow(() => validatePublicEnv({ ...valid, VITE_VERCEL_ENV: 'preview' }));
});

test('impede variáveis públicas adicionais', () => {
  for (const key of ['VITE_DATABASE_URL', 'VITE_NEON_API_KEY', 'VITE_SECRET']) {
    assert.throws(() => validatePublicEnv({ ...valid, [key]: 'secret' }), /Variável pública não permitida/);
  }
});

test('rejeita endpoint obrigatório ausente', () => {
  assert.throws(() => validatePublicEnv({ VITE_NEON_AUTH_URL: valid.VITE_NEON_AUTH_URL }), /VITE_NEON_DATA_API_URL/);
  assert.throws(() => validatePublicEnv({ VITE_NEON_DATA_API_URL: valid.VITE_NEON_DATA_API_URL }), /VITE_NEON_AUTH_URL/);
});

test('rejeita URLs não HTTPS, inválidas ou com credenciais', () => {
  for (const value of [
    'http://auth.example.com',
    'https://user:password@auth.example.com',
    'https://auth.example.com/?token=secret',
    'https://auth.example.com/#secret',
    'not-a-url',
  ]) {
    assert.throws(() => validatePublicEnv({ ...valid, VITE_NEON_AUTH_URL: value }), /Endpoint público inválido/);
  }
});
