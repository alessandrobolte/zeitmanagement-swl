const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async (event) => {
  console.log("📤 saveData invoked");

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_FILE = process.env.GITHUB_FILE;

    if (!GITHUB_TOKEN || !GITHUB_REPO || !GITHUB_FILE) {
      console.error("❌ Missing required environment variables");
      return { statusCode: 500, body: "Missing environment variables" };
    }

    const body = JSON.parse(event.body || "{}");
    console.log("📦 Incoming data:", body);

    const payload = {
      categories: body.categories || [],
      active: body.active || null,
      theme: body.theme || "light",
    };

    // Hole aktuelle Datei, um SHA zu bekommen
    const fileUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
    const res = await fetch(fileUrl, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    if (!res.ok) {
      console.error("❌ Fehler beim Lesen der Datei:", res.status, await res.text());
      return { statusCode: 500, body: "GitHub read error" };
    }

    const json = await res.json();
    const sha = json.sha;

    // Schreibe aktualisierte Datei
    const update = await fetch(fileUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "🔄 Zeitmanagement: Daten gespeichert",
        content: Buffer.from(JSON.stringify(payload, null, 2)).toString("base64"),
        sha,
      }),
    });

    if (!update.ok) {
      const errText = await update.text();
      console.error("❌ Fehler beim Schreiben:", update.status, errText);
      return { statusCode: 500, body: `GitHub update error: ${errText}` };
    }

    console.log("✅ Erfolgreich gespeichert:", payload.theme);
    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("💥 saveData Exception:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
