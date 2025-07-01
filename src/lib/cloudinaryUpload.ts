import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config (ensure these are set in your .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary and return the URL and public_id
export const uploadImageToCloudinary = async (fileBuffer: Buffer, fileName: string) => {
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        public_id: fileName,
        resource_type: 'image',
      },
      (error: any, result: any) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    ).end(fileBuffer);
  });
}; 