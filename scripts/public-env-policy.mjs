const allowed = new Set(['VITE_NEON_AUTH_URL', 'VITE_NEON_DATA_API_URL']);

// As variáveis automáticas da Vercel não são expostas ao frontend:
// vite.config.ts usa envPrefix somente para os dois endpoints acima.
export function validatePublicEnv(values) {
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('VITE_VERCEL_')) continue;
    if (!allowed.has(key)) {
      throw new Error(`Variável pública não permitida: ${key}. Segredos devem ficar no servidor.`);
    }
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`Endpoint público inválido: ${key}`);
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error(`Endpoint público inválido: ${key}`);
    }
  }
  for (const key of allowed) {
    if (!values[key]) throw new Error(`Configure ${key} no ambiente de build.`);
  }
}
