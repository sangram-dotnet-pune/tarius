// Filename: src/proxy.ts

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => request.cookies.set(c.name, c.value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach((c) => supabaseResponse.cookies.set(c.name, c.value, c.options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname.startsWith('/admin/login');
  const isForgotRoute = request.nextUrl.pathname.startsWith('/admin/forgot-password');
  const isResetRoute = request.nextUrl.pathname.startsWith('/admin/reset-password');
  
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') && !isLoginRoute && !isForgotRoute && !isResetRoute;

  // 1. Unauthenticated users trying to access the main dashboard get bounced to login
  if (!user && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // NOTE: We deliberately do NOT bounce unauthenticated users on isResetRoute 
  // because the browser needs to load the page to process the recovery token!

  if (user) {
    const { data: profile } = await supabase
      .from('AdminProfile')
      .select('needs_password_reset')
      .eq('id', user.id)
      .single();
    
    const needsReset = profile?.needs_password_reset === true;

    // 2. User is logged in, but their profile is flagged for a mandatory password reset
    if (needsReset && isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/reset-password';
      return NextResponse.redirect(url);
    }

    // 3. User is logged in, has a secure password, and tries to visit auth pages -> Send to dashboard
    if (!needsReset && (isLoginRoute || isForgotRoute || isResetRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};