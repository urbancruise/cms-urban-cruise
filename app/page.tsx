import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      redirect('/admin');
    } catch {
      redirect('/login');
    }
  }
  redirect('/login');
}

