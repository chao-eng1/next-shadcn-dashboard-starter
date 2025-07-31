import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/auth/sign-in`);
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      redirect(`/${locale}/auth/sign-in`);
    }

    const secretKey = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secretKey);
    redirect(`/${locale}/dashboard`);
  } catch (error) {
    redirect(`/${locale}/auth/sign-in`);
  }
}
