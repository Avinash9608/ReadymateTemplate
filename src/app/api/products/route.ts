import { NextRequest, NextResponse } from 'next/server';
import { addProduct } from '@/lib/products';
import { uploadImageToCloudinary } from '@/lib/cloudinaryUpload';

export const runtime = 'nodejs'; // Ensure Node.js runtime for buffer support

export async function POST(req: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const price = Number(formData.get('price'));
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const features = formData.getAll('features') as string[];
    const dimensions = formData.get('dimensions') as string;
    const material = formData.get('material') as string;
    const stock = Number(formData.get('stock'));
    const dataAiHint = formData.get('dataAiHint') as string;
    const imageFile = formData.get('image') as File | null;

    let imageUrl: string | undefined = undefined;
    let imagePath: string | undefined = undefined;
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `${slug}-${Date.now()}`;
      const uploadResult = await uploadImageToCloudinary(buffer, fileName);
      imageUrl = uploadResult.url;
      imagePath = uploadResult.public_id;
    }

    const productId = await addProduct({
      name,
      slug,
      description,
      price,
      category,
      status: status as any,
      features,
      dimensions,
      material,
      stock,
      dataAiHint,
      imageUrl,
      imagePath,
    });

    return NextResponse.json({ success: true, productId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 