import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (token) {
    let valid = false;
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      valid = true;
    } catch {
      valid = false;
    }
    redirect(valid ? '/admin' : '/login');
  }

  redirect('/login');
}