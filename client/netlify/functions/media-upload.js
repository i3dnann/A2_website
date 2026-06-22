import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  let formData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400, headers });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ error: "No file provided" }, { status: 400, headers });
  }

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobKey = `uploads/${crypto.randomUUID()}-${safeFilename}`;
  const arrayBuffer = await file.arrayBuffer();

  const store = getStore("media");
  await store.set(blobKey, arrayBuffer);

  const db = getDatabase();
  const rows = await db.sql`
    INSERT INTO files (original_name, mime_type, size, blob_key)
    VALUES (${file.name}, ${file.type || "application/octet-stream"}, ${file.size}, ${blobKey})
    RETURNING *
  `;

  return Response.json(rows[0], { status: 201, headers: { ...headers, "Content-Type": "application/json" } });
};

export const config = {
  path: "/api/media/upload",
};
