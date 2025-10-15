import { onRequestGet as loadData } from './loadData.js';
import { onRequestPost as saveData } from './saveData.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.endsWith('/functions/loadData')) return loadData(context);
  if (url.pathname.endsWith('/functions/saveData')) return saveData(context);
  return new Response('Not found', { status: 404 });
}
