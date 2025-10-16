import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = "ein_geheimes_schluesselwort"; // unbedingt ersetzen!

// Initial-User (Passwörter werden gehasht beim Setup)
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

// --- 1️⃣ KV Initialisierung ---
export async function initKV(kv) {
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    await kv.put(`user:${user.username}`, JSON.stringify({
      username: user.username,
      passwordHash: hash,
      displayName: user.displayName,
      role: user.role,
      categories: {
        "LemGOesHANA": { immutable: true, entries: [] }
      },
      mustChangePassword: true
    }));
  }
}

// --- 2️⃣ Login ---
export async function handleLogin(request, kv) {
  const { username, password } = await request.json();
  const data = await kv.get(`user:${username}`, { type: "json" });
  if (!data) return new Response("User not found", { status: 404 });

  const valid = await bcrypt.compare(password, data.passwordHash);
  if (!valid) return new Response("Invalid password", { status: 401 });

  // JWT payload
  const token = jwt.sign({ username: data.username, role: data.role }, JWT_SECRET, { expiresIn: '8h' });

  return new Response(JSON.stringify({
    token,
    mustChangePassword: data.mustChangePassword
  }), { headers: { 'Content-Type': 'application/json' } });
}

// --- 3️⃣ Passwort ändern ---
export async function handleChangePassword(request, kv) {
  const { username, newPassword } = await request.json();
  const data = await kv.get(`user:${username}`, { type: "json" });
  if (!data) return new Response("User not found", { status: 404 });

  const hash = await bcrypt.hash(newPassword, 10);
  data.passwordHash = hash;
  data.mustChangePassword = false;

  await kv.put(`user:${username}`, JSON.stringify(data));
  return new Response("Password updated", { status: 200 });
}

// --- 4️⃣ Kategorien abrufen ---
export async function handleGetCategories(request, kv, token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const data = await kv.get(`user:${decoded.username}`, { type: "json" });
    if (!data) return new Response("Unauthorized", { status: 401 });

    if (data.role === "admin") {
      return new Response(JSON.stringify({ "LemGOesHANA": data.categories.LemGOesHANA }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data.categories), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response("Invalid token", { status: 401 });
  }
}

// --- 5️⃣ Kategorien aktualisieren (nur für normale User, nicht immutable) ---
export async function handleUpdateCategory(request, kv, token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const data = await kv.get(`user:${decoded.username}`, { type: "json" });
    if (!data) return new Response("Unauthorized", { status: 401 });

    if (data.role === "admin") return new Response("Admins cannot modify categories", { status: 403 });

    const { categoryName, entries } = await request.json();
    if (!data.categories[categoryName]) return new Response("Category not found", { status: 404 });
    if (data.categories[categoryName].immutable) return new Response("Category immutable", { status: 403 });

    data.categories[categoryName].entries = entries;
    await kv.put(`user:${decoded.username}`, JSON.stringify(data));

    return new Response("Category updated", { status: 200 });
  } catch (err) {
    return new Response("Invalid token", { status: 401 });
  }
}
