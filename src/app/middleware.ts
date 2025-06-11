import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/room/"];
const publicAuthRoutes = ["/auth", "/auth/reset-password"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, ...options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to public auth routes regardless of session status
  if (
    publicAuthRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    return response;
  }

  // Protect other routes
  if (
    protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route),
    ) &&
    !session
  ) {
    const redirectUrl = new URL("/auth", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
