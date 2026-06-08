import { NextResponse } from "next/server";

export const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
};

type AuthState = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number;
};

let authState: AuthState | null = null;
let authPromise: Promise<AuthState> | null = null;

function cacheTokens(tokens: TokenResponse): AuthState {
  const tokenType = tokens.tokenType || "Bearer";
  authState = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType,
    expiresAt: Date.now() + tokens.expiresIn * 1000 - 30_000,
  };
  return authState;
}

function getLoginCredentials() {
  const email = process.env.API_LOGIN_EMAIL;
  const password = process.env.API_LOGIN_PASSWORD;

  if (!email || !password) {
    throw new Error("API_LOGIN_EMAIL and API_LOGIN_PASSWORD must be set");
  }

  return { email, password };
}

async function requestTokens(path: string, body: unknown): Promise<AuthState> {
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
    throw new Error(`Authentication failed with HTTP ${response.status}`);
  }

  return cacheTokens((await response.json()) as TokenResponse);
}

async function login(): Promise<AuthState> {
  return requestTokens("/api/v1/auth/login", getLoginCredentials());
}

async function refresh(): Promise<AuthState> {
  if (!authState?.refreshToken) {
    throw new Error("No refresh token is available");
  }

  return requestTokens("/api/v1/auth/refresh", {
    refreshToken: authState.refreshToken,
  });
}

async function refreshOrLogin(): Promise<AuthState> {
  try {
    return await refresh();
  } catch {
    authState = null;
    return login();
  }
}

async function getAuthState(): Promise<AuthState> {
  if (authState && authState.expiresAt > Date.now()) {
    return authState;
  }

  if (!authPromise) {
    authPromise = (authState?.refreshToken ? refreshOrLogin() : login()).finally(
      () => {
        authPromise = null;
      }
    );
  }

  return authPromise;
}

async function fetchWithAuth(input: URL, init: RequestInit) {
  const tokens = await getAuthState();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `${tokens.tokenType} ${tokens.accessToken}`);

  return fetch(input, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function backendFetch(input: URL, init: RequestInit = {}) {
  const response = await fetchWithAuth(input, init);

  if (response.status !== 401) {
    return response;
  }

  await response.body?.cancel();
  await refreshOrLogin();

  return fetchWithAuth(input, init);
}

export function createBackendResponse(response: Response, body: string) {
  if ([204, 205, 304].includes(response.status)) {
    return new NextResponse(null, {
      status: response.status,
      statusText: response.statusText,
    });
  }

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export function backendApiUnavailableResponse(message: string) {
  return NextResponse.json({ message }, { status: 502 });
}
