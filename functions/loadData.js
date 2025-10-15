export async function onRequestGet(context) {
  try {
    const dataFile = await context.env.ZM_BUCKET.get('data.json', { type: 'json' });
    return new Response(JSON.stringify(dataFile || {}), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
