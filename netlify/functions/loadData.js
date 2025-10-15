const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

exports.handler = async () => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_FILE = process.env.GITHUB_FILE;

    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
    const res = await fetch(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf8");
    const parsed = JSON.parse(content || "{}");

    // 🔧 Ensure theme always exists
    parsed.theme = parsed.theme || "light";

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("LoadData error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
