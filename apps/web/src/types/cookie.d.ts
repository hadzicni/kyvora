declare module "cookie" {
  export type CookieSerializeOptions = {
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | "lax" | "strict" | "none";
    secure?: boolean;
  };

  export function serialize(
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ): string;
}
