/* c:\Users\Weri\Documents\dev\card-managment\middleware.ts */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  // Pega o header de autorização (Basic Auth)
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    // Decodifica o header "Basic base64..."
    const authValue = basicAuth.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    // Defina suas credenciais aqui ou, idealmente, em variáveis de ambiente (.env)
    // Ex: BASIC_AUTH_USER=admin e BASIC_AUTH_PASS=senha123
    const validUser = process.env.BASIC_AUTH_USER
    const validPass = process.env.BASIC_AUTH_PASS

    if (user === validUser && pwd === validPass) {
      // Se autenticado, injeta o ID do usuário nos headers para a API usar
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  // Se não autenticado, retorna 401 e pede login ao navegador
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

export const config = {
  // Protege todas as rotas, exceto arquivos estáticos e imagens do Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
