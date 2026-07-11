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

  const arrayBuffer = await file.arrayBuffer();
  const dataUri = `data:${file.type || "application/octet-stream"};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "gotham-city/media",
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
  });

  const db = getDatabase();
  const rows = await db.sql`
    INSERT INTO files (original_name, mime_type, size, blob_key, url, storage_driver)
    VALUES (${file.name}, ${file.type || "application/octet-stream"}, ${uploaded.bytes || file.size}, ${uploaded.public_id}, ${uploaded.secure_url}, 'cloudinary')
    RETURNING *
  `;

  return Response.json(rows[0], { status: 201, headers: { ...headers, "Content-Type": "application/json" } });
};

export const config = {
  path: "/api/media/upload",
};
