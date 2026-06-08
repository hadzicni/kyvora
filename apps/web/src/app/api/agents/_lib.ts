import { NextResponse } from "next/server";

export const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

export function createAuthorizationHeader(): Record<string, string> {
  const username = process.env.API_USERNAME;
  const password = process.env.API_PASSWORD;

  if (!username || !password) {
    return {};
  }

  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
      "base64"
    )}`,
  };
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

export function agentApiUnavailableResponse() {
  return NextResponse.json(
    { message: "Unable to connect to the agent management API." },
    { status: 502 }
  );
}
