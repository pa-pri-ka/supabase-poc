import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// These env vars are injected by the functions container
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role key bypasses RLS
);

const BUCKET = "app-files";
const FUNCTION_NAME = "serve-app";

// Map file extensions to Content-Type headers
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

serve(async (req: Request) => {
  const url = new URL(req.url);
  let path = url.pathname;

  // The edge runtime prefixes the path with the function name.
  // e.g. "/serve-app/mycss.css" → "mycss.css"
  //      "/serve-app/"           → ""
  const fnPrefix = `/${FUNCTION_NAME}`;
  if (path.startsWith(fnPrefix)) {
    path = path.slice(fnPrefix.length);
  }

  // Strip leading/trailing slashes
  path = path.replace(/^\/+/, "").replace(/\/+$/, "");

  // Root path → serve index.html
  if (path === "") {
    path = "index.html";
  }

  console.log(`[serve-app] Requested: ${path}`);

  // Try to fetch the file from Storage
  let { data, error } = await supabase.storage.from(BUCKET).download(path);

  if (error) {
    // SPA fallback: if the file doesn't exist, serve index.html.
    // This handles client-side routes like /dashboard, /profile, etc.
    console.log(`[serve-app] Not found (${path}), falling back to index.html`);

    const fallback = await supabase.storage.from(BUCKET).download("index.html");

    if (fallback.error) {
      return new Response("Not Found", { status: 404 });
    }

    const html = await fallback.data.text();
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Determine Content-Type from file extension
  const ext = path.substring(path.lastIndexOf("."));
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    },
  });
});