import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: '/',
};
