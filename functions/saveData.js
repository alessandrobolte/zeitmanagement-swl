export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // 🧠 Debug-Log zur Kontrolle (erscheint in Cloudflare-Logs)
    console.log("🔹 Speichere Daten:", body);

    await context.env.ZM_BUCKET.put('data.json', JSON.stringify(body, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error("❌ Fehler beim Speichern:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
