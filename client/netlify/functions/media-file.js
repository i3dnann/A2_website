import { getDatabase } from "@netlify/database";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  const db = getDatabase();
  const rows = await db.sql`SELECT url FROM files WHERE blob_key = ${key}`;
  const fileUrl = rows[0]?.url;
  if (!fileUrl) {
    return new Response("File not found", { status: 404 });
  }
  return Response.redirect(fileUrl, 302);
};

export const config = {
  path: "/api/media/file",
};
