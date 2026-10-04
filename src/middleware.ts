import { NextResponse, type NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://192.168.1.11:8090"; console.log("MIDDLEWARE PB URL:", pbUrl); const pb = new PocketBase(pbUrl);
  
  // Load the store data from the request cookie string
  const cookieHeader = request.headers.get('cookie') || '';
  pb.authStore.loadFromCookie(cookieHeader);

  try {
    // get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh();
    }
  } catch (error) { console.error("MIDDLEWARE ERROR:", error);
    // clear the auth store on failed refresh
    pb.authStore.clear();
  }

  // Define public routes
  const isPublicRoute = request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/api') ||
                        request.nextUrl.pathname === '/'; // Assuming landing is public, adjust if not

  if (!pb.authStore.isValid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pb.authStore.isValid && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Export the updated auth store data back to the response cookie
  response.headers.append(
    'set-cookie',
    pb.authStore.exportToCookie({ secure: false, httpOnly: true })
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
