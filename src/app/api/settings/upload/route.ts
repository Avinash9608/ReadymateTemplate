import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = 'nodejs';
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'site-logos', resource_type: 'image' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });
    // @ts-ignore
    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Upload failed.' }, { status: 500 });
  }
} 