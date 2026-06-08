import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
export const authUrl =
  process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
export const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
export const useSecureCookies = authUrl.startsWith("https://");
export const authSessionMaxAgeSeconds = 30 * 24 * 60 * 60;

const tokenSkewMs = 30_000;

type BackendUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

type BackendAuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  user: BackendUser;
};

type AuthUser = BackendUser & {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
};

async function postAuthRequest<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse | null> {
  if (!apiBaseUrl) {
    return null;
  }

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

async function loginBackend(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const response = await postAuthRequest<BackendAuthResponse>(
    "/api/v1/auth/login",
    { email, password }
  );

  if (!response) {
    return null;
  }

  return {
    id: response.user.id,
    email: response.user.email,
    displayName: response.user.displayName,
    role: response.user.role,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt:
      Date.now() + response.expiresIn * 1000 - tokenSkewMs,
  };
}

async function refreshBackend(refreshToken: string): Promise<AuthUser | null> {
  const response = await postAuthRequest<BackendAuthResponse>(
    "/api/v1/auth/refresh",
    { refreshToken }
  );

  if (!response) {
    return null;
  }

  return {
    id: response.user.id,
    email: response.user.email,
    displayName: response.user.displayName,
    role: response.user.role,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    accessTokenExpiresAt:
      Date.now() + response.expiresIn * 1000 - tokenSkewMs,
  };
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: authSessionMaxAgeSeconds,
  },
  jwt: {
    maxAge: authSessionMaxAgeSeconds,
  },
  useSecureCookies,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Kyvora credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@kyvora.local",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        return loginBackend(email, password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpiresAt = user.accessTokenExpiresAt;
        token.user = {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        };
        token.error = undefined;
        return token;
      }

      const expiresAt = token.accessTokenExpiresAt;
      if (typeof expiresAt === "number" && expiresAt > Date.now()) {
        return token;
      }

      if (typeof token.refreshToken !== "string") {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      const refreshed = await refreshBackend(token.refreshToken);
      if (!refreshed) {
        token.error = "RefreshAccessTokenError";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.refreshToken = refreshed.refreshToken;
      token.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
      token.user = {
        id: refreshed.id,
        email: refreshed.email,
        displayName: refreshed.displayName,
        role: refreshed.role,
      };
      token.error = undefined;
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.user?.id ?? "",
        email: token.user?.email ?? "",
        displayName: token.user?.displayName ?? "",
        role: token.user?.role ?? "",
      };

      if (token.error) {
        session.error = token.error;
      } else {
        delete session.error;
      }

      return session;
    },
  },
};

export const handlers = NextAuth(authOptions);

export const auth = () => getServerSession(authOptions);

export { signIn, signOut } from "next-auth/react";
