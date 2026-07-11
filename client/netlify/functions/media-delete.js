import { getDatabase } from "@netlify/database";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
  const rows = await db.sql`SELECT blob_key, mime_type, storage_driver FROM files WHERE id = ${id}`;
  if (rows.length === 0) {
    return Response.json({ error: "File not found" }, { status: 404, headers });
  }

  const { blob_key, mime_type, storage_driver } = rows[0];
  if (storage_driver === "cloudinary") {
    const resourceType = String(mime_type).startsWith("image/") ? "image" : "video";
    await cloudinary.uploader.destroy(blob_key, { resource_type: resourceType, invalidate: true });
  }

  await db.sql`DELETE FROM files WHERE id = ${id}`;

  return Response.json({ success: true }, { headers });
};

export const config = {
  path: "/api/media/delete",
};
