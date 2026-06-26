import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  const store = getStore("media");
  const blob = await store.get(key, { type: "blob" });

  if (!blob) {
    return new Response("File not found", { status: 404 });
  }

  const db = getDatabase();
  const rows = await db.sql`SELECT mime_type FROM files WHERE blob_key = ${key}`;
  const mimeType = rows[0]?.mime_type || blob.type || "application/octet-stream";

  return new Response(blob, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = {
  path: "/api/media/file",
};
