/**
 * AssemblyFlow API Configuration
 *
 * In local development or single-service deployment, API_BASE_URL is empty
 * and API requests route through the relative '/api' path (via Vite proxy in dev,
 * or directly to the Express server in production).
 *
 * For split deployments (e.g. Frontend on Vercel/Netlify, Backend on Render/Railway),
 * set the VITE_API_BASE_URL environment variable (e.g. 'https://assemblyflow-api.onrender.com').
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
