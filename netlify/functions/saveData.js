export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    await context.env.ZM_BUCKET.put('data.json', JSON.stringify(body, null, 2));
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
