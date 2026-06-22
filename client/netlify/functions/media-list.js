import { getDatabase } from "@netlify/database";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers });
  }

  const db = getDatabase();
  const files = await db.sql`SELECT * FROM files ORDER BY uploaded_at DESC`;

  return Response.json(files, { headers });
};

export const config = {
  path: "/api/media/list",
};
