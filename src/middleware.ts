import { NextResponse, type NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://192.168.1.11:8090";
  const pb = new PocketBase(pbUrl);
  
  // Read the pb_auth cookie directly (it's stored as raw JSON by the login action)
  const pbCookie = request.cookies.get('pb_auth');

  if (pbCookie?.value) {
    try {
      const data = JSON.parse(pbCookie.value);
      pb.authStore.save(data.token, data.record || data.model);
    } catch (e) {
      // cookie is malformed, ignore
    }
  }

  // Define public routes
  const isPublicRoute = request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/api') ||
                        request.nextUrl.pathname === '/';

  if (!pb.authStore.isValid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pb.authStore.isValid && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
