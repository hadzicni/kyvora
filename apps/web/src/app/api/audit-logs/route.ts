import { NextResponse, type NextRequest } from "next/server";

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

function createBackendUrl(request: NextRequest) {
  const backendUrl = new URL("/api/v1/audit-logs", apiBaseUrl);
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
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

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(createBackendUrl(request), {
      headers: {
        Accept: "application/json",
        ...createAuthorizationHeader(),
      },
      cache: "no-store",
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the audit log API." },
      { status: 502 }
    );
  }
}
