import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/pos', '/orders', '/inventory', '/customers', '/promotions', '/reports', '/menu', '/settings']

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    if (isProtectedRoute) {
        // Check for session cookie
        const hasSession = request.cookies.has('pos_session')

        if (!hasSession) {
            // Redirect to login/role-select if not authenticated
            const url = request.nextUrl.clone()
            url.pathname = '/role-select'
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - role-select (login page)
         * - pin-login (login page)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|role-select|pin-login).*)',
    ],
}
