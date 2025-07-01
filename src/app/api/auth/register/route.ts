import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/lib/user';
import dbConnect from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, password, name } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
  }
  const existing = await UserModel.findOne({ email });
  if (existing) {
    return NextResponse.json({ success: false, error: 'Email already registered.' }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const userCount = await UserModel.countDocuments();
  const isAdmin = userCount === 0; // First user is admin
  const user = await UserModel.create({ email, password: hashed, name, isAdmin });
  // @ts-expect-error: TypeScript type mismatch, but usage is correct for runtime
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email, name: user.name, isAdmin: user.isAdmin } as object,
    process.env.JWT_SECRET as Secret,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
  return NextResponse.json({ success: true, token, user: { email: user.email, name: user.name, isAdmin: user.isAdmin } });
} 