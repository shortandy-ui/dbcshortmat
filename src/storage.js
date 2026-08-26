// Stands in for the `window.storage` API that Claude artifacts get for free.
// Backed by the Azure Function in /api/storage, which stores each key as a
// blob in Azure Blob Storage. Every call in this app uses shared:true (there's
// no per-user login, just an admin password), so that's all this needs to support.

async function get(key) {
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
  if (res.status === 404) {
    throw new Error("not found");
  }
  if (!res.ok) {
    throw new Error(`storage get failed: ${res.status}`);
  }
  return res.json(); // { key, value, shared }
}

async function set(key, value) {
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function del(key) {
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) return null;
  return res.json();
}

async function list(prefix) {
  const params = new URLSearchParams();
  if (prefix) params.set("prefix", prefix);
  const res = await fetch(`/api/storage-list?${params.toString()}`);
  if (!res.ok) return { keys: [] };
  return res.json();
}

export const storage = { get, set, delete: del, list };
