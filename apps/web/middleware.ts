import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export default withAuth(
  function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const mustChangePassword =
      request.nextauth.token?.user?.mustChangePassword === true;

    if (mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    if (!mustChangePassword && pathname === "/change-password") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) =>
        Boolean(token?.accessToken && token?.refreshToken && !token.error),
    },
    secret: authSecret,
  }
);

export const config = {
  matcher: [
    "/",
    "/servers/:path*",
    "/agents/:path*",
    "/activity/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/help/:path*",
    "/profile/:path*",
    "/change-password",
  ],
};
