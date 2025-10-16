const users = [
  { username: "admin", password: "Stadtwerke1", displayName: "Projektleiter", role: "admin" },
  { username: "alessandro", password: "Stadtwerke1", displayName: "Alessandro Bolte", role: "user" },
  { username: "michael", password: "Stadtwerke1", displayName: "Michael Teuber", role: "user" },
  { username: "dominik", password: "Stadtwerke1", displayName: "Dominik Schulte", role: "user" },
  { username: "christiane", password: "Stadtwerke1", displayName: "Christiane Kuhlemann", role: "user" },
  { username: "kati", password: "Stadtwerke1", displayName: "Kati Kretzschmar", role: "user" },
  { username: "fabian", password: "Stadtwerke1", displayName: "Fabian Brinkmann", role: "user" },
  { username: "denise", password: "Stadtwerke1", displayName: "Denise Carnovale", role: "user" },
  { username: "philip", password: "Stadtwerke1", displayName: "Philip Rolf", role: "user" },
  { username: "marcel", password: "Stadtwerke1", displayName: "Marcel Sander", role: "user" },
  { username: "yannik", password: "Stadtwerke1", displayName: "Yannik Siebert", role: "user" }
];
export async function initKV(kv) {
  for (const user of users) {
    // Salt generieren
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();

    // Passwort über PBKDF2 + SHA-256 hashen
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(user.password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hash = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    const saltStr = btoa(String.fromCharCode(...salt));

    // Userdaten in KV speichern
    await kv.put(`user:${user.username}`, JSON.stringify({
      username: user.username,
      passwordHash: hash,
      salt: saltStr,
      displayName: user.displayName,
      role: user.role,
      categories: { "LemGOesHANA": { immutable: true, entries: [] } },
      mustChangePassword: true
    }));
  }
}
// Login-Funktion
export async function handleLogin(request, kv) {
  const { username, password } = await request.json();
  const data = await kv.get(`user:${username}`, { type: "json" });

  if (!data) return new Response("User not found", { status: 404 });

  // Passwort überprüfen
  const saltBytes = Uint8Array.from(atob(data.salt), c => c.charCodeAt(0));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const hash = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

  if (hash !== data.passwordHash) return new Response("Invalid password", { status: 401 });

  // Token erstellen (einfacher HMAC-Token als JSON-String)
  const tokenData = { username: data.username, role: data.role, ts: Date.now() };
  const token = btoa(JSON.stringify(tokenData));

  return new Response(JSON.stringify({ token, mustChangePassword: data.mustChangePassword }), {
    headers: { "Content-Type": "application/json" }
  });
}
