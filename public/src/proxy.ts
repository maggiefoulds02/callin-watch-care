import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every navigation (this is what
 * Next.js calls an "optimistic check" — see the Next.js authentication
 * guide). This alone does NOT authorize access to /admin or /portal: it
 * only keeps the session cookie current so Server Components can read a
 * valid session. Real authorization (is this user an owner? do they own
 * this job?) happens in the Data Access Layer close to the data — see
 * src/lib/dal.ts — because proxy runs on every request/prefetch and
 * should stay cheap (no database round trip here).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Triggers a token refresh if the access token is expired, writing the
  // new cookies onto `response` via setAll above.
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/admin") || path.startsWith("/portal");

  if (isProtected && !data?.claims) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, image optimization, and
     * common metadata files — auth-relevant routes (including /admin,
     * /portal, and RSC data requests) still pass through.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
