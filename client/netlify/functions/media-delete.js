import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  let id;
  try {
    const body = await req.json();
    id = body.id;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers });
  }

  if (!id) {
    return Response.json({ error: "Missing file id" }, { status: 400, headers });
  }

  const db = getDatabase();
  const rows = await db.sql`SELECT blob_key FROM files WHERE id = ${id}`;
  if (rows.length === 0) {
    return Response.json({ error: "File not found" }, { status: 404, headers });
  }

  const { blob_key } = rows[0];

  const store = getStore("media");
  await store.delete(blob_key);

  await db.sql`DELETE FROM files WHERE id = ${id}`;

  return Response.json({ success: true }, { headers });
};

export const config = {
  path: "/api/media/delete",
};
