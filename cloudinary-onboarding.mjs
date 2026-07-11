#!/usr/bin/env node

import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const sampleImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

try {
  const upload = await cloudinary.uploader.upload(sampleImageUrl, {
    folder: "codex-cloudinary-onboarding",
    overwrite: true,
  });

  console.log(`Secure URL: ${upload.secure_url}`);
  console.log(`Public ID: ${upload.public_id}`);

  const details = await cloudinary.api.resource(upload.public_id, {
    resource_type: "image",
  });

  console.log(`Width: ${details.width}`);
  console.log(`Height: ${details.height}`);
  console.log(`Format: ${details.format}`);
  console.log(`File size: ${details.bytes} bytes`);

  const transformedUrl = cloudinary.url(upload.public_id, {
    secure: true,
    fetch_format: "auto", // f_auto selects the best image format for the requesting browser.
    quality: "auto", // q_auto balances visual quality with a smaller file size.
  });

  console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
  console.log(transformedUrl);
} catch (error) {
  console.error("Cloudinary onboarding failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
