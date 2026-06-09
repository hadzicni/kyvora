import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      displayName: string;
      role: string;
      mustChangePassword: boolean;
    };
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    displayName: string;
    role: string;
    mustChangePassword: boolean;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    user?: {
      id: string;
      email: string;
      displayName: string;
      role: string;
      mustChangePassword: boolean;
    };
    error?: string;
  }
}
