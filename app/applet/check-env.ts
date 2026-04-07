import { loadEnv } from 'vite';
const env = loadEnv('development', process.cwd(), '');
console.log("GEMINI_API_KEY exists:", !!env.GEMINI_API_KEY);
