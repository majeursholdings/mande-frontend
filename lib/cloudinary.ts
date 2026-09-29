import { v2 as cloudinary } from "cloudinary";

export function getCloudinaryCredentials() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  const url = process.env.CLOUDINARY_URL;
  if (url && (!cloudName || !apiKey || !apiSecret)) {
    try {
      const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    } catch (e) {
      console.warn("Failed to parse CLOUDINARY_URL:", e);
    }
  }

  return {
    cloudName: cloudName,
    apiKey: apiKey,
    apiSecret: apiSecret,
  };
}

const creds = getCloudinaryCredentials();

cloudinary.config({
  cloud_name: creds.cloudName,
  api_key: creds.apiKey,
  api_secret: creds.apiSecret,
  secure: true,
});

export { cloudinary };
