import { jwtVerify, SignJWT } from 'jose';

export async function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAuth(token: string) {
  try {
    const verified = await jwtVerify(token, await getJwtSecretKey());
    return verified.payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function verifyJwtToken(token: string) {
  try {
    const verified = await jwtVerify(token, await getJwtSecretKey());
    return verified.payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function signJwtToken(payload: any, expiresIn = '7d') {
  const secretKey = await getJwtSecretKey();

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}
