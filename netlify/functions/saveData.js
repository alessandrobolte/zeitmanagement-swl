export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    // 🔍 Validierung
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔍 Pflichtfelder prüfen
    const data = {
      categories: body.categories || [],
      active: body.active || null,
      theme: body.theme || "light",
    };

    // ✅ In KV speichern
    await context.env.ZM_BUCKET.put("data.json", JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ success: true, message: "Data saved successfully ✅" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
