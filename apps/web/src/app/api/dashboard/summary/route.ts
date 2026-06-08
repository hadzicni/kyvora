import { NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

function createAuthorizationHeader(): Record<string, string> {
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

function createBackendResponse(response: Response, body: string) {
  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET() {
  try {
    const response = await fetch(
      new URL("/api/v1/dashboard/summary", apiBaseUrl),
      {
        headers: {
          Accept: "application/json",
          ...createAuthorizationHeader(),
        },
        cache: "no-store",
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the dashboard API." },
      { status: 502 }
    );
  }
}
