import { withAuth } from "next-auth/middleware";

import { authSecret } from "@/auth";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) =>
      Boolean(token?.accessToken && token?.refreshToken && !token.error),
  },
  secret: authSecret,
});

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
  ],
};
