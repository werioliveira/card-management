/* c:\Users\Weri\Documents\dev\card-managment\middleware.ts */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const isPublicPath = pathname === '/login' || pathname === '/register'

  // Se não tem sessão e tenta acessar rota protegida -> Login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    try {
      const payload = await decrypt(session)
      
      // Se já está logado e tenta acessar login/register -> Dashboard
      if (isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Injeta o ID do usuário nos headers para a API usar (mantém compatibilidade)
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.sub as string)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      // Token inválido ou expirado
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('session')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  // Ignora rotas de API de auth, estáticos e imagens
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
