import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../_lib/backend";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function createBackendUrl(context: RouteContext) {
  const { id } = await context.params;
  return new URL(`/api/v1/users/${encodeURIComponent(id)}`, apiBaseUrl);
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(request, await createBackendUrl(context), {
      headers: { Accept: "application/json" },
    });
    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the users API." },
      { status: 502 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(request, await createBackendUrl(context), {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: await request.text(),
    });
    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the users API." },
      { status: 502 }
    );
  }
}
