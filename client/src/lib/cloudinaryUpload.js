function cloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) return null;
  return { cloudName, uploadPreset };
}

export function cloudinaryUploadsEnabled() {
  return Boolean(cloudinaryConfig());
}

export async function uploadGalleryImageToCloudinary(file, folder = "gotham-gallery") {
  const config = cloudinaryConfig();
  if (!config) return null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Cloudinary upload failed");
  return data.secure_url;
}
