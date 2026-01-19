/* c:\Users\Weri\Documents\dev\card-managment\lib\auth.ts */
import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.AUTH_SECRET || 'sua-chave-secreta-super-segura-troque-isso'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // Sessão dura 24 horas
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}
