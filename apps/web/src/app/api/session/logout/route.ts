import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { apiBaseUrl, authSecret, useSecureCookies } from "@/auth";

function getSecret() {
  if (!authSecret) {
    throw new Error("NEXTAUTH_SECRET must be set");
  }

  return authSecret;
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: getSecret(),
    secureCookie: useSecureCookies,
  });

  const accessToken =
    typeof token?.accessToken === "string" ? token.accessToken : null;
  const refreshToken =
    typeof token?.refreshToken === "string" ? token.refreshToken : null;

  if (!accessToken || !refreshToken) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await fetch(new URL("/api/v1/auth/logout", apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // The browser logout flow should continue even if backend revocation fails.
  }

  return new NextResponse(null, { status: 204 });
}
