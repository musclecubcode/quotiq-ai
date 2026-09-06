export function supabaseProjectRef(value: string) {
  try { return new URL(value).hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1] ?? null; }
  catch { return null; }
}

export function databaseProjectRef(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1]
      ?? decodeURIComponent(url.username).match(/^postgres\.([a-z0-9]+)$/)?.[1]
      ?? null;
  } catch { return null; }
}

export function serviceRoleProjectRef(value: string) {
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8")) as { ref?: unknown };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch { return null; }
}
