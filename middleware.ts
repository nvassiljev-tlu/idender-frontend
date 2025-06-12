import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const lang = request.cookies.get('lang')?.value || 'et';

  // Only redirect from the root
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL(`/${lang}`, request.url));
  }

  return NextResponse.next();
}
