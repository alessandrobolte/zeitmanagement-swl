export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 🔹 loadData ---
    if (url.pathname === "/functions/loadData") {
      try {
        const data = await env.ZM_BUCKET.get("data.json", { type: "json" });
        return new Response(JSON.stringify(data || {}), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // --- 🔹 saveData ---
    if (url.pathname === "/functions/saveData") {
      try {
        const body = await request.json();
        await env.ZM_BUCKET.put("data.json", JSON.stringify(body, null, 2));
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // --- 🔹 alle anderen Requests → index.html ---
    return env.ASSETS.fetch(request);
  },
};
