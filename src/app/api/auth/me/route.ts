import { NextRequest, NextResponse } from 'next/server';
import jwt, { Secret } from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as Secret) as any;
    // Only return safe user info
    return NextResponse.json({ success: true, user: { email: decoded.email, name: decoded.name, isAdmin: decoded.isAdmin } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }
} 