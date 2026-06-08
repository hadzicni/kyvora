import { NextResponse, type NextRequest } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

async function createBackendUrl(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const backendUrl = new URL(
    `/api/v1/servers/${encodeURIComponent(id)}`,
    apiBaseUrl
  );
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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const response = await fetch(await createBackendUrl(request, context), {
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
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const response = await fetch(await createBackendUrl(request, context), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...createAuthorizationHeader(),
      },
      body: await request.text(),
      cache: "no-store",
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const response = await fetch(await createBackendUrl(request, context), {
      method: "DELETE",
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
      { message: "Unable to connect to the inventory API." },
      { status: 502 }
    );
  }
}
