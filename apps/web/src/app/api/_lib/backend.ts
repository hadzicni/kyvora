import { serialize } from "cookie";
import { type NextRequest, NextResponse } from "next/server";
import { type JWT, encode, getToken } from "next-auth/jwt";

import {
  apiBaseUrl,
  authSecret,
  authSessionMaxAgeSeconds,
  useSecureCookies,
} from "@/auth";

export { apiBaseUrl } from "@/auth";

type BackendUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  mustChangePassword: boolean;
};

type BackendAuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  user: BackendUser;
};

const tokenSkewMs = 30_000;
const sessionCookieName = useSecureCookies
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

function getSecret() {
  if (!authSecret) {
    throw new Error("NEXTAUTH_SECRET must be set");
  }

  return authSecret;
}

function normalizeAuthToken(token: JWT) {
  return {
    accessToken: typeof token.accessToken === "string" ? token.accessToken : "",
    refreshToken:
      typeof token.refreshToken === "string" ? token.refreshToken : "",
    accessTokenExpiresAt:
      typeof token.accessTokenExpiresAt === "number"
        ? token.accessTokenExpiresAt
        : 0,
    user: token.user,
  };
}

function getTokenExpiration(expiresIn: number) {
  return Date.now() + expiresIn * 1000 - tokenSkewMs;
}

async function postAuthRequest<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse | null> {
  try {
    const response = await fetch(new URL(path, apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TResponse;
  } catch {
    return null;
  }
}

async function refreshBackendTokens(refreshToken: string) {
  const response = await postAuthRequest<BackendAuthResponse>(
    "/api/v1/auth/refresh",
    { refreshToken }
  );

  if (!response) {
    return null;
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt: getTokenExpiration(response.expiresIn),
    user: response.user,
  };
}

async function setAuthCookies(token: JWT) {
  const tokenValue = await encode({
    secret: getSecret(),
    token,
    maxAge: authSessionMaxAgeSeconds,
  });

  return [
    serialize(sessionCookieName, tokenValue, {
      expires: new Date(Date.now() + authSessionMaxAgeSeconds * 1000),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: useSecureCookies,
    }),
  ];
}

async function cloneResponseWithCookies(
  response: Response,
  cookies: string[]
) {
  const headers = new Headers(response.headers);
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));

  if ([204, 205, 304].includes(response.status)) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function getRequestToken(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: getSecret(),
    secureCookie: useSecureCookies,
    cookieName: sessionCookieName,
  });

  return token ? normalizeAuthToken(token) : null;
}

export async function backendFetch(
  request: NextRequest,
  input: URL,
  init: RequestInit = {}
) {
  const token = await getRequestToken(request);

  if (!token?.accessToken || !token.refreshToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let accessToken = token.accessToken;
  let refreshToken = token.refreshToken;
  let accessTokenExpiresAt = token.accessTokenExpiresAt;
  let cookies: string[] = [];
  let refreshedThisRequest = false;

  if (accessTokenExpiresAt <= Date.now()) {
    const refreshed = await refreshBackendTokens(refreshToken);
    if (!refreshed) {
      cookies = await setAuthCookies({
        ...token,
        error: "RefreshAccessTokenError",
      });

      return await cloneResponseWithCookies(
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
        cookies
      );
    }

    accessToken = refreshed.accessToken;
    refreshToken = refreshed.refreshToken;
    accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
    refreshedThisRequest = true;
    cookies = await setAuthCookies({
      ...token,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      user: refreshed.user ?? token.user,
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status !== 401) {
    return cookies.length > 0
      ? await cloneResponseWithCookies(response, cookies)
      : response;
  }

  if (!refreshedThisRequest && accessTokenExpiresAt > Date.now()) {
    const refreshed = await refreshBackendTokens(refreshToken);
    if (!refreshed) {
      cookies = await setAuthCookies({
        ...token,
        error: "RefreshAccessTokenError",
      });

      return cookies.length > 0
        ? await cloneResponseWithCookies(response, cookies)
        : response;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

    const retryResponse = await fetch(input, {
      ...init,
      headers: retryHeaders,
      cache: "no-store",
    });

    cookies = await setAuthCookies({
      ...token,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
      user: refreshed.user ?? token.user,
    });

    return await cloneResponseWithCookies(retryResponse, cookies);
  }

  return cookies.length > 0
    ? await cloneResponseWithCookies(response, cookies)
    : response;
}

export function createBackendResponse(response: Response, body: string) {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    headers.append(key, value);
  });

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", response.headers.get("Content-Type") ?? "application/json");
  }

  if ([204, 205, 304].includes(response.status)) {
    return new NextResponse(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function backendApiUnavailableResponse(message: string) {
  return NextResponse.json({ message }, { status: 502 });
}
