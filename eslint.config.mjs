import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  { // Deno Edge Functions: a different runtime, type-checked by the Supabase CLI.
  ignores: ['.next/**', 'out/**', 'node_modules/**', 'supabase/**'] },
];

export default config;
